import type { SupabaseClient } from "../../db/supabase.client";
import type { MessageDto, PaginatedMessagesDto } from "../../types";
import { Logger } from "../logger";
import { ApiKeyService } from "./api-key.service";
import type { ChatMessage } from "./open-router.service";
import { OpenRouterService } from "./open-router.service";

const logger = new Logger("MessageService");

/**
 * Service for managing messages in conversations
 */
export class MessageService {
  private apiKeyService: ApiKeyService;
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClient) {
    this.apiKeyService = new ApiKeyService();
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Retrieves paginated messages for a specific conversation
   * Ensures the conversation belongs to the authenticated user
   *
   * @param userId - The authenticated user's ID
   * @param conversationId - The conversation ID
   * @param page - The page number (1-indexed)
   * @param pageSize - Number of messages per page
   * @returns Paginated list of messages
   * @throws Error if conversation doesn't exist or doesn't belong to user
   */
  async getMessages(
    userId: string,
    conversationId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedMessagesDto> {
    // First, verify the conversation exists and belongs to the user
    const { data: conversation, error: conversationError } = await this.supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (conversationError || !conversation) {
      throw new Error("Conversation not found");
    }

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Get total count of messages
    const { count, error: countError } = await this.supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    if (countError) {
      throw new Error("Failed to count messages");
    }

    // Fetch paginated messages, sorted by creation date (ascending)
    const { data: messages, error: messagesError } = await this.supabase
      .from("messages")
      .select("id, role, content, model_name, prompt_tokens, completion_tokens, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (messagesError) {
      throw new Error("Failed to fetch messages");
    }

    // Transform to MessageDto (exclude conversation_id)
    const messageDtos: MessageDto[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      model_name: msg.model_name,
      prompt_tokens: msg.prompt_tokens,
      completion_tokens: msg.completion_tokens,
      created_at: msg.created_at,
    }));

    return {
      data: messageDtos,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
      },
    };
  }

  /**
   * Sends a user message and gets AI response
   * Creates user message, fetches conversation history, calls AI, saves assistant response
   *
   * @param userId - The user's ID
   * @param conversationId - The conversation ID
   * @param content - The message content
   * @param model - The AI model to use
   * @returns Array containing the user message and assistant response
   * @throws Error if conversation doesn't exist, API key missing, or AI call fails
   */
  async sendMessage(userId: string, conversationId: string, content: string, model: string): Promise<MessageDto[]> {
    try {
      // Get API key
      const apiKey = this.apiKeyService.getApiKey();

      // Save user message
      const { data: userMessage, error: userMessageError } = await this.supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content,
        })
        .select("id, role, content, model_name, prompt_tokens, completion_tokens, created_at")
        .single();

      if (userMessageError || !userMessage) {
        logger.error(new Error("Failed to save user message"), {
          userId,
          conversationId,
          error: userMessageError,
        });
        throw new Error("Failed to save user message");
      }

      // Fetch conversation history for context
      const { data: historyMessages, error: historyError } = await this.supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (historyError) {
        logger.error(new Error("Failed to fetch conversation history"), {
          userId,
          conversationId,
          error: historyError,
        });
        throw new Error("Failed to fetch conversation history");
      }

      // Format messages for OpenRouter API
      const chatMessages: ChatMessage[] = historyMessages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));

      // Call OpenRouter API
      const aiResponse = await this.openRouterService.createChatCompletion(apiKey, model, chatMessages);

      // Save assistant message
      const { data: assistantMessage, error: assistantMessageError } = await this.supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: aiResponse.content,
          model_name: aiResponse.model,
          prompt_tokens: aiResponse.usage.prompt_tokens,
          completion_tokens: aiResponse.usage.completion_tokens,
        })
        .select("id, role, content, model_name, prompt_tokens, completion_tokens, created_at")
        .single();

      if (assistantMessageError || !assistantMessage) {
        logger.error(new Error("Failed to save assistant message"), {
          userId,
          conversationId,
          error: assistantMessageError,
        });
        throw new Error("Failed to save assistant message");
      }

      // Return both messages
      return [
        {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          model_name: userMessage.model_name,
          prompt_tokens: userMessage.prompt_tokens,
          completion_tokens: userMessage.completion_tokens,
          created_at: userMessage.created_at,
        },
        {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          model_name: assistantMessage.model_name,
          prompt_tokens: assistantMessage.prompt_tokens,
          completion_tokens: assistantMessage.completion_tokens,
          created_at: assistantMessage.created_at,
        },
      ];
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        userId,
        conversationId,
      });
      throw error;
    }
  }
}
