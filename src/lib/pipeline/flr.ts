/**
 * Free-text then Likert Rating (FLR) Stage
 * Two-step method: generate free-text response, then rate it
 * 
 * Advantages: Captures rationale, more human-like
 * Disadvantages: 2x API calls, higher cost
 */

import type { LLMProvider } from '../llm/provider';
import type { Persona, ProductConcept, PricePoint } from '../simulate/types';

/**
 * Stage A: Generate free-text purchase intent response
 */
export const FLR_TEXT_SYSTEM_PROMPT = `You are a consumer participating in market research.
You will see a product and price. Express your honest reaction in 1-3 sentences.
Include your key concerns, what appeals to you, and whether you'd likely buy.
Be natural - respond as a real person would when discussing a purchase decision.`;

/**
 * Stage B: Rate the free-text response
 */
export const FLR_RATING_SYSTEM_PROMPT = `You are an expert purchase intent rater.
Given a consumer's response about a product, rate their likelihood to purchase on a 1-5 scale:
1 = Definitely would NOT buy
2 = Probably would NOT buy  
3 = Might or might not buy
4 = Probably WOULD buy
5 = Definitely WOULD buy

Output ONLY a single digit (1, 2, 3, 4, or 5). No explanation.`;

/**
 * Build Stage A prompt for free-text generation
 */
export function buildFLRTextPrompt(
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint
): string {
    return `AS THIS CONSUMER:
- Age: ${persona.age}
- Income: ${persona.income}
- Location: ${persona.location}
- Household: ${persona.household}
- Shopping values: ${persona.psychographics.join(', ')}

YOU ARE SHOWN THIS PRODUCT:
${concept.name} (${concept.category})
${concept.description}
${concept.features.length > 0 ? `Key features: ${concept.features.join(', ')}` : ''}
${concept.claims.length > 0 ? `Brand claims: ${concept.claims.join(', ')}` : ''}

PRICE: $${pricePoint.price}${pricePoint.purchaseType === 'subscription' ? '/month' : ''}

What's your honest reaction? Would you consider buying this?`;
}

/**
 * Build Stage B prompt for rating the response
 */
export function buildFLRRatingPrompt(
    consumerResponse: string,
    concept: ProductConcept,
    pricePoint: PricePoint
): string {
    return `PRODUCT: ${concept.name} at $${pricePoint.price}

CONSUMER'S RESPONSE:
"${consumerResponse}"

Based on this response, what is this consumer's purchase intent? Rate 1-5:`;
}

/**
 * Parse rating response
 */
function parseRating(response: string): number | null {
    const trimmed = response.trim();
    const match = trimmed.match(/^[1-5]/);
    if (match) {
        return parseInt(match[0], 10);
    }
    return null;
}

/**
 * Execute FLR Stage A: Generate free-text
 */
export async function executeFLRText(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    options: {
        maxOutputTokens?: number;
    } = {}
): Promise<string> {
    const userPrompt = buildFLRTextPrompt(persona, concept, pricePoint);

    const response = await provider.generateText({
        system: FLR_TEXT_SYSTEM_PROMPT,
        user: userPrompt,
        temperature: 0.7,  // Higher temp for natural variety
        maxTokens: options.maxOutputTokens ?? 150,
    });

    return response.text;
}

/**
 * Execute FLR Stage B: Rate the free-text
 */
export async function executeFLRRating(
    provider: LLMProvider,
    consumerResponse: string,
    concept: ProductConcept,
    pricePoint: PricePoint,
    options: {
        maxOutputTokens?: number;
    } = {}
): Promise<{ pmf: number[]; rating: number }> {
    const userPrompt = buildFLRRatingPrompt(consumerResponse, concept, pricePoint);

    const response = await provider.generateText({
        system: FLR_RATING_SYSTEM_PROMPT,
        user: userPrompt,
        temperature: 0.2,  // Low temp for consistent rating
        maxTokens: options.maxOutputTokens ?? 5,
    });

    let rating = parseRating(response.text);

    if (rating === null) {
        // Retry with format correction
        const retryResponse = await provider.generateText({
            system: FLR_RATING_SYSTEM_PROMPT,
            user: `${userPrompt}\n\nPREVIOUS RESPONSE WAS INVALID. Output ONLY 1, 2, 3, 4, or 5:`,
            temperature: 0.1,
            maxTokens: 3,
        });

        rating = parseRating(retryResponse.text);
        if (rating === null) {
            rating = 3;  // Default to neutral
        }
    }

    // One-hot PMF
    const pmf = [0, 0, 0, 0, 0];
    pmf[rating - 1] = 1;

    return { pmf, rating };
}

/**
 * Execute full FLR pipeline (both stages)
 */
export async function executeFLR(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    options: {
        textMaxTokens?: number;
        ratingMaxTokens?: number;
    } = {}
): Promise<{ pmf: number[]; rationale: string; rating: number }> {
    // Stage A: Generate free-text
    const rationale = await executeFLRText(
        provider, persona, concept, pricePoint,
        { maxOutputTokens: options.textMaxTokens }
    );

    // Stage B: Rate the response
    const { pmf, rating } = await executeFLRRating(
        provider, rationale, concept, pricePoint,
        { maxOutputTokens: options.ratingMaxTokens }
    );

    return { pmf, rationale, rating };
}
