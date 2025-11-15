import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { createAuthService } from "@/lib/services/auth.service";
import type { ErrorResponseDto } from "@/types";
import { AuthError } from "@/lib/errors/auth.errors";
import { Logger } from "@/lib/logger";

export const prerender = false;

const logger = new Logger("POST /api/auth/logout");

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create auth service and sign out
    const authService = createAuthService(supabase);
    await authService.signOut();

    // Supabase automatically clears session cookies via setAll in createSupabaseServerInstance

    // Return success response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle auth-specific errors
    if (error instanceof AuthError) {
      const errorResponse: ErrorResponseDto = {
        statusCode: error.statusCode,
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    logger.error(error instanceof Error ? error : new Error(String(error)));
    const errorResponse: ErrorResponseDto = {
      statusCode: 500,
      message: "An unexpected error occurred during logout",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
