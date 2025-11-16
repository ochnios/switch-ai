import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OpenRouterService } from "@/lib/services/open-router.service";
import { ApiKeyService } from "@/lib/services/api-key.service";
import {
  ApiKeyNotFoundError,
  OpenRouterValidationError,
  OpenRouterUnauthorizedError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterProviderOverloadedError,
  OpenRouterNetworkError,
} from "@/lib/errors";
import type { SupabaseClient } from "@/db/supabase.client";
import { createMockSupabaseClient } from "../../mocks/supabase";
import {
  createMockOpenRouterSDKChatResponse,
  createMockOpenRouterSDKModelsResponse,
  createMockOpenRouterSDKError,
} from "../../mocks/openrouter";

// Mock ApiKeyService
vi.mock("@/lib/services/api-key.service", () => {
  return {
    ApiKeyService: vi.fn(),
  };
});
// Mock OpenRouter SDK
// Use vi.hoisted() to ensure the mock function is available when vi.mock() factory runs
const { mockOpenRouterConstructor } = vi.hoisted(() => ({
  mockOpenRouterConstructor: vi.fn(),
}));
vi.mock("@openrouter/sdk", () => ({
  OpenRouter: mockOpenRouterConstructor,
}));

describe("UT-OR-01: Fetch Models", () => {
  let supabase: Partial<SupabaseClient>;
  let service: OpenRouterService;
  let mockApiKeyService: {
    getApiKey: ReturnType<typeof vi.fn>;
  };
  let mockOpenRouterClient: {
    models: { list: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    mockOpenRouterClient = {
      models: {
        list: vi.fn().mockResolvedValue(createMockOpenRouterSDKModelsResponse()),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    supabase = createMockSupabaseClient();
    service = new OpenRouterService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("1.1: Successfully fetches models from OpenRouter API", async () => {
    const userId = "00000000-0000-0000-0000-000000000123";

    const result = await service.fetchModels(userId);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("openai/gpt-4o-mini");
    expect(result[0].name).toBe("GPT-4o Mini");
    expect(mockOpenRouterClient.models.list).toHaveBeenCalled();
  });

  it("1.2: Maps SDK response to ModelDto array correctly", async () => {
    const userId = "00000000-0000-0000-0000-000000000123";

    const result = await service.fetchModels(userId);

    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
    expect(typeof result[0].id).toBe("string");
    expect(typeof result[0].name).toBe("string");
  });

  it("1.3: Uses model.name or falls back to model.id", async () => {
    const userId = "00000000-0000-0000-0000-000000000123";

    mockOpenRouterClient.models.list.mockResolvedValue(
      createMockOpenRouterSDKModelsResponse({
        data: [
          { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
          { id: "anthropic/claude-3-haiku", name: null },
        ],
      })
    );

    const result = await service.fetchModels(userId);

    expect(result[0].name).toBe("GPT-4o Mini");
    expect(result[1].name).toBe("anthropic/claude-3-haiku");
  });

  it("1.4: Throws ApiKeyNotFoundError when API key not found", async () => {
    const userId = "00000000-0000-0000-0000-000000000123";

    mockApiKeyService.getApiKey.mockRejectedValue(new ApiKeyNotFoundError());

    await expect(service.fetchModels(userId)).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("1.5: Maps OpenRouter errors correctly using mapOpenRouterError", async () => {
    const userId = "00000000-0000-0000-0000-000000000123";

    const error = createMockOpenRouterSDKError(401, "Unauthorized");
    mockOpenRouterClient.models.list.mockRejectedValue(error);

    await expect(service.fetchModels(userId)).rejects.toThrow(OpenRouterUnauthorizedError);
  });

  it("1.6: Handles empty models list", async () => {
    const userId = "00000000-0000-0000-0000-000000000123";

    mockOpenRouterClient.models.list.mockResolvedValue(createMockOpenRouterSDKModelsResponse({ data: [] }));

    const result = await service.fetchModels(userId);

    expect(result).toEqual([]);
  });
});

describe("UT-OR-02: Create Chat Completion", () => {
  let supabase: Partial<SupabaseClient>;
  let service: OpenRouterService;
  let mockApiKeyService: {
    getApiKey: ReturnType<typeof vi.fn>;
  };
  let mockOpenRouterClient: {
    chat: { send: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    mockOpenRouterClient = {
      chat: {
        send: vi.fn().mockResolvedValue(
          createMockOpenRouterSDKChatResponse({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "This is a test response",
                },
              },
            ],
            model: "openai/gpt-4o-mini",
            usage: {
              promptTokens: 10,
              completionTokens: 5,
            },
          })
        ),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    supabase = createMockSupabaseClient();
    service = new OpenRouterService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("2.1: Successfully creates chat completion with valid parameters", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
    };

    const result = await service.createChatCompletion(params);

    expect(result.content).toBe("This is a test response");
    expect(result.model).toBe("openai/gpt-4o-mini");
    expect(result.usage.prompt_tokens).toBe(10);
    expect(result.usage.completion_tokens).toBe(5);
  });

  it("2.2: Validates input parameters using Zod schema", async () => {
    const params = {
      userId: "invalid-uuid",
      model: "",
      userMessages: [],
    };

    await expect(
      service.createChatCompletion(params as unknown as Parameters<typeof service.createChatCompletion>[0])
    ).rejects.toThrow(OpenRouterValidationError);
  });

  it("2.3: Throws OpenRouterValidationError when parameters are invalid", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [], // Empty array should fail validation
    };

    await expect(
      service.createChatCompletion(params as unknown as Parameters<typeof service.createChatCompletion>[0])
    ).rejects.toThrow(OpenRouterValidationError);
  });

  it("2.4: Retrieves and decrypts user API key", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
    };

    await service.createChatCompletion(params);

    expect(mockApiKeyService.getApiKey).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000123");
  });

  it("2.5: Builds messages array correctly (system, user, assistant)", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      systemMessage: "You are a helpful assistant",
      userMessages: [{ content: "Hello" }, { content: "How are you?" }],
      assistantMessages: [{ content: "Hi there!" }],
    };

    await service.createChatCompletion(params);

    expect(mockOpenRouterClient.chat.send).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
          expect.objectContaining({ role: "assistant" }),
        ]),
      })
    );
  });

  it("2.6: Applies history limit (maxHistoryMessages) correctly", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      // Use max allowed by schema (50 each) to test history limit
      userMessages: Array.from({ length: 50 }, (_, i) => ({ content: `Message ${i}` })),
      assistantMessages: Array.from({ length: 50 }, (_, i) => ({ content: `Response ${i}` })),
    };

    await service.createChatCompletion(params);

    const callArgs = mockOpenRouterClient.chat.send.mock.calls[0][0];
    // Should limit to maxHistoryMessages (50) + system message = 51 total
    // Note: The service interleaves messages and limits, so we expect <= 51
    expect(callArgs.messages.length).toBeLessThanOrEqual(51);
    // Should have system message as first
    expect(callArgs.messages[0].role).toBe("system");
  });

  it("2.7: Merges model parameters with defaults correctly", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
      modelParams: {
        temperature: 0.8,
        maxTokens: 2000,
      },
    };

    await service.createChatCompletion(params);

    expect(mockOpenRouterClient.chat.send).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.8,
        maxTokens: 2000,
        topP: expect.any(Number),
        frequencyPenalty: expect.any(Number),
        presencePenalty: expect.any(Number),
      })
    );
  });

  it("2.8: Returns response with content, model, and usage", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
    };

    const result = await service.createChatCompletion(params);

    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("model");
    expect(result).toHaveProperty("usage");
    expect(result.usage).toHaveProperty("prompt_tokens");
    expect(result.usage).toHaveProperty("completion_tokens");
  });

  it("2.9: Throws OpenRouterServerError when response content is empty", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
    };

    mockOpenRouterClient.chat.send.mockResolvedValue(
      createMockOpenRouterSDKChatResponse({
        choices: [
          {
            message: {
              role: "assistant",
              content: "",
            },
          },
        ],
        model: "openai/gpt-4o-mini",
        usage: {
          promptTokens: 10,
          completionTokens: 0,
        },
      })
    );

    await expect(service.createChatCompletion(params)).rejects.toThrow(OpenRouterServerError);
  });

  it("2.10: Throws ApiKeyNotFoundError when API key not found", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
    };

    mockApiKeyService.getApiKey.mockRejectedValue(new ApiKeyNotFoundError());

    await expect(service.createChatCompletion(params)).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("2.11: Maps OpenRouter errors correctly", async () => {
    const params = {
      userId: "00000000-0000-0000-0000-000000000123",
      model: "openai/gpt-4o-mini",
      userMessages: [{ content: "Hello" }],
    };

    const error = createMockOpenRouterSDKError(429, "Rate limit exceeded");
    mockOpenRouterClient.chat.send.mockRejectedValue(error);

    await expect(service.createChatCompletion(params)).rejects.toThrow(OpenRouterRateLimitError);
  });
});

