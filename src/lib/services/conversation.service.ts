import type { SupabaseClient } from "../../db/supabase.client";
import type { ConversationDto, PaginatedConversationsDto } from "../../types";
import { Logger } from "../logger";

const logger = new Logger("ConversationService");

/**
 * Service for managing conversations
 */
export class ConversationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generates a title for a conversation based on the first message
   * TODO: Implement AI-powered title generation using OpenRouterService
   * This should analyze the conversation content and generate a meaningful, concise title
   *
   * @param firstMessage - The first message content
   * @returns Generated title for the conversation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateTitle(firstMessage: string): Promise<string> {
    // TODO: Use OpenRouterService to generate a meaningful title based on the first message
    // For now, return a placeholder title
    return "Generated title";
  }

  /**
   * Creates a new conversation for a user
   *
   * @param userId - The user's ID
   * @param title - Optional title for the conversation
   * @returns The created conversation
   * @throws Error if creation fails
   */
  async createConversation(userId: string, title?: string): Promise<ConversationDto> {
    const { data, error } = await this.supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: title || null,
      })
      .select("id, title, parent_conversation_id, created_at")
      .single();

    if (error || !data) {
      logger.error(new Error("Failed to create conversation"), { userId, error });
      throw new Error("Failed to create conversation");
    }

    return data;
  }

  /**
   * Retrieves a paginated list of conversations for the current user
   * Conversations are sorted by creation date in descending order
   *
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @returns Paginated conversations with metadata
   * @throws Error if query fails
   */
  async getConversations(page: number, pageSize: number): Promise<PaginatedConversationsDto> {
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Execute queries in parallel for better performance
    const [countResult, dataResult] = await Promise.all([
      // Get total count of conversations
      this.supabase.from("conversations").select("id", { count: "exact", head: true }),
      // Get paginated conversations
      this.supabase
        .from("conversations")
        .select("id, title, parent_conversation_id, created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1),
    ]);

    if (countResult.error) {
      logger.error(new Error("Failed to count conversations"), { error: countResult.error });
      throw new Error("Failed to retrieve conversations");
    }

    if (dataResult.error) {
      logger.error(new Error("Failed to fetch conversations"), { error: dataResult.error });
      throw new Error("Failed to retrieve conversations");
    }

    return {
      data: dataResult.data || [],
      pagination: {
        page,
        pageSize,
        total: countResult.count || 0,
      },
    };
  }

  /**
   * Retrieves a single conversation by its ID
   * RLS policies ensure users can only access their own conversations
   *
   * @param conversationId - The conversation ID to retrieve
   * @returns The conversation if found, null otherwise
   * @throws Error if query fails
   */
  async getConversationById(conversationId: string): Promise<ConversationDto | null> {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("id, title, parent_conversation_id, created_at")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) {
      logger.error(new Error("Failed to fetch conversation"), { conversationId, error });
      throw new Error("Failed to retrieve conversation");
    }

    return data;
  }

  /**
   * Deletes a conversation and all associated messages
   * RLS policies ensure users can only delete their own conversations
   * Messages are automatically deleted via ON DELETE CASCADE
   *
   * @param conversationId - The conversation ID to delete
   * @returns true if conversation was deleted, false if not found or unauthorized
   * @throws Error if deletion fails
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from("conversations")
      .delete({ count: "exact" })
      .eq("id", conversationId);

    if (error) {
      logger.error(new Error("Failed to delete conversation"), { conversationId, error });
      throw new Error("Failed to delete conversation");
    }

    // Return true if a row was deleted, false if no rows affected (not found or unauthorized)
    return (count ?? 0) > 0;
  }
}
