/**
 * Price Point Simulation Engine
 * End-to-end orchestration using SSR methodology
 */

import { ssrPmfAverage, expectedLikert, top2Box, bottom2Box, distributionEntropy } from '../ssr';
import type { LLMProvider } from '../llm/provider';
import type { Persona, ProductConcept, PricePoint, SimulationConfig, SimulationResult } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { ANCHOR_SETS } from '../ssr/anchorSets';

interface SimulatePricePointArgs {
    provider: LLMProvider;
    persona: Persona;
    concept: ProductConcept;
    pricePoint: PricePoint;
    config: SimulationConfig;
    anchorSetEmbeddings?: number[][][]; // Pre-computed anchor embeddings
    onProgress?: (current: number, total: number) => void;
}

/**
 * Pre-compute anchor set embeddings (call once per session)
 */
export async function computeAnchorEmbeddings(provider: LLMProvider): Promise<number[][][]> {
    const embeddings: number[][][] = [];

    for (const anchorSet of ANCHOR_SETS) {
        const setEmbeddings: number[][] = [];
        for (const anchor of anchorSet) {
            const result = await provider.embedText({ text: anchor });
            setEmbeddings.push(result.embedding);
        }
        embeddings.push(setEmbeddings);
    }

    return embeddings;
}

/**
 * Simulate purchase intent for a single price point
 * Returns Likert distribution, metrics, and sample rationales
 */
export async function simulatePricePoint(args: SimulatePricePointArgs): Promise<SimulationResult> {
    const { provider, persona, concept, pricePoint, config, anchorSetEmbeddings, onProgress } = args;

    // Get anchor embeddings if not provided
    const anchors = anchorSetEmbeddings ?? await computeAnchorEmbeddings(provider);

    const pmfs: number[][] = [];
    const rationales: string[] = [];

    for (let i = 0; i < config.nRespondents; i++) {
        // Generate free-text response
        const userPrompt = buildUserPrompt(persona, concept, pricePoint);
        const response = await provider.generateText({
            system: SYSTEM_PROMPT,
            user: userPrompt,
            temperature: 0.7, // Some variability in responses
        });

        const text = response.text;
        rationales.push(text);

        // Embed response
        const embedding = await provider.embedText({ text });

        // Compute SSR PMF
        const pmf = ssrPmfAverage(embedding.embedding, anchors, config.ssr);
        pmfs.push(pmf);

        onProgress?.(i + 1, config.nRespondents);
    }

    // Aggregate PMFs
    const aggregatedPmf = [0, 0, 0, 0, 0];
    for (const pmf of pmfs) {
        for (let k = 0; k < 5; k++) {
            aggregatedPmf[k] += pmf[k];
        }
    }
    for (let k = 0; k < 5; k++) {
        aggregatedPmf[k] /= pmfs.length;
    }

    // Bootstrap confidence interval for top2box
    const confidence = bootstrapConfidence(pmfs, 0.95);

    return {
        pricePoint: pricePoint.price,
        segmentId: 'default', // Will be set by caller
        likertPmf: aggregatedPmf,
        expectedLikert: expectedLikert(aggregatedPmf),
        top2Box: top2Box(aggregatedPmf),
        bottom2Box: bottom2Box(aggregatedPmf),
        entropy: distributionEntropy(aggregatedPmf),
        sampleRationales: rationales.slice(0, 12), // Keep first 12 for display
        confidence
    };
}

/**
 * Bootstrap confidence interval for metrics
 */
function bootstrapConfidence(pmfs: number[][], level: number = 0.95): { lower: number; upper: number } {
    const nBootstrap = 1000;
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
        upper: top2Boxes[upperIdx] ?? 1
    };
}

/**
 * Run simulation across multiple price points
 */
export async function simulatePriceCurve(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoints: number[],
    config: SimulationConfig,
    onProgress?: (priceIdx: number, total: number, respondentIdx: number, respondentTotal: number) => void
): Promise<SimulationResult[]> {
    // Pre-compute anchors once
    const anchors = await computeAnchorEmbeddings(provider);

    const results: SimulationResult[] = [];

    for (let i = 0; i < pricePoints.length; i++) {
        const price = pricePoints[i];
        const result = await simulatePricePoint({
            provider,
            persona,
            concept,
            pricePoint: { price, purchaseType: 'one-time' },
            config,
            anchorSetEmbeddings: anchors,
            onProgress: (current, total) => onProgress?.(i, pricePoints.length, current, total)
        });
        results.push(result);
    }

    return results;
}

/**
 * Detect price cliffs (significant drops in intent)
 */
export function detectPriceCliffs(results: SimulationResult[], threshold: number = 0.1): Array<{
    fromPrice: number;
    toPrice: number;
    drop: number;
    percentDrop: number;
}> {
    const cliffs: Array<{
        fromPrice: number;
        toPrice: number;
        drop: number;
        percentDrop: number;
    }> = [];

    const sorted = [...results].sort((a, b) => a.pricePoint - b.pricePoint);

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        const drop = current.top2Box - next.top2Box;

        if (drop > threshold) {
            cliffs.push({
                fromPrice: current.pricePoint,
                toPrice: next.pricePoint,
                drop,
                percentDrop: drop / current.top2Box
            });
        }
    }

    return cliffs;
}
