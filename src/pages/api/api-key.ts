import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { Logger } from "../../lib/logger";
import { upsertApiKeyCommandSchema } from "../../lib/schemas/api-key.schema";
import { ApiKeyService } from "../../lib/services/api-key.service";
import type { ApiKeyExistsDto, ErrorResponseDto, SuccessResponseDto } from "../../types";

export const prerender = false;

const putLogger = new Logger("PUT /api/api-key");
const getLogger = new Logger("GET /api/api-key");
const deleteLogger = new Logger("DELETE /api/api-key");

/**
 * PUT /api/api-key
 * Creates or updates the API key for the authenticated user
 */
export const PUT: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  try {
    // Parse and validate request body
    const body = await context.request.json();
    const bodyValidation = upsertApiKeyCommandSchema.safeParse(body);

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

    const { apiKey } = bodyValidation.data;

    // Upsert API key using service
    const apiKeyService = new ApiKeyService(supabase);
    await apiKeyService.upsertApiKey(userId, apiKey);

    const successResponse: SuccessResponseDto = {
      success: true,
      message: "API key saved successfully.",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
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

    // Handle unexpected errors
    putLogger.error(error instanceof Error ? error : new Error(String(error)), {
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
 * GET /api/api-key
 * Checks if an API key exists for the authenticated user
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  try {
    // Check if API key exists using service
    const apiKeyService = new ApiKeyService(supabase);
    const exists = await apiKeyService.checkApiKeyExists(userId);

    const response: ApiKeyExistsDto = {
      exists,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    getLogger.error(error instanceof Error ? error : new Error(String(error)), {
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
 * DELETE /api/api-key
 * Deletes the API key for the authenticated user
 */
export const DELETE: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  try {
    // Delete API key using service
    const apiKeyService = new ApiKeyService(supabase);
    await apiKeyService.deleteApiKey(userId);

    // Return 204 No Content (no response body)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle unexpected errors
    deleteLogger.error(error instanceof Error ? error : new Error(String(error)), {
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
