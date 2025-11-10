import { Logger } from "../logger";

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
 * Currently returns mock responses for development
 */
export class OpenRouterService {
  /**
   * Creates a chat completion using OpenRouter API
   * Mock implementation that returns predefined response
   *
   * @param apiKey - The OpenRouter API key
   * @param model - The model to use
   * @param messages - The conversation history
   * @returns The assistant's response with token usage
   */
  async createChatCompletion(apiKey: string, model: string, messages: ChatMessage[]): Promise<ChatCompletionResponse> {
    // TODO key should be taken by open router service itself

    logger.warn("Using mock OpenRouter implementation", {
      model,
      messageCount: messages.length,
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
