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
}
