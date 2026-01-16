/**
 * Pipeline Types
 * Defines the DAG task structure and configuration for DLR/FLR/SSR methods
 */

// Rating methods from the research paper
export type RatingMethod = 'DLR' | 'FLR' | 'SSR';

// Task stages in the pipeline DAG
export type TaskStage =
    | 'dlr_call'      // Direct Likert Rating: prompt → rating (1-5)
    | 'flr_text'      // FLR Stage A: prompt → free-text response
    | 'flr_rating'    // FLR Stage B: text → rating (1-5)
    | 'ssr_text'      // SSR Stage A: prompt → free-text response  
    | 'ssr_embed';    // SSR Stage B: text → embedding → PMF

/**
 * Unique identifier for a task in the DAG
 */
export interface TaskKey {
    runId: string;
    conceptId: string;
    respondentId: number;
    sampleIdx: number;
    stage: TaskStage;
}

/**
 * Serialize TaskKey to string for cache/storage
 */
export function serializeTaskKey(key: TaskKey): string {
    return `${key.runId}:${key.conceptId}:${key.respondentId}:${key.sampleIdx}:${key.stage}`;
}

/**
 * Deserialize string back to TaskKey
 */
export function deserializeTaskKey(str: string): TaskKey {
    const [runId, conceptId, respondentId, sampleIdx, stage] = str.split(':');
    return {
        runId,
        conceptId,
        respondentId: parseInt(respondentId, 10),
        sampleIdx: parseInt(sampleIdx, 10),
        stage: stage as TaskStage,
    };
}

/**
 * Task status in the DAG
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * A single task in the execution DAG
 */
export interface PipelineTask {
    key: TaskKey;
    status: TaskStatus;
    attempts: number;
    result?: unknown;
    error?: string;
    dependencies?: TaskKey[];  // Tasks that must complete before this one
}

/**
 * Concurrency configuration per stage
 */
export interface ConcurrencyConfig {
    dlr: number;      // Concurrent DLR calls
    flr: number;      // Concurrent FLR calls
    ssr: number;      // Concurrent SSR text calls
    embed: number;    // Concurrent embedding calls
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    rpm: number;      // Requests per minute
    tpm: number;      // Tokens per minute
    retryBackoffMs: number;  // Initial backoff on 429/5xx
    maxRetries: number;
}

/**
 * Per-stage reasoning effort configuration
 * (GPT-5.2 specific)
 */
export interface ReasoningConfig {
    dlr: 'none' | 'low';           // DLR is pure classification
    flr_text: 'medium' | 'high';   // FLR text needs some reasoning
    flr_rating: 'none' | 'low';    // FLR rating is classification
    ssr_text: 'medium' | 'high';   // SSR text needs reasoning
}

/**
 * Full pipeline configuration
 */
export interface PipelineConfig {
    method: RatingMethod;
    nRespondents: number;
    nSamplesPerRespondent: number;  // Default: 2

    // Execution settings
    concurrency: ConcurrencyConfig;
    rateLimits: RateLimitConfig;
    reasoningEffort: ReasoningConfig;

    // Output control
    maxOutputTokens: {
        dlr: number;        // Very small (rating only)
        flr_text: number;   // Modest (1-3 sentences)
        flr_rating: number; // Very small (rating only)
        ssr_text: number;   // Modest (1-3 sentences)
    };

    // SSR parameters
    ssr: {
        epsilon: number;
        temperature: number;
        anchorSets: number;  // Number of anchor sets to average
    };

    // Operational controls
    dryRun: boolean;        // Use 10 respondents, 1 sample
    costCapUSD: number | null;  // Stop if projected cost exceeds

    // Caching
    promptCacheKey?: string;  // For OpenAI extended caching
    usePersistentCache: boolean;
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
    method: 'SSR',
    nRespondents: 200,      // Quick screen default
    nSamplesPerRespondent: 2,

    concurrency: {
        dlr: 20,
        flr: 15,
        ssr: 15,
        embed: 30,
    },

    rateLimits: {
        rpm: 500,
        tpm: 150000,
        retryBackoffMs: 1000,
        maxRetries: 3,
    },

    reasoningEffort: {
        dlr: 'none',
        flr_text: 'medium',
        flr_rating: 'none',
        ssr_text: 'high',
    },

    maxOutputTokens: {
        dlr: 5,           // Just "1", "2", "3", "4", or "5"
        flr_text: 150,    // 1-3 sentences
        flr_rating: 5,    // Just the rating
        ssr_text: 150,    // 1-3 sentences
    },

    ssr: {
        epsilon: 0.01,
        temperature: 1,
        anchorSets: 6,
    },

    dryRun: false,
    costCapUSD: null,
    usePersistentCache: true,
};

/**
 * Result from a single respondent evaluation
 */
export interface RespondentResult {
    respondentId: number;
    samplePmfs: number[][];  // One PMF per sample
    averagePmf: number[];    // Average across samples
    rationales?: string[];   // Free-text responses (for FLR/SSR)
}

/**
 * Full simulation result
 */
export interface SimulationResult {
    runId: string;
    conceptId: string;
    method: RatingMethod;
    config: PipelineConfig;
    respondents: RespondentResult[];
    aggregatedPmf: number[];
    metrics: {
        expectedLikert: number;
        top2Box: number;
        bottom2Box: number;
        entropy: number;
    };
    creditsUsed: number;
    durationMs: number;
}
