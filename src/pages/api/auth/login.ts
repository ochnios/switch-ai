import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { createAuthService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/schemas/auth.schema";
import type { LoginResponseDto, ErrorResponseDto } from "@/types";
import { AuthError } from "@/lib/errors/auth.errors";
import { Logger } from "@/lib/logger";

export const prerender = false;

const logger = new Logger("POST /api/auth/login");

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponseDto = {
        statusCode: 400,
        message: "Validation failed",
        errors: validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create auth service and sign in
    const authService = createAuthService(supabase);
    const user = await authService.signIn(email, password);

    // Supabase automatically sets session cookies via setAll in createSupabaseServerInstance

    // Return success response
    const response: LoginResponseDto = { user };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
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
      message: "An unexpected error occurred. Please try again later",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
