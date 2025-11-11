import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { ApiKeyNotFoundError } from "../../lib/errors";
import { Logger } from "../../lib/logger";
import { OpenRouterService } from "../../lib/services/open-router.service";
import type { ErrorResponseDto, ModelsListDto } from "../../types";

export const prerender = false;

const getLogger = new Logger("GET /api/models");

/**
 * GET /api/models
 * Retrieves the list of available AI models from OpenRouter
 * Requires the user to have a valid API key configured
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  try {
    // Fetch models using service
    const openRouterService = new OpenRouterService(supabase);
    const models = await openRouterService.fetchModels(userId);

    const response: ModelsListDto = {
      data: models,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle API key not found error
    if (error instanceof ApiKeyNotFoundError) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 404,
        message: "API key not configured. Please add your OpenRouter API key first.",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
