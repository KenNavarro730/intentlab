/**
 * LLM Cache Layer
 * Persistent caching for LLM responses and embeddings
 * Uses SHA-256 hashing for cache keys
 */

import { createHash } from 'crypto';

/**
 * Hash a string using SHA-256
 */
export function hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex');
}

/**
 * Create a cache key for an LLM request
 */
export function createLLMCacheKey(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens?: number
): string {
    const content = JSON.stringify({
        model,
        system: systemPrompt,
        user: userPrompt,
        temperature,
        maxTokens,
    });
    return hashString(content);
}

/**
 * Create a cache key for an embedding request
 */
export function createEmbeddingCacheKey(
    model: string,
    text: string
): string {
    const content = JSON.stringify({ model, text });
    return hashString(content);
}

/**
 * In-memory LRU cache (for fast access before DB check)
 */
export class MemoryCache<T> {
    private cache = new Map<string, { value: T; timestamp: number }>();
    private maxSize: number;
    private ttlMs: number;

    constructor(maxSize: number = 10000, ttlMs: number = 3600000) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return undefined;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    set(key: string, value: T): void {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

/**
 * Cached LLM response
 */
export interface CachedLLMResponse {
    text: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
    model: string;
    reasoningEffort?: string;
    cachedAt: Date;
}

/**
 * Cached embedding
 */
export interface CachedEmbedding {
    embedding: number[];
    model: string;
    cachedAt: Date;
}

/**
 * Cache manager combining in-memory and persistent storage
 * Note: Persistent storage integration with Supabase should be added
 * when running in a server context with database access
 */
export class CacheManager {
    private llmCache = new MemoryCache<CachedLLMResponse>(5000);
    private embeddingCache = new MemoryCache<CachedEmbedding>(10000);
    private hits = 0;
    private misses = 0;

    /**
     * Get cached LLM response
     */
    getLLMResponse(cacheKey: string): CachedLLMResponse | undefined {
        const result = this.llmCache.get(cacheKey);
        if (result) {
            this.hits++;
        } else {
            this.misses++;
        }
        return result;
    }

    /**
     * Cache LLM response
     */
    cacheLLMResponse(cacheKey: string, response: CachedLLMResponse): void {
        this.llmCache.set(cacheKey, response);
    }

    /**
     * Get cached embedding
     */
    getEmbedding(cacheKey: string): CachedEmbedding | undefined {
        const result = this.embeddingCache.get(cacheKey);
        if (result) {
            this.hits++;
        } else {
            this.misses++;
        }
        return result;
    }

    /**
     * Cache embedding
     */
    cacheEmbedding(cacheKey: string, embedding: CachedEmbedding): void {
        this.embeddingCache.set(cacheKey, embedding);
    }

    /**
     * Get cache statistics
     */
    getStats(): { hits: number; misses: number; hitRate: number; llmSize: number; embeddingSize: number } {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
            llmSize: this.llmCache.size,
            embeddingSize: this.embeddingCache.size,
        };
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.llmCache.clear();
        this.embeddingCache.clear();
        this.hits = 0;
        this.misses = 0;
    }
}

// Global cache manager instance
export const globalCache = new CacheManager();
