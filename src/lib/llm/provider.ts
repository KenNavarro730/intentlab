/**
 * LLM Provider Interface
 * Abstraction layer for text generation and embeddings
 */

export type GenerateTextInput = {
    system: string;
    user: string;
    temperature?: number;
    maxTokens?: number;
};

export type GenerateTextOutput = {
    text: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
};

export type EmbedTextInput = {
    text: string;
};

export type EmbedTextOutput = {
    embedding: number[];
    usage?: {
        tokens: number;
    };
};

/**
 * Generic LLM provider interface
 * Implementations can use OpenAI, Anthropic, Google, etc.
 */
export interface LLMProvider {
    /**
     * Generate text completion
     */
    generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;

    /**
     * Generate embedding vector for text
     */
    embedText(input: EmbedTextInput): Promise<EmbedTextOutput>;

    /**
     * Batch embed multiple texts (more efficient)
     */
    embedTexts?(inputs: EmbedTextInput[]): Promise<EmbedTextOutput[]>;
}

export default LLMProvider;
