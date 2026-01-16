/**
 * Plan Configuration - Credit-Based Pricing (Option A)
 * 1 credit = 100 respondent-evaluations (200 API calls at n=2)
 * Target margins: 70-84%
 */

/**
 * Credit economics
 * Simple rule: 1 credit = 100 simulated respondents
 */
export const CREDIT_ECONOMICS = {
    respondentsPerCredit: 100,   // 1 credit = 100 simulated respondents
    apiCostPerCredit: 0.44,      // USD - our cost
    overagePrice: 2.50,          // USD - what we charge for extra credits
} as const;

/**
 * Plan metadata with credit-based limits
 */
export const PLANS = {
    free: {
        name: 'Free Trial',
        price: 0,
        credits: 5,           // 500 respondents
        maxConcepts: 1,
        methods: ['SSR'] as const,
        features: [
            '5 credits (500 respondents)',
            '1 concept at a time',
            'SSR method only',
            'Basic results'
        ],
    },
    starter: {
        name: 'Starter',
        price: 79,
        credits: 30,          // 3,000 respondents
        maxConcepts: 5,
        methods: ['DLR', 'FLR', 'SSR'] as const,
        features: [
            '30 credits/month',
            '3,000 respondents',
            'All 3 rating methods',
            'Up to 5 concepts',
            'Email support'
        ],
    },
    growth: {
        name: 'Growth',
        price: 199,
        credits: 100,         // 10,000 respondents
        maxConcepts: 15,
        methods: ['DLR', 'FLR', 'SSR'] as const,
        features: [
            '100 credits/month',
            '10,000 respondents',
            'Priority processing',
            'Segmentation analysis',
            '4 audience segments',
            'Export reports'
        ],
    },
    agency: {
        name: 'Agency',
        price: 499,
        credits: 300,         // 30,000 respondents
        maxConcepts: -1,      // Unlimited
        methods: ['DLR', 'FLR', 'SSR'] as const,
        features: [
            '300 credits/month',
            '30,000 respondents',
            'Batch API access',
            'Unlimited concepts',
            'Unlimited segments',
            'White-label reports',
            'Dedicated support'
        ],
    },
} as const;

export type PlanId = keyof typeof PLANS;
export type RatingMethod = 'DLR' | 'FLR' | 'SSR';

/**
 * Calculate credits needed for a simulation run
 * Simple rule: 1 credit = 100 simulated respondents
 * @param nRespondents - Total number of simulated respondents
 * @returns Number of credits required
 */
export function calculateCreditsNeeded(nRespondents: number): number {
    return Math.ceil(nRespondents / CREDIT_ECONOMICS.respondentsPerCredit);
}

/**
 * Calculate estimated API cost for a run
 * @param credits - Number of credits to be used
 * @returns Estimated cost in USD
 */
export function estimateApiCost(credits: number): number {
    return credits * CREDIT_ECONOMICS.apiCostPerCredit;
}

/**
 * Calculate overage cost for extra credits
 * @param extraCredits - Credits beyond plan allowance
 * @returns Cost in USD
 */
export function calculateOverageCost(extraCredits: number): number {
    return Math.max(0, extraCredits) * CREDIT_ECONOMICS.overagePrice;
}

/**
 * Get plan limits
 */
export function getPlanLimits(planId: PlanId) {
    const plan = PLANS[planId];
    return {
        credits: plan.credits,
        maxConcepts: plan.maxConcepts,
        methods: plan.methods,
    };
}
