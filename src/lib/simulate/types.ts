/**
 * Simulation Types
 */

export interface Persona {
    age: string;
    income: string;
    location: string;
    household: string;
    psychographics: string[];
}

export interface ProductConcept {
    id?: string;
    name: string;
    category: string;
    description: string;
    features: string[];
    claims: string[];
    positioning?: string;
}

export interface PricePoint {
    price: number;
    purchaseType: 'one-time' | 'subscription';
    shipping?: string;
    discountFraming?: string;
}

export interface SimulationConfig {
    nRespondents: number;
    ssr: {
        epsilon?: number;
        temperature?: number;
    };
}

export interface SimulationResult {
    pricePoint: number;
    segmentId: string;
    likertPmf: number[];
    expectedLikert: number;
    top2Box: number;
    bottom2Box: number;
    entropy: number;
    sampleRationales: string[];
    confidence: {
        lower: number;
        upper: number;
    };
}

export interface AudienceSegment {
    id: string;
    name: string;
    personas: Persona[];
    weight: number; // 0-1, share of audience
}

export interface SimulationRun {
    id: string;
    conceptId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    pricePoints: number[];
    segments: AudienceSegment[];
    config: SimulationConfig;
    results?: SimulationResult[];
    createdAt: Date;
    completedAt?: Date;
    error?: string;
}

// Preset personas for personal care concept testing
export const PRESET_PERSONAS: Record<string, Partial<Persona>> = {
    'skincare-obsessed': {
        age: '25-40',
        income: '$60,000-$120,000',
        location: 'Urban',
        household: 'Single or couple, no kids',
        psychographics: ['Ingredient-conscious', 'Follows skincare influencers', 'Willing to pay for results']
    },
    'clean-beauty': {
        age: '28-45',
        income: '$50,000-$100,000',
        location: 'Urban/Suburban',
        household: 'Varies',
        psychographics: ['Eco-driven', 'Reads ingredient labels', 'Prefers cruelty-free brands']
    },
    'budget-conscious-mom': {
        age: '30-50',
        income: '$40,000-$80,000',
        location: 'Suburban',
        household: 'Married with children',
        psychographics: ['Value-seeker', 'Time-pressed', 'Practical purchases']
    },
    'minimalist-men': {
        age: '25-45',
        income: '$50,000-$100,000',
        location: 'Urban',
        household: 'Single or couple',
        psychographics: ['Low-maintenance routine', 'Function over brand', 'Seeks simplicity']
    },
    'gen-z-tiktok': {
        age: '18-26',
        income: '$25,000-$55,000',
        location: 'Urban',
        household: 'Living with family or roommates',
        psychographics: ['Trend-aware', 'Social-media-influenced', 'Discovery-driven']
    }
};
