import type { SupabaseClient } from "../../db/supabase.client";
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
