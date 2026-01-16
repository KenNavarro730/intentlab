/**
 * Semantic Similarity Rating (SSR) Stage
 * Most sophisticated method: generate text, embed, compute PMF from anchor similarity
 * 
 * This is the primary method from the research paper.
 * Advantages: Soft PMF (not one-hot), captures uncertainty, best correlation
 * Disadvantages: Requires embeddings, more complex
 */

import type { LLMProvider } from '../llm/provider';
import type { Persona, ProductConcept, PricePoint } from '../simulate/types';
import { ssrPmfAverage } from '../ssr';
import type { SSRParams } from '../ssr';

/**
 * SSR Stage A: Generate free-text purchase intent
 * Same prompt as FLR but optimized for embedding similarity
 */
export const SSR_TEXT_SYSTEM_PROMPT = `You are a consumer in a market research survey.
You must ROLEPLAY as the person described below.
You will see a product concept and price.
Answer honestly: "How likely are you to purchase this product at this price?"
Reply with 2-4 sentences of natural language.
Do NOT output numbers, ratings, or Likert labels.
Be honest and specific - mention key reasons and concerns.`;

/**
 * Build SSR text generation prompt
 * Structured for maximum prompt cache hits:
 * - Constant prefix (system prompt)
 * - Semi-constant (persona format)
 * - Variable (values and concept)
 */
export function buildSSRTextPrompt(
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint
): string {
    const features = concept.features.length > 0
        ? `Key features: ${concept.features.join(', ')}`
        : '';

    const claims = concept.claims.length > 0
        ? `Claims: ${concept.claims.join(', ')}`
        : '';

    const positioning = concept.positioning
        ? `Brand positioning: ${concept.positioning}`
        : '';

    return `PERSONA:
- Age: ${persona.age}
- Income: ${persona.income}
- Location: ${persona.location}
- Household: ${persona.household}
- Shopping style: ${persona.psychographics.join(', ')}

PRODUCT CONCEPT:
${concept.name} (${concept.category})
${concept.description}
${features}
${claims}
${positioning}

PRICE CONTEXT:
Price: $${pricePoint.price}
Purchase type: ${pricePoint.purchaseType === 'subscription' ? 'Monthly subscription' : 'One-time purchase'}

QUESTION:
How likely are you to purchase this product at this price?`;
}

/**
 * Execute SSR Stage A: Generate free-text response
 */
export async function executeSSRText(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    options: {
        maxOutputTokens?: number;
        temperature?: number;
    } = {}
): Promise<string> {
    const userPrompt = buildSSRTextPrompt(persona, concept, pricePoint);

    const response = await provider.generateText({
        system: SSR_TEXT_SYSTEM_PROMPT,
        user: userPrompt,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxOutputTokens ?? 150,
    });

    return response.text;
}

/**
 * Execute SSR Stage B: Embed response and compute PMF
 */
export async function executeSSREmbed(
    provider: LLMProvider,
    responseText: string,
    anchorEmbeddings: number[][][],  // Pre-computed anchor set embeddings
    ssrParams: SSRParams = {}
): Promise<number[]> {
    // Get embedding for the response
    const embedding = await provider.embedText({ text: responseText });

    // Compute PMF using SSR algorithm
    const pmf = ssrPmfAverage(embedding.embedding, anchorEmbeddings, ssrParams);

    return pmf;
}

/**
 * Execute full SSR pipeline (both stages)
 */
export async function executeSSR(
    provider: LLMProvider,
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    anchorEmbeddings: number[][][],
    options: {
        textMaxTokens?: number;
        temperature?: number;
        ssrParams?: SSRParams;
    } = {}
): Promise<{ pmf: number[]; rationale: string }> {
    // Stage A: Generate free-text
    const rationale = await executeSSRText(
        provider, persona, concept, pricePoint,
        {
            maxOutputTokens: options.textMaxTokens,
            temperature: options.temperature
        }
    );

    // Stage B: Embed and compute PMF
    const pmf = await executeSSREmbed(
        provider,
        rationale,
        anchorEmbeddings,
        options.ssrParams
    );

    return { pmf, rationale };
}

/**
 * Pre-compute anchor embeddings for SSR
 * Call once at pipeline startup
 */
export async function computeAnchorEmbeddings(
    provider: LLMProvider,
    anchorSets: string[][]
): Promise<number[][][]> {
    const allEmbeddings: number[][][] = [];

    for (const anchorSet of anchorSets) {
        const setEmbeddings: number[][] = [];

        // Batch embed if provider supports it
        if (provider.embedTexts) {
            const inputs = anchorSet.map(text => ({ text }));
            const results = await provider.embedTexts(inputs);
            for (const result of results) {
                setEmbeddings.push(result.embedding);
            }
        } else {
            // Fall back to sequential
            for (const anchor of anchorSet) {
                const result = await provider.embedText({ text: anchor });
                setEmbeddings.push(result.embedding);
            }
        }

        allEmbeddings.push(setEmbeddings);
    }

    return allEmbeddings;
}
