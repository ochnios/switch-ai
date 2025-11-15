import type { APIRoute } from "astro";

import { Logger } from "../../../../../../lib/logger";
import { createBranchCommandSchema } from "../../../../../../lib/schemas/branch.schema";
import { uuidParamSchema } from "../../../../../../lib/schemas/common.schema";
import { ConversationService } from "../../../../../../lib/services/conversation.service";
import { getUserIdOrUnauthorized } from "../../../../../../lib/utils/auth-helpers";
import type { ConversationDto, ErrorResponseDto } from "../../../../../../types";

export const prerender = false;

const logger = new Logger("POST /api/conversations/[conversationId]/messages/[messageId]/branch");

/**
 * POST /api/conversations/[conversationId]/messages/[messageId]/branch
 * Creates a new conversation by branching from an existing message
 */
export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = getUserIdOrUnauthorized(context);
  if (userId instanceof Response) return userId;

  // Get path parameters
  const conversationId = context.params.conversationId;
  const messageId = context.params.messageId;

  // Validate conversation ID
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

  const conversationIdValidation = uuidParamSchema.safeParse({ id: conversationId });
  if (!conversationIdValidation.success) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: "Invalid conversation ID format",
      errors: conversationIdValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate message ID
  if (!messageId) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: "Message ID is required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messageIdValidation = uuidParamSchema.safeParse({ id: messageId });
  if (!messageIdValidation.success) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: "Invalid message ID format",
      errors: messageIdValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse and validate request body
    const body = await context.request.json();
    const bodyValidation = createBranchCommandSchema.safeParse(body);

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

    const { type } = bodyValidation.data;

    // Create branch using ConversationService
    const conversationService = new ConversationService(supabase);
    const newConversation: ConversationDto = await conversationService.createBranchFromMessage(messageId, type, userId);

    return new Response(JSON.stringify(newConversation), {
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

    // Handle "not found" errors
    if (error instanceof Error && error.message === "Message not found") {
      const errorResponse: ErrorResponseDto = {
        statusCode: 404,
        message: "Message not found or access denied",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      userId,
      conversationId,
      messageId,
    });
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "Failed to create branch",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
