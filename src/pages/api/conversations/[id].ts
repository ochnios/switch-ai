import type { APIRoute } from "astro";

import { Logger } from "../../../lib/logger";
import { uuidParamSchema } from "../../../lib/schemas/common.schema";
import { ConversationService } from "../../../lib/services/conversation.service";
import { getUserIdOrUnauthorized } from "../../../lib/utils/auth-helpers";
import type { ConversationDto, ErrorResponseDto } from "../../../types";

export const prerender = false;

const getLogger = new Logger("GET /api/conversations/{id}");
const deleteLogger = new Logger("DELETE /api/conversations/{id}");

/**
 * GET /api/conversations/{id}
 * Retrieves a single conversation by its ID
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = getUserIdOrUnauthorized(context);
  if (userId instanceof Response) return userId;

  try {
    // Validate path parameter
    const paramValidation = uuidParamSchema.safeParse(context.params);

    if (!paramValidation.success) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Invalid conversation ID",
        errors: paramValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = paramValidation.data;

    // Fetch conversation for the current user
    const conversationService = new ConversationService(supabase);
    const conversation: ConversationDto | null = await conversationService.getConversationById(id, userId);

    if (!conversation) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 404,
        message: "Conversation not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(conversation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    getLogger.error(error instanceof Error ? error : new Error(String(error)), {
      conversationId: context.params.id,
    });
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "Failed to retrieve conversation",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/conversations/{id}
 * Deletes a conversation and all associated messages
 */
export const DELETE: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = getUserIdOrUnauthorized(context);
  if (userId instanceof Response) return userId;

  try {
    // Validate path parameter
    const paramValidation = uuidParamSchema.safeParse(context.params);

    if (!paramValidation.success) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Invalid conversation ID",
        errors: paramValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = paramValidation.data;

    // Delete conversation for the current user
    const conversationService = new ConversationService(supabase);
    const deleted: boolean = await conversationService.deleteConversation(id, userId);

    if (!deleted) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 404,
        message: "Conversation not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return 204 No Content with empty body
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    deleteLogger.error(error instanceof Error ? error : new Error(String(error)), {
      conversationId: context.params.id,
    });
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "Failed to delete conversation",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
