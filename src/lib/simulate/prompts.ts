/**
 * Prompt Templates for Consumer Persona Simulation
 * Battle-tested structure from academic research
 */

import type { Persona, ProductConcept, PricePoint } from './types';

/**
 * System prompt for synthetic consumer roleplay
 * Kept short and survey-like to reduce drift
 */
export const SYSTEM_PROMPT = `You are a participant in a consumer research survey.
You must ROLEPLAY the person described in the persona details.
You will see a product concept and a price.
Answer the question: "How likely are you to purchase this product at this price?"
Reply with 2-4 sentences of natural language.
Do NOT output numbers, ratings, or Likert labels.
Be honest, mention key reasons and concerns.`;

/**
 * Build user prompt for a single simulated response
 */
export function buildUserPrompt(
    persona: Persona,
    concept: ProductConcept,
    pricePoint: PricePoint,
    alternatives?: string
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

    const shipping = pricePoint.shipping
        ? `Shipping: ${pricePoint.shipping}`
        : '';

    const discount = pricePoint.discountFraming
        ? `Discount: ${pricePoint.discountFraming}`
        : '';

    const alternativeContext = alternatives
        ? `Alternative options you might consider: ${alternatives}`
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
${shipping}
${discount}
${alternativeContext}

QUESTION:
How likely are you to purchase this product at this price?`.trim();
}

/**
 * Prompt for generating objection clusters from rationales
 */
export const OBJECTION_CLUSTERING_PROMPT = `Analyze the following purchase intent rationales and group them into 3-5 key objection themes.

For each theme, provide:
1. A short theme name (3-5 words)
2. The percentage of responses mentioning this concern
3. A representative quote
4. A suggested fix or response

Format your response as JSON array:
[
  {
    "theme": "...",
    "percentage": 25,
    "quote": "...",
    "suggestedFix": "..."
  }
]

RATIONALES:
`;

/**
 * Prompt for generating improved concept variants
 */
export const VARIANT_GENERATION_PROMPT = `Based on the objections and purchase intent data, generate 3 improved variants of this product concept.

Each variant should address specific objections while maintaining the core value proposition.

For each variant, provide:
1. A variant name
2. Key changes made
3. Which objections it addresses
4. Predicted impact on intent

ORIGINAL CONCEPT:
{concept}

TOP OBJECTIONS:
{objections}

Format as JSON array.
`;
