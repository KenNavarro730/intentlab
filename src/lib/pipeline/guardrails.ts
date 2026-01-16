/**
 * Operational Guardrails
 * Cost tracking, dry run mode, and safety controls
 */

import { CREDIT_ECONOMICS } from '../stripe/plans';

/**
 * Cost estimator for a simulation run
 */
export interface CostEstimate {
    creditsNeeded: number;
    apiCostUSD: number;
    respondents: number;
    samplesPerRespondent: number;
    method: 'DLR' | 'FLR' | 'SSR';
    callsPerSample: number;  // DLR=1, FLR=2, SSR=2 (text+embed)
    totalCalls: number;
    warning?: string;
}

/**
 * Estimate cost for a simulation run
 * Simple rule: 1 credit = 100 respondents
 */
export function estimateCost(
    nRespondents: number,
    method: 'DLR' | 'FLR' | 'SSR'
): CostEstimate {
    // Internal constants (not exposed to user credit calculation)
    const nSamples = 2;  // samples per respondent for quality
    const callsPerSample = method === 'DLR' ? 1 : 2;  // FLR: text+rating, SSR: text+embed
    const totalCalls = nRespondents * nSamples * callsPerSample;

    // Simple credit calculation: 1 credit = 100 respondents
    const creditsNeeded = Math.ceil(nRespondents / CREDIT_ECONOMICS.respondentsPerCredit);
    const apiCostUSD = creditsNeeded * CREDIT_ECONOMICS.apiCostPerCredit;

    const estimate: CostEstimate = {
        creditsNeeded,
        apiCostUSD,
        respondents: nRespondents,
        samplesPerRespondent: nSamples,
        method,
        callsPerSample,
        totalCalls,
    };

    // Add warnings for expensive runs
    if (creditsNeeded > 50) {
        estimate.warning = `Large run: ${creditsNeeded} credits (~$${apiCostUSD.toFixed(2)} API cost)`;
    }

    return estimate;
}

/**
 * Check if user has sufficient credits
 */
export function checkCreditSufficiency(
    creditsNeeded: number,
    creditsAvailable: number,
    overageEnabled: boolean
): { allowed: boolean; reason?: string } {
    if (creditsNeeded <= creditsAvailable) {
        return { allowed: true };
    }

    if (overageEnabled) {
        const overage = creditsNeeded - creditsAvailable;
        const overageCost = overage * CREDIT_ECONOMICS.overagePrice;
        return {
            allowed: true,
            reason: `Will use ${overage} overage credits ($${overageCost.toFixed(2)})`
        };
    }

    return {
        allowed: false,
        reason: `Insufficient credits: need ${creditsNeeded}, have ${creditsAvailable}`
    };
}

/**
 * Live cost tracker during pipeline execution
 */
export class CostTracker {
    private startTime: number;
    private creditsUsed = 0;
    private callsCompleted = 0;
    private tokensUsed = { input: 0, output: 0 };
    private costCapUSD: number | null;
    private estimatedTokenCostPerCall: number;

    constructor(costCapUSD: number | null = null, estimatedTokenCostPerCall = 0.002) {
        this.startTime = Date.now();
        this.costCapUSD = costCapUSD;
        this.estimatedTokenCostPerCall = estimatedTokenCostPerCall;
    }

    /**
     * Record a completed call
     */
    recordCall(inputTokens: number, outputTokens: number): void {
        this.callsCompleted++;
        this.tokensUsed.input += inputTokens;
        this.tokensUsed.output += outputTokens;
    }

    /**
     * Record credits used
     */
    recordCredits(credits: number): void {
        this.creditsUsed += credits;
    }

    /**
     * Check if we should stop due to cost cap
     */
    shouldStop(): boolean {
        if (this.costCapUSD === null) return false;
        return this.getProjectedCostUSD() > this.costCapUSD;
    }

    /**
     * Get projected total cost based on current usage
     */
    getProjectedCostUSD(): number {
        // Use actual token costs
        const inputCost = (this.tokensUsed.input / 1_000_000) * 1.75;  // GPT-5.2 input pricing
        const outputCost = (this.tokensUsed.output / 1_000_000) * 14.0; // GPT-5.2 output pricing
        return inputCost + outputCost;
    }

    /**
     * Get current stats
     */
    getStats(): {
        durationMs: number;
        callsCompleted: number;
        creditsUsed: number;
        tokensUsed: { input: number; output: number };
        estimatedCostUSD: number;
        costCapUSD: number | null;
        atRisk: boolean;
    } {
        return {
            durationMs: Date.now() - this.startTime,
            callsCompleted: this.callsCompleted,
            creditsUsed: this.creditsUsed,
            tokensUsed: this.tokensUsed,
            estimatedCostUSD: this.getProjectedCostUSD(),
            costCapUSD: this.costCapUSD,
            atRisk: this.costCapUSD !== null && this.getProjectedCostUSD() > this.costCapUSD * 0.8,
        };
    }
}

/**
 * Dry run configuration
 * Used for quick validation without full cost
 */
export const DRY_RUN_CONFIG = {
    nRespondents: 10,
    nSamples: 1,
    maxConcepts: 1,
} as const;

/**
 * Apply dry run limits to a configuration
 */
export function applyDryRunLimits<T extends { nRespondents: number; nSamplesPerRespondent: number }>(
    config: T
): T {
    return {
        ...config,
        nRespondents: Math.min(config.nRespondents, DRY_RUN_CONFIG.nRespondents),
        nSamplesPerRespondent: Math.min(config.nSamplesPerRespondent, DRY_RUN_CONFIG.nSamples),
    };
}
