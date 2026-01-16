/**
 * Semantic Similarity Rating (SSR) Algorithm
 * Implements the paper's core methodology for converting free-text purchase intent
 * into realistic Likert distributions via embedding similarity
 */

export type Likert = 1 | 2 | 3 | 4 | 5;

export type SSRParams = {
    epsilon?: number;      // Avoids forced zero-probability bin
    temperature?: number;  // Controls PMF smoothing (1 = no smoothing)
};

export type Embedding = number[];

/**
 * Compute cosine similarity between two embedding vectors
 */
export function cosineSim(a: Embedding, b: Embedding): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize array to sum to 1 (probability distribution)
 */
export function normalize(arr: number[]): number[] {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    if (sum <= 0) return arr.map(() => 1 / arr.length);
    return arr.map(v => v / sum);
}

/**
 * SSR PMF for one anchor set (5 anchors)
 * Uses "subtract minimum similarity" stabilization from the paper
 * 
 * @param responseEmb - Embedding of the free-text response
 * @param anchorEmbs - Array of 5 embeddings for anchor statements
 * @param params - Optional epsilon and temperature parameters
 * @returns Probability mass function over Likert 1-5
 */
export function ssrPmfOneSet(
    responseEmb: Embedding,
    anchorEmbs: Embedding[],
    params: SSRParams = {}
): number[] {
    const eps = params.epsilon ?? 0;
    const T = params.temperature ?? 1;

    // Compute similarities to each anchor
    const sims = anchorEmbs.map(anchor => cosineSim(responseEmb, anchor));
    const minSim = Math.min(...sims);
    const minIdx = sims.indexOf(minSim);

    // p(r) ∝ sim(r) - minSim + ε * δ_{r,minIdx}
    // This shifts similarities to avoid negative values and adds epsilon to min
    let raw = sims.map((sim, i) => {
        const shifted = sim - minSim;
        // Add epsilon only to the minimum similarity index
        return shifted + (i === minIdx ? eps : 0);
    });

    // Optional temperature smoothing: p^(1/T)
    if (T !== 1) {
        raw = raw.map(v => Math.pow(Math.max(v, 1e-12), 1 / T));
    }

    return normalize(raw);
}

/**
 * SSR PMF averaged across multiple anchor sets
 * Paper used 6 sets to improve reliability
 * 
 * @param responseEmb - Embedding of the free-text response
 * @param anchorSetsEmbs - Array of anchor sets, each containing 5 embeddings
 * @param params - Optional epsilon and temperature parameters
 * @returns Averaged probability mass function over Likert 1-5
 */
export function ssrPmfAverage(
    responseEmb: Embedding,
    anchorSetsEmbs: Embedding[][],
    params: SSRParams = {}
): number[] {
    if (anchorSetsEmbs.length === 0) {
        return [0.2, 0.2, 0.2, 0.2, 0.2]; // Uniform if no anchors
    }

    const accumulated = [0, 0, 0, 0, 0];

    for (const anchorSet of anchorSetsEmbs) {
        const pmf = ssrPmfOneSet(responseEmb, anchorSet, params);
        for (let i = 0; i < 5; i++) {
            accumulated[i] += pmf[i];
        }
    }

    return accumulated.map(v => v / anchorSetsEmbs.length);
}

/**
 * Calculate expected Likert rating from PMF
 * E[r] = Σ p(r) * r
 */
export function expectedLikert(pmf: number[]): number {
    return pmf.reduce((sum, p, i) => sum + p * (i + 1), 0);
}

/**
 * Calculate Top-2 Box score (P(r >= 4))
 * Standard purchase intent metric
 */
export function top2Box(pmf: number[]): number {
    return (pmf[3] ?? 0) + (pmf[4] ?? 0);
}

/**
 * Calculate Bottom-2 Box score (P(r <= 2))
 * For objection analysis
 */
export function bottom2Box(pmf: number[]): number {
    return (pmf[0] ?? 0) + (pmf[1] ?? 0);
}

/**
 * Calculate distribution entropy (measure of uncertainty)
 * Higher = more spread out, lower = more confident
 */
export function distributionEntropy(pmf: number[]): number {
    return -pmf.reduce((sum, p) => {
        if (p <= 0) return sum;
        return sum + p * Math.log2(p);
    }, 0);
}
