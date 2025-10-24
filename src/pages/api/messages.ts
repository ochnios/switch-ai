import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { Logger } from "../../lib/logger";
import { paginationQuerySchema, uuidParamSchema } from "../../lib/schemas/common.schema";
import { sendMessageCommandSchema } from "../../lib/schemas/messages.schema";
import { ConversationService } from "../../lib/services/conversation.service";
import { MessageService } from "../../lib/services/message.service";
import type { ConversationWithMessagesDto, ErrorResponseDto, MessageDto, PaginatedMessagesDto } from "../../types";

export const prerender = false;

const getLogger = new Logger("GET /api/messages");
const postLogger = new Logger("POST /api/messages");

/**
 * GET /api/messages?id={conversationId}
 * Retrieves paginated messages for a specific conversation
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // Use DEFAULT_USER_ID for development (bypassing authentication)
  const userId = DEFAULT_USER_ID;

  // Validate query parameters (conversation ID from query string)
  const queryParams = Object.fromEntries(context.url.searchParams);
  const idValidation = uuidParamSchema.safeParse(queryParams);
  if (!idValidation.success) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: "Invalid conversation ID",
      errors: idValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const conversationId = idValidation.data.id;

  try {
    // Validate pagination query parameters
    const queryValidation = paginationQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Invalid pagination parameters",
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

    // Use MessageService to fetch messages
    const messageService = new MessageService(supabase);
    const result: PaginatedMessagesDto = await messageService.getMessages(userId, conversationId, page, pageSize);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle "Conversation not found" errors
    if (error instanceof Error && error.message === "Conversation not found") {
      const errorResponse: ErrorResponseDto = {
        statusCode: 404,
        message: "Conversation not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    getLogger.error(error instanceof Error ? error : new Error(String(error)), {
      conversationId,
      userId,
    });
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

/**
 * POST /api/messages
 * Creates a new message in a conversation (or creates a new conversation if id not provided)
 * Returns the user message and the AI assistant's response
 */
export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  try {
    // Parse and validate request body
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

    // Check if conversation ID is provided in query params
    const conversationIdParam = context.url.searchParams.get("id");

    const messageService = new MessageService(supabase);
    const conversationService = new ConversationService(supabase);

    let conversationId: string;
    let isNewConversation = false;

    if (conversationIdParam) {
      // Validate conversation ID format
      const idValidation = uuidParamSchema.safeParse({ id: conversationIdParam });
      if (!idValidation.success) {
        const errorResponse: ErrorResponseDto = {
          statusCode: 400,
          message: "Invalid conversation ID format",
          errors: idValidation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify conversation ownership
      try {
        await conversationService.verifyConversationOwnership(userId, conversationIdParam);
        conversationId = conversationIdParam;
      } catch {
        const errorResponse: ErrorResponseDto = {
          statusCode: 404,
          message: "Conversation not found",
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Create new conversation
      try {
        const newConversation = await conversationService.createConversation(userId);
        conversationId = newConversation.id;
        isNewConversation = true;
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
    }

    // Send message and get AI response
    try {
      const messages: MessageDto[] = await messageService.sendMessage(userId, conversationId, content, model);

      // If new conversation, return conversation with messages
      if (isNewConversation) {
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
      }

      // Otherwise, just return the messages
      return new Response(JSON.stringify(messages), {
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
