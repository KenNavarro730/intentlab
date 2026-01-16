/**
 * Direct Likert Rating (DLR) Stage
 * Simplest method: ask LLM to directly output a rating 1-5
 * 
 * Advantages: Fastest, cheapest (minimal output tokens)
 * Disadvantages: Less nuanced, no rationale captured
 */

import type { LLMProvider } from '../llm/provider';
import type { Persona, ProductConcept, PricePoint } from '../simulate/types';

/**
 * System prompt for DLR - minimal and directive
 */
export const DLR_SYSTEM_PROMPT = `You are rating purchase intent on a 1-5 scale.
1 = Definitely would NOT buy
2 = Probably would NOT buy
3 = Might or might not buy
4 = Probably WOULD buy
5 = Definitely WOULD buy

Output ONLY a single digit (1, 2, 3, 4, or 5). No other text.`;

/**
 * Build user prompt for DLR
 */
export function buildDLRPrompt(
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint
): string {
    return `CONSUMER PROFILE:
Age: ${persona.age}
Income: ${persona.income}
Location: ${persona.location}
Household: ${persona.household}
Values: ${persona.psychographics.join(', ')}

PRODUCT:
${concept.name} - ${concept.category}
${concept.description}
${concept.features.length > 0 ? `Features: ${concept.features.join(', ')}` : ''}
${concept.claims.length > 0 ? `Claims: ${concept.claims.join(', ')}` : ''}

PRICE: $${pricePoint.price} (${pricePoint.purchaseType === 'subscription' ? 'monthly' : 'one-time'})

As this consumer, rate your purchase intent (1-5):`;
}

/**
 * Parse DLR response to get rating
 * Returns one-hot PMF or null if invalid
 */
export function parseDLRResponse(response: string): number[] | null {
    const trimmed = response.trim();
    const rating = parseInt(trimmed, 10);

    if (rating >= 1 && rating <= 5) {
        // One-hot encode: [0, 0, 0, 0, 0] with 1 at rating-1 index
        const pmf = [0, 0, 0, 0, 0];
        pmf[rating - 1] = 1;
        return pmf;
    }

    // Try to extract first digit if response has extra text
    const match = trimmed.match(/^[1-5]/);
    if (match) {
        const extracted = parseInt(match[0], 10);
        const pmf = [0, 0, 0, 0, 0];
        pmf[extracted - 1] = 1;
        return pmf;
    }

    return null;
}

/**
 * Execute DLR for a single sample
 */
export async function executeDLR(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    options: {
        maxOutputTokens?: number;
        reasoningEffort?: 'none' | 'low';
    } = {}
): Promise<{ pmf: number[]; raw: string }> {
    const userPrompt = buildDLRPrompt(persona, concept, pricePoint);

    const response = await provider.generateText({
        system: DLR_SYSTEM_PROMPT,
        user: userPrompt,
        temperature: 0.3,  // Low temp for consistent ratings
        maxTokens: options.maxOutputTokens ?? 5,
    });

    const pmf = parseDLRResponse(response.text);

    if (!pmf) {
        // Retry with format correction
        const retryResponse = await provider.generateText({
            system: DLR_SYSTEM_PROMPT,
            user: `${userPrompt}\n\nPREVIOUS RESPONSE WAS INVALID. Output ONLY a single digit 1-5:`,
            temperature: 0.1,
            maxTokens: 3,
        });

        const retryPmf = parseDLRResponse(retryResponse.text);
        if (!retryPmf) {
            // Default to middle rating on failure
            return { pmf: [0, 0, 1, 0, 0], raw: response.text };
        }
        return { pmf: retryPmf, raw: retryResponse.text };
    }

    return { pmf, raw: response.text };
}
