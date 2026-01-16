/**
 * OpenAI GPT-5.2 API Provider
 * Supports reasoning effort and verbosity configuration
 */

import OpenAI from 'openai';
import type { LLMProvider, GenerateTextInput, GenerateTextOutput, EmbedTextInput, EmbedTextOutput } from './provider';

const THINKING_MODEL = 'gpt-5.2';
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Extended generation options for GPT-5.2
 */
export interface ExtendedGenerateOptions {
    reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
    verbosity?: 'low' | 'medium' | 'high';
}

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private defaultReasoningEffort: 'none' | 'low' | 'medium' | 'high';
    private defaultVerbosity: 'low' | 'medium' | 'high';

    constructor(
        apiKey?: string,
        options: {
            reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
            verbosity?: 'low' | 'medium' | 'high';
        } = {}
    ) {
        this.client = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
        this.defaultReasoningEffort = options.reasoningEffort ?? 'high';
        this.defaultVerbosity = options.verbosity ?? 'medium';
    }

    /**
     * Generate text with configurable reasoning and verbosity
     */
    async generateText(
        input: GenerateTextInput,
        options: ExtendedGenerateOptions = {}
    ): Promise<GenerateTextOutput> {
        const reasoningEffort = options.reasoningEffort ?? this.defaultReasoningEffort;
        const verbosity = options.verbosity ?? this.defaultVerbosity;

        // Build request with GPT-5.2 specific parameters
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestParams: any = {
            model: THINKING_MODEL,
            messages: [
                { role: 'system', content: input.system },
                { role: 'user', content: input.user }
            ],
            // Note: gpt-5.2 only supports temperature=1 (default), so we don't set it
        };

        // Add max_completion_tokens (gpt-5.2 uses this instead of max_tokens)
        // Default to 4096 for reasoning models to ensure enough space for both reasoning and output
        requestParams.max_completion_tokens = input.maxTokens || 4096;

        // Add reasoning_effort as top-level parameter (per OpenAI API docs)
        if (reasoningEffort !== 'none') {
            requestParams.reasoning_effort = reasoningEffort;
        }

        const response = await this.client.chat.completions.create(requestParams);

        const choice = response.choices[0];
        const text = choice?.message?.content || '';

        return {
            text,
            usage: response.usage ? {
                inputTokens: response.usage.prompt_tokens,
                outputTokens: response.usage.completion_tokens,
            } : undefined
        };
    }

    /**
     * Generate embedding for single text
     */
    async embedText(input: EmbedTextInput): Promise<EmbedTextOutput> {
        const response = await this.client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: input.text,
        });

        return {
            embedding: response.data[0].embedding,
            usage: response.usage ? {
                tokens: response.usage.total_tokens
            } : undefined
        };
    }

    /**
     * Batch embed multiple texts (more efficient)
     */
    async embedTexts(inputs: EmbedTextInput[]): Promise<EmbedTextOutput[]> {
        const response = await this.client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: inputs.map(i => i.text),
        });

        return response.data.map((item, idx) => ({
            embedding: item.embedding,
            usage: idx === 0 && response.usage ? {
                tokens: Math.floor(response.usage.total_tokens / inputs.length)
            } : undefined
        }));
    }

    /**
     * Create a stage-specific provider with different reasoning settings
     */
    forStage(stage: 'dlr' | 'flr_text' | 'flr_rating' | 'ssr_text'): OpenAIProvider {
        const stageSettings: Record<string, { reasoning: 'none' | 'low' | 'medium' | 'high'; verbosity: 'low' | 'medium' | 'high' }> = {
            'dlr': { reasoning: 'none', verbosity: 'low' },           // Pure classification
            'flr_text': { reasoning: 'medium', verbosity: 'medium' }, // Natural response
            'flr_rating': { reasoning: 'none', verbosity: 'low' },    // Pure classification
            'ssr_text': { reasoning: 'high', verbosity: 'medium' },   // Full reasoning
        };

        const settings = stageSettings[stage] ?? { reasoning: 'high', verbosity: 'medium' };

        return new OpenAIProvider(undefined, {
            reasoningEffort: settings.reasoning,
            verbosity: settings.verbosity,
        });
    }
}

export default OpenAIProvider;
