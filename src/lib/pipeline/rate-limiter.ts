/**
 * Rate Limiter with Backoff
 * Manages RPM/TPM limits with exponential backoff on 429/5xx errors
 */

interface RateLimiterConfig {
    rpm: number;           // Requests per minute
    tpm: number;           // Tokens per minute (estimated)
    retryBackoffMs: number;
    maxRetries: number;
}

interface TokenUsage {
    input: number;
    output: number;
}

/**
 * Sliding window rate limiter with token tracking
 */
export class RateLimiter {
    private config: RateLimiterConfig;
    private requestTimestamps: number[] = [];
    private tokenTimestamps: { time: number; tokens: number }[] = [];
    private isThrottled = false;
    private throttleUntil = 0;

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Wait until we can make a request
     */
    async waitForSlot(estimatedTokens: number = 1000): Promise<void> {
        const now = Date.now();

        // Check if we're in a throttle period (from 429 error)
        if (this.isThrottled && now < this.throttleUntil) {
            const waitTime = this.throttleUntil - now;
            await this.sleep(waitTime);
        }

        // Clean old timestamps (older than 1 minute)
        const oneMinuteAgo = now - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
        this.tokenTimestamps = this.tokenTimestamps.filter(t => t.time > oneMinuteAgo);

        // Check RPM limit
        if (this.requestTimestamps.length >= this.config.rpm) {
            const oldestRequest = this.requestTimestamps[0];
            const waitTime = oldestRequest + 60000 - now + 100; // +100ms buffer
            if (waitTime > 0) {
                await this.sleep(waitTime);
            }
        }

        // Check TPM limit
        const currentTokens = this.tokenTimestamps.reduce((sum, t) => sum + t.tokens, 0);
        if (currentTokens + estimatedTokens > this.config.tpm) {
            const oldestToken = this.tokenTimestamps[0];
            const waitTime = oldestToken.time + 60000 - now + 100;
            if (waitTime > 0) {
                await this.sleep(waitTime);
            }
        }

        // Record this request
        this.requestTimestamps.push(Date.now());
        this.tokenTimestamps.push({ time: Date.now(), tokens: estimatedTokens });
    }

    /**
     * Record actual token usage after request completes
     */
    recordUsage(usage: TokenUsage): void {
        const totalTokens = usage.input + usage.output;
        // Update the last recorded estimate with actual usage
        if (this.tokenTimestamps.length > 0) {
            this.tokenTimestamps[this.tokenTimestamps.length - 1].tokens = totalTokens;
        }
    }

    /**
     * Handle rate limit error (429)
     */
    handleRateLimitError(attempt: number): number {
        const backoffMs = this.config.retryBackoffMs * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const totalBackoff = Math.min(backoffMs + jitter, 60000); // Cap at 60s

        this.isThrottled = true;
        this.throttleUntil = Date.now() + totalBackoff;

        return totalBackoff;
    }

    /**
     * Reset throttle state
     */
    resetThrottle(): void {
        this.isThrottled = false;
        this.throttleUntil = 0;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Semaphore for controlling concurrent operations
 */
export class Semaphore {
    private permits: number;
    private queue: Array<() => void> = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise(resolve => {
            this.queue.push(resolve);
        });
    }

    release(): void {
        this.permits++;
        const next = this.queue.shift();
        if (next) {
            this.permits--;
            next();
        }
    }

    /**
     * Run a function with semaphore protection
     */
    async withPermit<T>(fn: () => Promise<T>): Promise<T> {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }

    get available(): number {
        return this.permits;
    }

    get waiting(): number {
        return this.queue.length;
    }
}

/**
 * Combined rate limiter and semaphore manager for pipeline stages
 */
export class PipelineThrottler {
    private rateLimiter: RateLimiter;
    private semaphores: Map<string, Semaphore> = new Map();

    constructor(
        rateLimitConfig: RateLimiterConfig,
        concurrencyLimits: Record<string, number>
    ) {
        this.rateLimiter = new RateLimiter(rateLimitConfig);

        for (const [stage, limit] of Object.entries(concurrencyLimits)) {
            this.semaphores.set(stage, new Semaphore(limit));
        }
    }

    /**
     * Execute a task with rate limiting and concurrency control
     */
    async execute<T>(
        stage: string,
        estimatedTokens: number,
        fn: () => Promise<T>
    ): Promise<T> {
        const semaphore = this.semaphores.get(stage);
        if (!semaphore) {
            throw new Error(`Unknown stage: ${stage}`);
        }

        return semaphore.withPermit(async () => {
            await this.rateLimiter.waitForSlot(estimatedTokens);
            return fn();
        });
    }

    /**
     * Record token usage after completion
     */
    recordUsage(usage: TokenUsage): void {
        this.rateLimiter.recordUsage(usage);
    }

    /**
     * Handle rate limit error
     */
    handleError(attempt: number): number {
        return this.rateLimiter.handleRateLimitError(attempt);
    }

    /**
     * Get concurrency stats
     */
    getStats(): Record<string, { available: number; waiting: number }> {
        const stats: Record<string, { available: number; waiting: number }> = {};
        for (const [stage, semaphore] of this.semaphores) {
            stats[stage] = {
                available: semaphore.available,
                waiting: semaphore.waiting,
            };
        }
        return stats;
    }
}
