import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { Logger } from "../../lib/logger";
import { OpenRouterService } from "../../lib/services/open-router.service";
import { handleApiError } from "../../lib/utils/api-error-handler";
import type { ModelsListDto } from "../../types";

export const prerender = false;

const logger = new Logger("GET /api/models");

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
    return handleApiError(error, logger, { userId });
  }
};
