/**
 * Pipeline Runner
 * Main orchestrator for DLR/FLR/SSR simulation methods
 * Implements DAG-based async execution with rate limiting
 */

import type { LLMProvider } from '../llm/provider';
import type { Persona, ProductConcept, PricePoint } from '../simulate/types';
import type {
    PipelineConfig,
    RespondentResult,
    SimulationResult,
    RatingMethod,
    TaskKey,
    TaskStage
} from './types';
import { DEFAULT_PIPELINE_CONFIG, serializeTaskKey } from './types';
import { executeDLR } from './dlr';
import { executeFLR } from './flr';
import { executeSSR, computeAnchorEmbeddings } from './ssr';
import { PipelineThrottler } from './rate-limiter';
import { CostTracker, estimateCost, applyDryRunLimits } from './guardrails';
import { globalCache, createLLMCacheKey, createEmbeddingCacheKey } from './cache';
import { ANCHOR_SETS } from '../ssr/anchorSets';
import { expectedLikert, top2Box, bottom2Box, distributionEntropy } from '../ssr';

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: {
    completed: number;
    total: number;
    stage: string;
    creditsUsed: number;
}) => void;

/**
 * Run simulation with specified method
 */
export async function runPipeline(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    config: Partial<PipelineConfig> = {},
    onProgress?: ProgressCallback
): Promise<SimulationResult> {
    const startTime = Date.now();
    const runId = crypto.randomUUID();

    // Merge with defaults
    let fullConfig: PipelineConfig = { ...DEFAULT_PIPELINE_CONFIG, ...config };

    // Apply dry run limits if enabled
    if (fullConfig.dryRun) {
        fullConfig = applyDryRunLimits(fullConfig);
    }

    // Initialize throttler
    const throttler = new PipelineThrottler(
        fullConfig.rateLimits,
        {
            dlr: fullConfig.concurrency.dlr,
            flr: fullConfig.concurrency.flr,
            ssr: fullConfig.concurrency.ssr,
            embed: fullConfig.concurrency.embed,
        }
    );

    // Initialize cost tracker
    const costTracker = new CostTracker(fullConfig.costCapUSD);

    // Get cost estimate
    const estimate = estimateCost(
        fullConfig.nRespondents,
        fullConfig.method
    );

    // Pre-compute anchor embeddings for SSR
    let anchorEmbeddings: number[][][] | undefined;
    if (fullConfig.method === 'SSR') {
        anchorEmbeddings = await computeAnchorEmbeddings(provider, ANCHOR_SETS);
    }

    // Execute based on method
    const respondentResults = await executeMethod(
        provider,
        persona,
        concept,
        pricePoint,
        fullConfig,
        anchorEmbeddings,
        throttler,
        costTracker,
        runId,
        onProgress
    );

    // Aggregate PMFs
    const aggregatedPmf = aggregatePmfs(respondentResults.map(r => r.averagePmf));

    // Calculate metrics
    const metrics = {
        expectedLikert: expectedLikert(aggregatedPmf),
        top2Box: top2Box(aggregatedPmf),
        bottom2Box: bottom2Box(aggregatedPmf),
        entropy: distributionEntropy(aggregatedPmf),
    };

    const stats = costTracker.getStats();

    return {
        runId,
        conceptId: concept.id || 'default',
        method: fullConfig.method,
        config: fullConfig,
        respondents: respondentResults,
        aggregatedPmf,
        metrics,
        creditsUsed: estimate.creditsNeeded,
        durationMs: Date.now() - startTime,
    };
}

/**
 * Execute the appropriate method
 */
