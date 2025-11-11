import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { OpenRouterError } from "../../../../lib/errors";
import { Logger } from "../../../../lib/logger";
import { paginationQuerySchema } from "../../../../lib/schemas/common.schema";
import { sendMessageCommandSchema } from "../../../../lib/schemas/messages.schema";
import { MessageService } from "../../../../lib/services/message.service";
import type { ErrorResponseDto, MessageDto, PaginatedMessagesDto } from "../../../../types";

export const prerender = false;

const getLogger = new Logger("GET /api/conversations/[id]/messages");
const postLogger = new Logger("POST /api/conversations/[id]/messages");

/**
 * GET /api/conversations/[id]/messages
 * Retrieves paginated messages for a specific conversation
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  // Get conversation ID from path parameter
  const conversationId = context.params.id;

  if (!conversationId) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: "Conversation ID is required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Validate pagination query parameters
    const queryParams = Object.fromEntries(context.url.searchParams);
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
    const result: PaginatedMessagesDto = await messageService.getMessages(conversationId, page, pageSize);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
 * POST /api/conversations/[id]/messages
 * Sends a message to an existing conversation and returns the AI response
 */
export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  // Get conversation ID from path parameter
  const conversationId = context.params.id;

  if (!conversationId) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: "Conversation ID is required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

    // Send message and get AI response
    const messageService = new MessageService(supabase);
    const messages: MessageDto[] = await messageService.sendMessage(conversationId, content, model, userId);

    return new Response(JSON.stringify(messages), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
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

    // Handle OpenRouter service errors (API key issues, AI model errors)
    if (error instanceof OpenRouterError) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: error.message,
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
};