describe("UT-OR-06: Map OpenRouter Error", () => {
  let supabase: Partial<SupabaseClient>;
  let service: OpenRouterService;

  beforeEach(() => {
    supabase = createMockSupabaseClient();
    service = new OpenRouterService(supabase as SupabaseClient);
  });

  // We test error mapping indirectly through the public methods
  it("6.1: Returns domain error as-is if already a domain error", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockRejectedValue(new ApiKeyNotFoundError()),
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    // Create a new service instance with the mocked ApiKeyService
    const testService = new OpenRouterService(supabase as SupabaseClient);

    await expect(testService.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("6.2: Maps 400 status code to OpenRouterValidationError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(createMockOpenRouterSDKError(400, "Bad request")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    // Create a new service instance with the mocked dependencies
    const testService = new OpenRouterService(supabase as SupabaseClient);

    await expect(testService.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(
      OpenRouterValidationError
    );
  });

  it("6.3: Maps 401/403 status codes to OpenRouterUnauthorizedError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(createMockOpenRouterSDKError(401, "Unauthorized")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(
      OpenRouterUnauthorizedError
    );
  });

  it("6.4: Maps 429 status code to OpenRouterRateLimitError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(createMockOpenRouterSDKError(429, "Rate limit")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(OpenRouterRateLimitError);
  });

  it("6.5: Maps 500/502/503/504 status codes to OpenRouterServerError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(createMockOpenRouterSDKError(500, "Server error")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(OpenRouterServerError);
  });

  it("6.6: Maps 529 status code to OpenRouterProviderOverloadedError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(createMockOpenRouterSDKError(529, "Overloaded")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(
      OpenRouterProviderOverloadedError
    );
  });

  it("6.7: Maps network errors to OpenRouterNetworkError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(new Error("network error")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(OpenRouterNetworkError);
  });

  it("6.8: Maps unknown errors to OpenRouterServerError", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue(createMockOpenRouterSDKError(999, "Unknown error")),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow(OpenRouterServerError);
  });

  it("6.9: Handles non-Error objects correctly", async () => {
    const mockApiKeyService = {
      getApiKey: vi.fn().mockResolvedValue("sk-or-v1-test-key"),
    };

    const mockOpenRouterClient = {
      models: {
        list: vi.fn().mockRejectedValue("String error"),
      },
    };

    vi.mocked(ApiKeyService).mockImplementation(
      class MockApiKeyService {
        getApiKey = mockApiKeyService.getApiKey;
      } as unknown as new (supabase: SupabaseClient) => ApiKeyService
    );

    mockOpenRouterConstructor.mockImplementation(function MockOpenRouter(this: typeof mockOpenRouterClient) {
      Object.assign(this, mockOpenRouterClient);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as new (config: { apiKey: string }) => typeof mockOpenRouterClient as any);

    await expect(service.fetchModels("00000000-0000-0000-0000-000000000123")).rejects.toThrow();
  });
});
