import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { createAuthService } from "@/lib/services/auth.service";
import type { SessionResponseDto, ErrorResponseDto } from "@/types";
import { Logger } from "@/lib/logger";

export const prerender = false;

const logger = new Logger("GET /api/auth/session");

/**
 * GET /api/auth/session
 * Retrieves the current user session information
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create auth service and get user
    const authService = createAuthService(supabase);
    const user = await authService.getUser();

    // Return user data (or null if not authenticated)
    const response: SessionResponseDto = { user };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    logger.error(error instanceof Error ? error : new Error(String(error)));
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "An unexpected error occurred while checking session",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
