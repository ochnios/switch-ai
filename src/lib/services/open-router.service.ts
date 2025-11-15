import { OpenRouter } from "@openrouter/sdk";

import type { SupabaseClient } from "../../db/supabase.client";
import type { ModelDto } from "../../types";
import { config } from "../config";
import {
  ApiKeyNotFoundError,
  OpenRouterNetworkError,
  OpenRouterProviderOverloadedError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterUnauthorizedError,
  OpenRouterValidationError,
} from "../errors";
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
 * Model parameters for chat completion
 */
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Parameters for creating a chat completion
 */
export interface ChatCompletionParams {
  userId: string;
  model: string;
  systemMessage?: string;
  userMessages: { content: string }[];
  assistantMessages?: { content: string }[];
  modelParams?: ModelParameters;
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
   *
   * @param userId - The user's ID (to retrieve their API key)
   * @returns Array of models with id and name
   * @throws ApiKeyNotFoundError if API key is not configured
   * @throws OpenRouterError if OpenRouter API call fails
   */
  async fetchModels(userId: string): Promise<ModelDto[]> {
    try {
      // Retrieve and decrypt the user's API key
      const apiKey = await this.getUserApiKey(userId);

      // Create OpenRouter client instance
      const client = this.createOpenRouterClient(apiKey);

      // Fetch models from OpenRouter API
      const modelsResponse = await client.models.list();

      // Map SDK response to internal ModelDto type
      const models: ModelDto[] = modelsResponse.data.map((model) => ({
        id: model.id,
        name: model.name || model.id,
      }));

      logger.info("Fetched models from OpenRouter", {
        userId,
        modelCount: models.length,
      });

      return models;
    } catch (error) {
      throw this.mapOpenRouterError(error);
    }
  }

  /**
   * Creates a chat completion using OpenRouter API
   * Retrieves the user's API key and makes the request
   *
   * @param params - Chat completion parameters
   * @returns The assistant's response with token usage
   * @throws ApiKeyNotFoundError if API key is not configured
   * @throws OpenRouterError if OpenRouter API call fails
   */
  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      // Retrieve and decrypt the user's API key
      const apiKey = await this.getUserApiKey(params.userId);

      // Create OpenRouter client instance
      const client = this.createOpenRouterClient(apiKey);

      // Build messages array
      const messages = this.buildChatMessages(params);

      // Prepare model parameters
      const modelParams = this.buildModelParameters(params.modelParams);

      // Call OpenRouter API
      const response = await client.chat.send({
        model: params.model,
        messages,
        temperature: modelParams.temperature,
        maxTokens: modelParams.maxTokens,
        topP: modelParams.topP,
        frequencyPenalty: modelParams.frequencyPenalty,
        presencePenalty: modelParams.presencePenalty,
        stream: false,
      });

      // Extract response content
      const messageContent = response.choices[0]?.message?.content;
      const content = typeof messageContent === "string" ? messageContent : "";
      const responseModel = response.model || params.model;
      const usage = {
        prompt_tokens: response.usage?.promptTokens || 0,
        completion_tokens: response.usage?.completionTokens || 0,
      };

      logger.info("Chat completion generated", {
        userId: params.userId,
        model: responseModel,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
      });

