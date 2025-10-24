import type { SupabaseClient } from "../../db/supabase.client";
import type { ConversationDto } from "../../types";
import { Logger } from "../logger";

const logger = new Logger("ConversationService");

/**
 * Service for managing conversations
 */
export class ConversationService {
  constructor(private supabase: SupabaseClient) {}

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
   * Verifies that a conversation exists and belongs to the user
   *
   * @param userId - The user's ID
   * @param conversationId - The conversation ID
   * @returns True if conversation exists and belongs to user
   * @throws Error if conversation doesn't exist or doesn't belong to user
   */
  async verifyConversationOwnership(userId: string, conversationId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new Error("Conversation not found");
    }

    return true;
  }
}
