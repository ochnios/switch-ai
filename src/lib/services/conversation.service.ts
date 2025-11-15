import type { SupabaseClient } from "../../db/supabase.client";
import type { BranchType, ConversationDto, PaginatedConversationsDto } from "../../types";
import { config } from "../config";
import { Logger } from "../logger";
import { OpenRouterService } from "./open-router.service";

const logger = new Logger("ConversationService");

/**
 * Service for managing conversations
 */
export class ConversationService {
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClient) {
    this.openRouterService = new OpenRouterService(supabase);
  }

  /**
   * Generates a title for a conversation based on the first message
   * Uses AI to create a concise, language-appropriate title (3-4 words max)
   *
   * @param firstMessage - The first message content
   * @param userId - The user's ID (required for OpenRouter API access)
   * @returns Generated title for the conversation (max 50 characters)
   * @throws Error if title generation fails
   */
  async generateTitle(firstMessage: string, userId: string): Promise<string> {
    try {
      // Use OpenRouter to generate a concise title
      const response = await this.openRouterService.createChatCompletion({
        userId,
        model: config.ai.titleGeneration.model,
        systemMessage: config.ai.titleGeneration.prompt,
        userMessages: [{ content: firstMessage }],
        modelParams: {
          temperature: config.ai.titleGeneration.temperature,
          maxTokens: config.ai.titleGeneration.maxTokens,
        },
      });

      // Extract and clean the generated title
      let title = response.content.trim();

      // Remove quotes if present (in case AI wraps title in quotes)
      title = title.replace(/^["']|["']$/g, "");

      // Truncate to 50 characters if longer
      if (title.length > 50) {
        title = title.substring(0, 50).trim();
        // Remove trailing punctuation or incomplete words
        title = title.replace(/[.,!?;:\s]+$/, "");
      }

      // Fallback to a default title if empty
      if (!title) {
        logger.warn("Generated title was empty, using fallback", { userId });
        title = "New Conversation";
      }

      logger.info("Generated conversation title", {
        userId,
        titleLength: title.length,
      });

      return title;
    } catch (error) {
      // Log error and return fallback title
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        userId,
        firstMessageLength: firstMessage.length,
      });

      // Return a fallback title based on first message preview
      return firstMessage.substring(0, 50).trim() || "New Conversation";
    }
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

  /**
   * Creates a new conversation by branching from an existing message
   * Supports two modes: "full" (copies entire history) or "summary" (AI-generated summary)
   *
   * @param messageId - The ID of the message to branch from
   * @param type - The branch type ("full" or "summary")
   * @returns The newly created conversation
   * @throws Error if message not found, unauthorized, or operation fails
   */
  async createBranchFromMessage(messageId: string, type: BranchType): Promise<ConversationDto> {
    try {
      // Step 1: Verify message exists and get its conversation
      const { data: sourceMessage, error: messageError } = await this.supabase
        .from("messages")
        .select("id, conversation_id, created_at")
        .eq("id", messageId)
        .maybeSingle();

      if (messageError) {
        logger.error(new Error("Failed to fetch source message"), { messageId, error: messageError });
        throw new Error("Failed to fetch source message");
      }

      if (!sourceMessage) {
        throw new Error("Message not found");
      }

      // Step 2: Get parent conversation details including user_id
      const { data: parentConversation, error: conversationError } = await this.supabase
        .from("conversations")
        .select("id, title, branch_count, user_id")
        .eq("id", sourceMessage.conversation_id)
        .single();

      if (conversationError || !parentConversation) {
        logger.error(new Error("Failed to fetch parent conversation"), {
          conversationId: sourceMessage.conversation_id,
          error: conversationError,
        });
        throw new Error("Failed to fetch parent conversation");
      }

      // Step 3: Increment branch count on parent conversation
      const newBranchCount = (parentConversation.branch_count || 0) + 1;
      const { error: updateError } = await this.supabase
        .from("conversations")
        .update({ branch_count: newBranchCount })
        .eq("id", parentConversation.id);

      if (updateError) {
        logger.error(new Error("Failed to update branch count"), {
          conversationId: parentConversation.id,
          error: updateError,
        });
        throw new Error("Failed to update branch count");
      }

      // Step 4: Create new conversation with appropriate title
      const branchTitle = parentConversation.title
        ? `${parentConversation.title} - branch ${newBranchCount}`
        : `branch ${newBranchCount}`;

      const { data: newConversation, error: createError } = await this.supabase
        .from("conversations")
        .insert({
          user_id: parentConversation.user_id,
          title: branchTitle,
          parent_conversation_id: parentConversation.id,
        })
        .select("id, title, parent_conversation_id, created_at")
        .single();

      if (createError || !newConversation) {
        logger.error(new Error("Failed to create branch conversation"), { error: createError });
        throw new Error("Failed to create branch conversation");
      }

      // Step 5: Process history based on branch type
      if (type === "full") {
        await this.copyMessagesForFullBranch(
          sourceMessage.conversation_id,
          sourceMessage.created_at,
          newConversation.id
        );
      } else {
        await this.createSummaryForBranch(
          sourceMessage.conversation_id,
          sourceMessage.created_at,
          newConversation.id,
          parentConversation.user_id
        );
      }

      return newConversation;
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), { messageId, type });
      throw error;
    }
  }

  /**
   * Copies all messages up to and including the source message for a full branch
   *
   * @param parentConversationId - The parent conversation ID
   * @param sourceMessageCreatedAt - The created_at timestamp of the source message
   * @param newConversationId - The new conversation ID
   * @throws Error if copy operation fails
   */
  private async copyMessagesForFullBranch(
    parentConversationId: string,
    sourceMessageCreatedAt: string,
    newConversationId: string
  ): Promise<void> {
    // Fetch all messages up to and including the source message
    const { data: messages, error: fetchError } = await this.supabase
      .from("messages")
      .select("role, content, model_name, prompt_tokens, completion_tokens")
      .eq("conversation_id", parentConversationId)
      .lte("created_at", sourceMessageCreatedAt)
      .order("created_at", { ascending: true });

    if (fetchError) {
      logger.error(new Error("Failed to fetch messages for full branch"), {
        parentConversationId,
        error: fetchError,
      });
      throw new Error("Failed to fetch messages for full branch");
    }

    if (!messages || messages.length === 0) {
      return;
    }

    // Copy messages to new conversation
    const messagesToInsert = messages.map((msg) => ({
      conversation_id: newConversationId,
      role: msg.role,
      content: msg.content,
      model_name: msg.model_name,
      prompt_tokens: msg.prompt_tokens,
      completion_tokens: msg.completion_tokens,
    }));

    const { error: insertError } = await this.supabase.from("messages").insert(messagesToInsert);

    if (insertError) {
      logger.error(new Error("Failed to insert messages for full branch"), {
        newConversationId,
        error: insertError,
      });
      throw new Error("Failed to insert messages for full branch");
    }
  }

  /**
   * Creates a summary message for a summary branch using AI
   * Uses OpenRouter to generate a concise summary of the conversation history
   *
   * @param parentConversationId - The parent conversation ID
   * @param sourceMessageCreatedAt - The created_at timestamp of the source message
   * @param newConversationId - The new conversation ID
   * @param userId - The user's ID (required for OpenRouter API access)
   * @throws Error if summary generation fails
   */
  private async createSummaryForBranch(
    parentConversationId: string,
    sourceMessageCreatedAt: string,
    newConversationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Fetch conversation history up to the source message
      const { data: messages, error: fetchError } = await this.supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", parentConversationId)
        .lte("created_at", sourceMessageCreatedAt)
        .order("created_at", { ascending: true });

      if (fetchError || !messages || messages.length === 0) {
        logger.error(new Error("Failed to fetch messages for summary branch"), {
          parentConversationId,
          error: fetchError,
        });
        throw new Error("Failed to fetch messages for summary branch");
      }

      // Format conversation history as text for summarization
      const conversationText = messages
        .map((msg) => {
          const role = msg.role === "user" ? "USER" : msg.role === "assistant" ? "ASSISTANT" : "SYSTEM";
          return `${role}: ${msg.content}`;
        })
        .join("\n\n");

      // Guard: Prevent empty conversation text from being sent to OpenRouter
      if (!conversationText || conversationText.trim().length === 0) {
        throw new Error("No conversation content to summarize");
      }

      // Generate summary using OpenRouter
      const summaryResponse = await this.openRouterService.createChatCompletion({
        userId,
        model: config.ai.conversationSummary.model,
        systemMessage: config.ai.conversationSummary.prompt,
        userMessages: [{ content: conversationText }],
        modelParams: {
          temperature: config.ai.conversationSummary.temperature,
          maxTokens: config.ai.conversationSummary.maxTokens,
        },
      });

      // Extract the summary
      const summary = summaryResponse.content.trim();

      // Insert summary as a system message in the new conversation
      const { error: insertError } = await this.supabase.from("messages").insert({
        conversation_id: newConversationId,
        role: "system",
        content: summary,
        model_name: summaryResponse.model,
        prompt_tokens: summaryResponse.usage.prompt_tokens,
        completion_tokens: summaryResponse.usage.completion_tokens,
      });

      if (insertError) {
        logger.error(new Error("Failed to insert summary message"), {
          newConversationId,
          error: insertError,
        });
        throw new Error("Failed to insert summary message");
      }

      logger.info("Created conversation summary for branch", {
        userId,
        parentConversationId,
        newConversationId,
        messageCount: messages.length,
        summaryLength: summary.length,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        userId,
        parentConversationId,
        newConversationId,
      });
      throw error;
    }
  }
}
