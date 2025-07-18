import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';

// Azure OpenAI Configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_MODEL = process.env.AZURE_OPENAI_MODEL || 'gpt-4.1';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
  throw new Error('Azure OpenAI configuration is missing. Please check your environment variables.');
}

// Extract resource name from endpoint
const resourceName = AZURE_OPENAI_ENDPOINT?.replace('https://', '').replace('.openai.azure.com/', '').replace('/', '') || 'gpt-dbis';

// Initialize Azure OpenAI Client using AI SDK
const azure = createAzure({
  apiKey: AZURE_OPENAI_API_KEY!,
  resourceName: resourceName,
  apiVersion: AZURE_OPENAI_API_VERSION,
});

const model = azure(AZURE_OPENAI_MODEL);

export interface LLMRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface LLMResponse {
  text: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * General purpose Azure OpenAI text generation
 */
export async function generateLLMResponse(request: LLMRequest): Promise<LLMResponse> {
  try {
    const { text, finishReason, usage } = await generateText({
      model: model,
      system: request.system,
      prompt: request.prompt,
      maxTokens: request.maxTokens || 1500,
      temperature: request.temperature || 0.7,
      topP: request.topP || 0.9,
    });

    return {
      text,
      finishReason,
      usage: usage ? {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      } : undefined,
    };
  } catch (error) {
    console.error('Azure OpenAI API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      resourceName,
      model: AZURE_OPENAI_MODEL,
      endpoint: AZURE_OPENAI_ENDPOINT
    });
    throw error;
  }
}

/**
 * Test Azure OpenAI connection
 */
export async function testAzureOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await generateLLMResponse({
      prompt: 'Reply with "OK" if you can read this message.',
      maxTokens: 10,
      temperature: 0,
    });

    return { success: !!response.text };
  } catch (error) {
    console.error('Azure OpenAI connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}