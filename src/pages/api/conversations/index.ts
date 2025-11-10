import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { Logger } from "../../../lib/logger";
import { paginationQuerySchema } from "../../../lib/schemas/common.schema";
import { sendMessageCommandSchema } from "../../../lib/schemas/messages.schema";
import { ConversationService } from "../../../lib/services/conversation.service";
import { MessageService } from "../../../lib/services/message.service";
import type { ConversationWithMessagesDto, ErrorResponseDto, PaginatedConversationsDto } from "../../../types";

export const prerender = false;

const getLogger = new Logger("GET /api/conversations");
const postLogger = new Logger("POST /api/conversations");

/**
 * GET /api/conversations
 * Retrieves a paginated list of conversations for the current user
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  try {
    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    };

    const queryValidation = paginationQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Invalid query parameters",
        errors: queryValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { page, pageSize } = queryValidation.data;

    // Fetch conversations
    const conversationService = new ConversationService(supabase);
    const result: PaginatedConversationsDto = await conversationService.getConversations(page, pageSize);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    getLogger.error(error instanceof Error ? error : new Error(String(error)));
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "Failed to retrieve conversations",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/conversations
 * Creates a new conversation with the first message and returns the AI response
 */
export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  try {
    // Parse and validate request body (CreateConversationFromMessageCommand has same structure as SendMessageCommand)
    const body = await context.request.json();
    const bodyValidation = sendMessageCommandSchema.safeParse(body);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Invalid request body",
        errors: bodyValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { content, model } = bodyValidation.data;

    // Create new conversation
    const conversationService = new ConversationService(supabase);
    let conversationId: string;

    try {
      // Generate title based on first message
      const title = await conversationService.generateTitle(content);
      const newConversation = await conversationService.createConversation(userId, title);
      conversationId = newConversation.id;
    } catch (error) {
      postLogger.error(error instanceof Error ? error : new Error(String(error)), { userId });
      const errorResponse: ErrorResponseDto = {
        statusCode: 500,
        message: "Failed to create conversation",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send first message and get AI response
    try {
      const messageService = new MessageService(supabase);
      const messages = await messageService.sendMessage(conversationId, content, model);

      // Fetch the created conversation to return full details
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id, title, parent_conversation_id, created_at")
        .eq("id", conversationId)
        .single();

      if (conversationError || !conversation) {
        postLogger.error(new Error("Failed to fetch conversation"), { conversationId, userId });
        const errorResponse: ErrorResponseDto = {
          statusCode: 500,
          message: "Failed to fetch conversation",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const response: ConversationWithMessagesDto = {
        conversation,
        messages,
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle API key errors
      if (error instanceof Error && error.message === "OpenRouter API key not configured") {
        const errorResponse: ErrorResponseDto = {
          statusCode: 400,
          message: "OpenRouter API key not configured",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle unexpected errors
      postLogger.error(error instanceof Error ? error : new Error(String(error)), {
        userId,
        conversationId,
      });
      const errorResponse: ErrorResponseDto = {
        statusCode: 500,
        message: "Failed to send message",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Invalid JSON in request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    postLogger.error(error instanceof Error ? error : new Error(String(error)), { userId });
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "Internal server error",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