async function executeMethod(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    config: PipelineConfig,
    anchorEmbeddings: number[][][] | undefined,
    throttler: PipelineThrottler,
    costTracker: CostTracker,
    runId: string,
    onProgress?: ProgressCallback
): Promise<RespondentResult[]> {
    const results: RespondentResult[] = [];
    const totalTasks = config.nRespondents * config.nSamplesPerRespondent;
    let completed = 0;

    // Create all tasks
    const tasks: Array<{
        respondentId: number;
        sampleIdx: number;
    }> = [];

    for (let r = 0; r < config.nRespondents; r++) {
        for (let s = 0; s < config.nSamplesPerRespondent; s++) {
            tasks.push({ respondentId: r, sampleIdx: s });
        }
    }

    // Group results by respondent
    const respondentPmfs: Map<number, { pmfs: number[][]; rationales: string[] }> = new Map();

    // Execute tasks with concurrency control
    const executeTask = async (task: { respondentId: number; sampleIdx: number }) => {
        // Check cost cap
        if (costTracker.shouldStop()) {
            throw new Error('Cost cap exceeded');
        }

        let pmf: number[];
        let rationale: string | undefined;

        const stage = getStageForMethod(config.method);
        const estimatedTokens = config.method === 'DLR' ? 800 : 1000;

        await throttler.execute(stage, estimatedTokens, async () => {
            switch (config.method) {
                case 'DLR': {
                    const result = await executeDLR(provider, persona, concept, pricePoint, {
                        maxOutputTokens: config.maxOutputTokens.dlr,
                        reasoningEffort: config.reasoningEffort.dlr,
                    });
                    pmf = result.pmf;
                    break;
                }

                case 'FLR': {
                    const result = await executeFLR(provider, persona, concept, pricePoint, {
                        textMaxTokens: config.maxOutputTokens.flr_text,
                        ratingMaxTokens: config.maxOutputTokens.flr_rating,
                    });
                    pmf = result.pmf;
                    rationale = result.rationale;
                    break;
                }

                case 'SSR': {
                    if (!anchorEmbeddings) throw new Error('Anchor embeddings required for SSR');
                    const result = await executeSSR(
                        provider, persona, concept, pricePoint, anchorEmbeddings,
                        {
                            textMaxTokens: config.maxOutputTokens.ssr_text,
                            ssrParams: config.ssr,
                        }
                    );
                    pmf = result.pmf;
                    rationale = result.rationale;
                    break;
                }
            }

            // Record usage estimate
            costTracker.recordCall(700, config.method === 'DLR' ? 5 : 70);
        });

        // Store result
        if (!respondentPmfs.has(task.respondentId)) {
            respondentPmfs.set(task.respondentId, { pmfs: [], rationales: [] });
        }
        const entry = respondentPmfs.get(task.respondentId)!;
        entry.pmfs.push(pmf!);
        if (rationale) entry.rationales.push(rationale);

        completed++;
        onProgress?.({
            completed,
            total: totalTasks,
            stage: config.method,
            creditsUsed: Math.ceil(completed / (100 * config.nSamplesPerRespondent)),
        });
    };

    // Execute with batching for parallelism
    const batchSize = getBatchSize(config.method, config.concurrency);
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(executeTask));
    }

    // Build respondent results
    for (const [respondentId, entry] of respondentPmfs) {
        const averagePmf = aggregatePmfs(entry.pmfs);
        results.push({
            respondentId,
            samplePmfs: entry.pmfs,
            averagePmf,
            rationales: entry.rationales.length > 0 ? entry.rationales : undefined,
        });
    }

    return results;
}

/**
 * Get primary stage name for method
 */
function getStageForMethod(method: RatingMethod): string {
    switch (method) {
        case 'DLR': return 'dlr';
        case 'FLR': return 'flr';
        case 'SSR': return 'ssr';
    }
}

/**
 * Get batch size based on method and concurrency config
 */
function getBatchSize(method: RatingMethod, concurrency: { dlr: number; flr: number; ssr: number }): number {
    switch (method) {
        case 'DLR': return concurrency.dlr;
        case 'FLR': return concurrency.flr;
        case 'SSR': return concurrency.ssr;
    }
}

/**
 * Aggregate multiple PMFs into a single average PMF
 */
function aggregatePmfs(pmfs: number[][]): number[] {
    if (pmfs.length === 0) return [0.2, 0.2, 0.2, 0.2, 0.2];

    const summed = [0, 0, 0, 0, 0];
    for (const pmf of pmfs) {
        for (let i = 0; i < 5; i++) {
            summed[i] += pmf[i] ?? 0;
        }
    }

    return summed.map(v => v / pmfs.length);
}

/**
 * Bootstrap confidence interval
 */
export function bootstrapConfidence(
    pmfs: number[][],
    level: number = 0.95,
    nBootstrap: number = 1000
): { lower: number; upper: number } {
    if (pmfs.length === 0) return { lower: 0, upper: 0 };

    const top2Boxes: number[] = [];

    for (let b = 0; b < nBootstrap; b++) {
        // Sample with replacement
        const sampledPmf = [0, 0, 0, 0, 0];
        for (let i = 0; i < pmfs.length; i++) {
            const idx = Math.floor(Math.random() * pmfs.length);
            for (let k = 0; k < 5; k++) {
                sampledPmf[k] += pmfs[idx][k];
            }
        }
        for (let k = 0; k < 5; k++) {
            sampledPmf[k] /= pmfs.length;
        }
        top2Boxes.push(top2Box(sampledPmf));
    }

    top2Boxes.sort((a, b) => a - b);
    const alpha = 1 - level;
    const lowerIdx = Math.floor(nBootstrap * (alpha / 2));
    const upperIdx = Math.floor(nBootstrap * (1 - alpha / 2));

    return {
        lower: top2Boxes[lowerIdx] ?? 0,
        upper: top2Boxes[upperIdx] ?? 1,
    };
}
