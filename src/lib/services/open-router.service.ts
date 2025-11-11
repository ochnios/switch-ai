import type { SupabaseClient } from "../../db/supabase.client";
import type { ModelDto } from "../../types";
import { Logger } from "../logger";
import { ApiKeyService } from "./api-key.service";

const logger = new Logger("OpenRouterService");

/**
 * Message format for OpenRouter API
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Response from OpenRouter API
 */
export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Service for interacting with OpenRouter API
 * Handles API key retrieval and AI model interactions
 */
export class OpenRouterService {
  private apiKeyService: ApiKeyService;

  constructor(private supabase: SupabaseClient) {
    this.apiKeyService = new ApiKeyService(supabase);
  }

  /**
   * Fetches the list of available models from OpenRouter API
   * Currently returns mock data - real implementation will be added later
   *
   * @param userId - The user's ID (to retrieve their API key)
   * @returns Array of models with id and name
   * @throws Error if API key is not found or OpenRouter API call fails
   */
  async fetchModels(userId: string): Promise<ModelDto[]> {
    // Retrieve and decrypt the user's API key to verify it exists
    const apiKey = await this.apiKeyService.getApiKey(userId);

    logger.warn("Using mock models implementation", {
      hasApiKey: !!apiKey,
    });

    // Mock response - predefined list of popular models
    const mockModels: ModelDto[] = [
      {
        id: "google/gemini-flash-1.5",
        name: "Gemini Flash 1.5",
      },
      {
        id: "google/gemini-pro-1.5",
        name: "Gemini Pro 1.5",
      },
      {
        id: "openai/gpt-4-turbo",
        name: "GPT-4 Turbo",
      },
      {
        id: "openai/gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
      },
      {
        id: "anthropic/claude-3-opus",
        name: "Claude 3 Opus",
      },
      {
        id: "anthropic/claude-3-sonnet",
        name: "Claude 3 Sonnet",
      },
      {
        id: "meta-llama/llama-3-70b",
        name: "Llama 3 70B",
      },
    ];

    return mockModels;
  }

  /**
   * Creates a chat completion using OpenRouter API
   * Retrieves the user's API key and makes the request
   * Mock implementation that returns predefined response
   *
   * @param userId - The user's ID
   * @param model - The model to use
   * @param messages - The conversation history
   * @returns The assistant's response with token usage
   * @throws Error if API key is not found or OpenRouter API call fails
   */
  async createChatCompletion(userId: string, model: string, messages: ChatMessage[]): Promise<ChatCompletionResponse> {
    // Retrieve and decrypt the user's API key
    const apiKey = await this.apiKeyService.getApiKey(userId);

    logger.warn("Using mock OpenRouter implementation", {
      model,
      messageCount: messages.length,
      hasApiKey: !!apiKey,
    });

    // Mock response - simulating AI response
    const lastUserMessage = messages.findLast((msg) => msg.role === "user");
    const mockContent = `Hello! This is a mock response from ${model}. You said: "${lastUserMessage?.content || "nothing"}"`;

    return {
      content: mockContent,
      model,
      usage: {
        prompt_tokens: 50,
        completion_tokens: 20,
      },
    };
  }
}
