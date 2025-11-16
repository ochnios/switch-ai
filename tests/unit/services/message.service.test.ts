import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MessageService } from "@/lib/services/message.service";
import { OpenRouterService } from "@/lib/services/open-router.service";
import type { SupabaseClient } from "@/db/supabase.client";
import { createFlexibleMockSupabaseClient } from "../../mocks/supabase";
import { createMockOpenRouterSDKChatResponse } from "../../mocks/openrouter";

// Mock OpenRouterService
// Use factory pattern to ensure the mock is a proper constructor
vi.mock("@/lib/services/open-router.service", () => {
  return {
    OpenRouterService: vi.fn(),
  };
});

describe("UT-MSG-01: Get Messages (Paginated)", () => {
  let supabase: Partial<SupabaseClient>;
  let service: MessageService;
  let mockCountEq: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;
  let mockRange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Set up default mock for OpenRouterService (not used in these tests but required by constructor)
    vi.mocked(OpenRouterService).mockImplementation(
      class MockOpenRouterService {
        createChatCompletion = vi.fn();
      } as unknown as new (supabase: SupabaseClient) => OpenRouterService
    );

    // Create mock functions for query chain
    mockRange = vi.fn();
    mockOrder = vi.fn().mockReturnValue({ range: mockRange });
    mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockCountEq = vi.fn();

    // Use the flexible mock helper
    const mockResult = createFlexibleMockSupabaseClient({
      tableName: "messages",
      mocks: {
        countEq: mockCountEq,
        dataEq: mockEq,
        dataOrder: mockOrder,
        dataRange: mockRange,
      },
    });
    supabase = mockResult.client;

    service = new MessageService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("1.1: Returns paginated messages for conversation", async () => {
    const conversationId = "conv-123";
    const page = 1;
    const pageSize = 10;
    const mockMessages = [
      {
        id: "msg-1",
        role: "user" as const,
        content: "Hello",
        model_name: null,
        prompt_tokens: null,
        completion_tokens: null,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "msg-2",
        role: "assistant" as const,
        content: "Hi there!",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
    ];

    mockCountEq.mockResolvedValue({ count: 20, error: null });
    mockRange.mockResolvedValue({ data: mockMessages, error: null });

    const result = await service.getMessages(conversationId, page, pageSize);

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(page);
    expect(result.pagination.pageSize).toBe(pageSize);
    expect(result.pagination.total).toBe(20);
  });

  it("1.2: Returns correct pagination metadata", async () => {
    const conversationId = "conv-123";
    const page = 2;
    const pageSize = 5;
    const total = 15;

    mockCountEq.mockResolvedValue({ count: total, error: null });
    mockRange.mockResolvedValue({ data: [], error: null });

    const result = await service.getMessages(conversationId, page, pageSize);

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.pageSize).toBe(5);
    expect(result.pagination.total).toBe(15);
  });

  it("1.3: Returns messages sorted by created_at ascending", async () => {
    const conversationId = "conv-123";
    const page = 1;
    const pageSize = 10;

    mockCountEq.mockResolvedValue({ count: 10, error: null });
    mockRange.mockResolvedValue({ data: [], error: null });

    await service.getMessages(conversationId, page, pageSize);

    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("1.4: Returns empty array when conversation has no messages", async () => {
    const conversationId = "conv-123";
    const page = 1;
    const pageSize = 10;

    mockCountEq.mockResolvedValue({ count: 0, error: null });
    mockRange.mockResolvedValue({ data: [], error: null });

    const result = await service.getMessages(conversationId, page, pageSize);

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it("1.5: Transforms messages to MessageDto (excludes conversation_id)", async () => {
    const conversationId = "conv-123";
    const page = 1;
    const pageSize = 10;
    const mockMessages = [
      {
        id: "msg-1",
        role: "user" as const,
        content: "Hello",
        model_name: null,
        prompt_tokens: null,
        completion_tokens: null,
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockCountEq.mockResolvedValue({ count: 1, error: null });
    mockRange.mockResolvedValue({ data: mockMessages, error: null });

    const result = await service.getMessages(conversationId, page, pageSize);

    expect(result.data[0]).not.toHaveProperty("conversation_id");
    expect(result.data[0]).toHaveProperty("id");
    expect(result.data[0]).toHaveProperty("role");
    expect(result.data[0]).toHaveProperty("content");
  });

  it("1.6: Throws error when count query fails", async () => {
    const conversationId = "conv-123";
    const page = 1;
    const pageSize = 10;

    mockCountEq.mockResolvedValue({
      count: null,
      error: { message: "Count error" },
    });

    await expect(service.getMessages(conversationId, page, pageSize)).rejects.toThrow("Failed to count messages");
  });

  it("1.7: Throws error when messages query fails", async () => {
    const conversationId = "conv-123";
    const page = 1;
    const pageSize = 10;

    mockCountEq.mockResolvedValue({ count: 10, error: null });
    mockRange.mockResolvedValue({
      data: null,
      error: { message: "Messages error" },
    });

    await expect(service.getMessages(conversationId, page, pageSize)).rejects.toThrow("Failed to fetch messages");
  });
});

describe("UT-MSG-02: Send Message", () => {
  let supabase: Partial<SupabaseClient>;
  let service: MessageService;
  let mockOpenRouterService: {
    createChatCompletion: ReturnType<typeof vi.fn>;
  };
  let mockInsertSingle: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockNeq: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOpenRouterService = {
      createChatCompletion: vi.fn(),
    };

    // Use a class constructor to ensure it can be called with 'new'
    vi.mocked(OpenRouterService).mockImplementation(
      class MockOpenRouterService {
        createChatCompletion = mockOpenRouterService.createChatCompletion;
      } as unknown as new (supabase: SupabaseClient) => OpenRouterService
    );

    // Create mock functions for query chain
    mockInsertSingle = vi.fn();
    mockOrder = vi.fn();
    // mockNeq returns an object with .order() method that returns a promise
    mockNeq = vi.fn().mockReturnValue({ order: mockOrder });
    mockEq = vi.fn().mockReturnValue({ neq: mockNeq, order: mockOrder });

    // Use the flexible mock helper
    const mockResult = createFlexibleMockSupabaseClient({
      tableName: "messages",
      mocks: {
        dataEq: mockEq,
        dataNeq: mockNeq,
        dataOrder: mockOrder,
        insertSingle: mockInsertSingle,
      },
    });
    supabase = mockResult.client;
    mockInsert = mockResult.mocks.insert;

    service = new MessageService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("2.1: Successfully saves user message and gets AI response", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockAiResponse = createMockOpenRouterSDKChatResponse({
      choices: [
        {
          message: {
            role: "assistant",
            content: "Hi there!",
          },
        },
      ],
      model: "gpt-4o-mini",
      usage: { promptTokens: 10, completionTokens: 5 },
    });

    const mockAssistantMessage = {
      id: "msg-assistant-1",
      role: "assistant" as const,
      content: mockAiResponse.choices[0].message.content,
      model_name: mockAiResponse.model,
      prompt_tokens: mockAiResponse.usage.promptTokens,
      completion_tokens: mockAiResponse.usage.completionTokens,
      created_at: "2024-01-01T00:00:01Z",
    };

    mockInsertSingle
      .mockResolvedValueOnce({ data: mockUserMessage, error: null })
      .mockResolvedValueOnce({ data: mockAssistantMessage, error: null });

    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: mockAiResponse.choices[0].message.content,
      model: mockAiResponse.model,
      usage: {
        prompt_tokens: mockAiResponse.usage.promptTokens,
        completion_tokens: mockAiResponse.usage.completionTokens,
      },
    });

    const result = await service.sendMessage(conversationId, content, model, userId);

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[0].content).toBe(content);
    expect(result[1].role).toBe("assistant");
    expect(result[1].content).toBe(mockAiResponse.choices[0].message.content);
  });

  it("2.2: Fetches conversation history excluding current user message", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockHistory = [
      { role: "user" as const, content: "Previous message" },
      { role: "assistant" as const, content: "Previous response" },
    ];

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: mockHistory, error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    mockInsertSingle.mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: "Response",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    await service.sendMessage(conversationId, content, model, userId);

    expect(mockNeq).toHaveBeenCalledWith("id", mockUserMessage.id);
  });

  it("2.3: Separates user, assistant, and system messages correctly", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockHistory = [
      { role: "user" as const, content: "User message 1" },
      { role: "assistant" as const, content: "Assistant message 1" },
      { role: "system" as const, content: "System summary" },
      { role: "user" as const, content: "User message 2" },
    ];

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: mockHistory, error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    mockInsertSingle.mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: "Response",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    await service.sendMessage(conversationId, content, model, userId);

    // Verify OpenRouter was called with separated messages
    expect(mockOpenRouterService.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessages: expect.arrayContaining([
          { content: "User message 1" },
          { content: "User message 2" },
          { content }, // Current message
        ]),
        assistantMessages: expect.arrayContaining([{ content: "Assistant message 1" }]),
      })
    );
  });

  it("2.4: Includes conversation summary in system message when available", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockHistory = [
      { role: "system" as const, content: "Conversation summary here" },
      { role: "user" as const, content: "User message" },
    ];

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: mockHistory, error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    mockInsertSingle.mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: "Response",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    await service.sendMessage(conversationId, content, model, userId);

    expect(mockOpenRouterService.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        systemMessage: expect.stringContaining("Conversation summary here"),
      })
    );
  });

  it("2.5: Calls OpenRouter with correct parameters", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    mockInsertSingle.mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: "Response",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    await service.sendMessage(conversationId, content, model, userId);

    expect(mockOpenRouterService.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        model,
        userMessages: [{ content }],
      })
    );
  });

  it("2.6: Saves assistant response with correct metadata", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockAiResponse = createMockOpenRouterSDKChatResponse({
      choices: [
        {
          message: {
            role: "assistant",
            content: "Response",
          },
        },
      ],
      model: "gpt-4o-mini",
      usage: { promptTokens: 15, completionTokens: 8 },
    });

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: mockAiResponse.choices[0].message.content,
      model: mockAiResponse.model,
      usage: {
        prompt_tokens: mockAiResponse.usage.promptTokens,
        completion_tokens: mockAiResponse.usage.completionTokens,
      },
    });
    mockInsertSingle.mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: mockAiResponse.choices[0].message.content,
        model_name: mockAiResponse.model,
        prompt_tokens: mockAiResponse.usage.promptTokens,
        completion_tokens: mockAiResponse.usage.completionTokens,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    await service.sendMessage(conversationId, content, model, userId);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: conversationId,
        role: "assistant",
        content: mockAiResponse.choices[0].message.content,
        model_name: mockAiResponse.model,
        prompt_tokens: mockAiResponse.usage.promptTokens,
        completion_tokens: mockAiResponse.usage.completionTokens,
      })
    );
  });

  it("2.7: Returns both user and assistant messages as MessageDto array", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockAssistantMessage = {
      id: "msg-assistant-1",
      role: "assistant" as const,
      content: "Response",
      model_name: "gpt-4o-mini",
      prompt_tokens: 10,
      completion_tokens: 5,
      created_at: "2024-01-01T00:00:01Z",
    };

    mockInsertSingle
      .mockResolvedValueOnce({ data: mockUserMessage, error: null })
      .mockResolvedValueOnce({ data: mockAssistantMessage, error: null });

    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const result = await service.sendMessage(conversationId, content, model, userId);

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("conversation_id");
    expect(result[1]).not.toHaveProperty("conversation_id");
  });

  it("2.8: Throws error when user message save fails", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    mockInsertSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Save error" },
    });

    await expect(service.sendMessage(conversationId, content, model, userId)).rejects.toThrow(
      "Failed to save user message"
    );
  });

  it("2.9: Throws error when history fetch fails", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "History error" },
    });

    await expect(service.sendMessage(conversationId, content, model, userId)).rejects.toThrow(
      "Failed to fetch conversation history"
    );
  });

  it("2.10: Throws error when OpenRouter API call fails", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockRejectedValue(new Error("API error"));

    await expect(service.sendMessage(conversationId, content, model, userId)).rejects.toThrow();
  });

  it("2.11: Throws error when assistant message save fails", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    mockInsertSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Save error" },
    });

    await expect(service.sendMessage(conversationId, content, model, userId)).rejects.toThrow(
      "Failed to save assistant message"
    );
  });

  it("2.12: Handles empty conversation history (first message)", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null }).mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: "Response",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const result = await service.sendMessage(conversationId, content, model, userId);

    expect(result).toHaveLength(2);
    expect(mockOpenRouterService.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessages: [{ content }],
        assistantMessages: [],
      })
    );
  });

  it("2.13: Handles conversation with system message (summary)", async () => {
    const conversationId = "conv-123";
    const content = "Hello";
    const model = "gpt-4o-mini";
    const userId = "user-123";

    const mockUserMessage = {
      id: "msg-user-1",
      role: "user" as const,
      content,
      model_name: null,
      prompt_tokens: null,
      completion_tokens: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockHistory = [{ role: "system" as const, content: "Summary of previous conversation" }];

    mockInsertSingle.mockResolvedValueOnce({ data: mockUserMessage, error: null }).mockResolvedValueOnce({
      data: {
        id: "msg-assistant-1",
        role: "assistant" as const,
        content: "Response",
        model_name: "gpt-4o-mini",
        prompt_tokens: 10,
        completion_tokens: 5,
        created_at: "2024-01-01T00:00:01Z",
      },
      error: null,
    });

    mockOrder.mockResolvedValue({ data: mockHistory, error: null });
    mockOpenRouterService.createChatCompletion.mockResolvedValue({
      content: "Response",
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    await service.sendMessage(conversationId, content, model, userId);

    expect(mockOpenRouterService.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        systemMessage: expect.stringContaining("Summary of previous conversation"),
      })
    );
  });
});