      return {
        content,
        model: responseModel,
        usage,
      };
    } catch (error) {
      throw this.mapOpenRouterError(error);
    }
  }

  /**
   * Retrieves and decrypts the user's OpenRouter API key
   *
   * @param userId - User identifier
   * @returns Decrypted API key
   * @throws ApiKeyNotFoundError if key is not found
   */
  private async getUserApiKey(userId: string): Promise<string> {
    const apiKey = await this.apiKeyService.getApiKey(userId);

    if (!apiKey) {
      logger.warn("API key not found", { userId });
      throw new ApiKeyNotFoundError("OpenRouter API key not configured. Please add your API key in settings.");
    }

    return apiKey;
  }

  /**
   * Creates an OpenRouter SDK client instance with the user's API key
   *
   * @param apiKey - Decrypted API key
   * @returns OpenRouter client instance
   */
  private createOpenRouterClient(apiKey: string): OpenRouter {
    return new OpenRouter({
      apiKey: apiKey,
    });
  }

  /**
   * Builds a messages array for OpenRouter API from parameters
   *
   * @param params - Chat completion parameters
   * @returns Array of messages in OpenRouter format
   */
  private buildChatMessages(params: ChatCompletionParams): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add system message (from params or default from config)
    const systemPrompt = params.systemMessage || config.ai.systemPrompt;
    messages.push({
      role: "system",
      content: systemPrompt,
    });

    // Build conversation history by interleaving assistant and user messages
    const assistantMsgs = params.assistantMessages || [];
    const userMsgs = params.userMessages;

    // Interleave messages (assuming alternating pattern)
    const maxLength = Math.max(assistantMsgs.length, userMsgs.length - 1);
    for (let i = 0; i < maxLength; i++) {
      if (i < userMsgs.length - 1) {
        messages.push({
          role: "user",
          content: userMsgs[i].content,
        });
      }
      if (i < assistantMsgs.length) {
        messages.push({
          role: "assistant",
          content: assistantMsgs[i].content,
        });
      }
    }

    // Add the current user message as the last message
    const currentUserMessage = userMsgs[userMsgs.length - 1];
    messages.push({
      role: "user",
      content: currentUserMessage.content,
    });

    // Apply history limit
    const maxMessages = config.ai.parameters.maxHistoryMessages;
    if (messages.length > maxMessages + 1) {
      // Keep system message + last maxMessages
      messages.splice(1, messages.length - maxMessages - 1);
    }

    return messages;
  }

  /**
   * Builds model parameters by merging defaults with provided parameters
   *
   * @param params - Optional model parameters from caller
   * @returns Merged model parameters
   */
  private buildModelParameters(params?: ModelParameters): Required<ModelParameters> {
    return {
      temperature: params?.temperature ?? config.ai.parameters.temperature.default,
      maxTokens: params?.maxTokens ?? config.ai.parameters.maxTokens.default,
      topP: params?.topP ?? config.ai.parameters.topP.default,
      frequencyPenalty: params?.frequencyPenalty ?? config.ai.parameters.frequencyPenalty.default,
      presencePenalty: params?.presencePenalty ?? config.ai.parameters.presencePenalty.default,
    };
  }

  /**
   * Maps OpenRouter SDK errors to domain-specific error types
   *
   * @param error - Error from OpenRouter SDK or other sources
   * @returns Mapped domain error
   */
  private mapOpenRouterError(error: unknown): Error {
    // If it's already one of our domain errors, return as is
    if (
      error instanceof ApiKeyNotFoundError ||
      error instanceof OpenRouterUnauthorizedError ||
      error instanceof OpenRouterRateLimitError ||
      error instanceof OpenRouterServerError ||
      error instanceof OpenRouterProviderOverloadedError ||
      error instanceof OpenRouterValidationError ||
      error instanceof OpenRouterNetworkError
    ) {
      return error;
    }

    // Handle OpenRouter SDK errors
    if (this.isOpenRouterError(error)) {
      const statusCode = this.extractStatusCode(error);
      const errorMessage = this.extractErrorMessage(error);

      logger.warn("OpenRouter API error", {
        statusCode,
        message: errorMessage,
      });

      // Map based on status code
      switch (statusCode) {
        case 400:
          return new OpenRouterValidationError(
            errorMessage || "Invalid request parameters",
            error instanceof Error ? error : undefined
          );
        case 401:
        case 403:
          return new OpenRouterUnauthorizedError(
            "Invalid or expired OpenRouter API key. Please check your API key in settings.",
            error instanceof Error ? error : undefined
          );
        case 429:
          return new OpenRouterRateLimitError(undefined, error instanceof Error ? error : undefined);
        case 500:
        case 502:
        case 503:
        case 504:
          return new OpenRouterServerError(undefined, error instanceof Error ? error : undefined);
        case 529:
          return new OpenRouterProviderOverloadedError(undefined, error instanceof Error ? error : undefined);
        default:
          return new OpenRouterServerError(
            `Unexpected error from OpenRouter: ${errorMessage}`,
            error instanceof Error ? error : undefined
          );
      }
    }

    // Handle network/timeout errors
    if (error instanceof Error) {
      if (
        error.message.includes("network") ||
        error.message.includes("timeout") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT")
      ) {
        logger.warn("Network error", { message: error.message });
        return new OpenRouterNetworkError(undefined, error);
      }

      // Generic error fallback
      logger.warn("Unexpected error in OpenRouterService", {
        error: error.message,
      });

      return new OpenRouterServerError("An unexpected error occurred while communicating with OpenRouter", error);
    }

    // Non-Error object fallback
    logger.warn("Unexpected non-Error object in OpenRouterService", {
      error: String(error),
    });

    return new OpenRouterServerError("An unexpected error occurred while communicating with OpenRouter");
  }

  /**
   * Type guard to check if error is from OpenRouter SDK
   */
  private isOpenRouterError(error: unknown): error is { statusCode?: number; code?: string; message?: string } {
    return typeof error === "object" && error !== null && ("statusCode" in error || "code" in error);
  }

  /**
   * Extracts status code from OpenRouter SDK error
   */
  private extractStatusCode(error: { statusCode?: number; code?: string; message?: string }): number | undefined {
    // Try to extract status code from error properties
    if (typeof error.statusCode === "number") {
      return error.statusCode;
    }

    // Try to parse from error code or message
    const errorString = String(error.code || error.message || "");
    const match = errorString.match(/\b(4\d{2}|5\d{2})\b/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Extracts error message from OpenRouter SDK error
   */
  private extractErrorMessage(error: { message?: string; code?: string }): string {
    return error.message || error.code || "Unknown error";
  }
}
