import { vi } from "vitest";

/**
 * Mock OpenRouter chat completion response
 */
export const createMockOpenRouterResponse = (overrides = {}) => ({
  id: "chatcmpl-test-123",
  object: "chat.completion",
  created: Date.now(),
  model: "openai/gpt-4o-mini",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "This is a mock response from the AI assistant.",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 25,
    completion_tokens: 15,
    total_tokens: 40,
  },
  ...overrides,
});

/**
 * Mock OpenRouter error response
 */
export const createMockOpenRouterError = (statusCode: number, message: string) => ({
  error: {
    code: statusCode,
    message,
  },
});

/**
 * Mock OpenRouter service for testing
 */
export const createMockOpenRouterService = () => ({
  sendMessage: vi.fn().mockResolvedValue(createMockOpenRouterResponse()),
  generateTitle: vi.fn().mockResolvedValue("Generated Conversation Title"),
  generateSummary: vi.fn().mockResolvedValue("This is a summary of the conversation."),
  listModels: vi.fn().mockResolvedValue([
    {
      id: "openai/gpt-4o-mini",
      name: "GPT-4o Mini",
      pricing: {
        prompt: "0.00015",
        completion: "0.0006",
      },
    },
    {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      pricing: {
        prompt: "0.00025",
        completion: "0.00125",
      },
    },
  ]),
});

/**
 * Mock OpenRouter SDK chat completion response (matches @openrouter/sdk structure)
 */
export const createMockOpenRouterSDKChatResponse = (overrides = {}) => ({
  choices: [
    {
      message: {
        role: "assistant",
        content: "This is a mock response from the AI assistant.",
      },
    },
  ],
  model: "openai/gpt-4o-mini",
  usage: {
    promptTokens: 25,
    completionTokens: 15,
  },
  ...overrides,
});

/**
 * Mock OpenRouter SDK models list response (matches @openrouter/sdk structure)
 */
export const createMockOpenRouterSDKModelsResponse = (overrides = {}) => ({
  data: [
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
  ],
  ...overrides,
});

/**
 * Mock OpenRouter SDK error (matches @openrouter/sdk error structure)
 */
export const createMockOpenRouterSDKError = (statusCode: number, message: string) => ({
  statusCode,
  message,
});

/**
 * Common test scenarios for OpenRouter API
 */
export const openRouterTestScenarios = {
  // Successful response
  success: {
    status: 200,
    response: createMockOpenRouterResponse(),
  },
  // Invalid API key
  unauthorized: {
    status: 401,
    response: createMockOpenRouterError(401, "Invalid or expired OpenRouter API key"),
  },
  // Insufficient credits
  paymentRequired: {
    status: 402,
    response: createMockOpenRouterError(402, "Insufficient credits. Please add more credits to your account."),
  },
  // Rate limit exceeded
  tooManyRequests: {
    status: 429,
    response: createMockOpenRouterError(429, "Rate limit exceeded"),
  },
  // Service unavailable
  serviceUnavailable: {
    status: 503,
    response: createMockOpenRouterError(503, "AI model provider is currently overloaded"),
  },
};
