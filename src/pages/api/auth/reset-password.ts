import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { createAuthService } from "@/lib/services/auth.service";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";
import type { SuccessResponseDto, ErrorResponseDto } from "@/types";
import { AuthError } from "@/lib/errors/auth.errors";
import { Logger } from "@/lib/logger";

export const prerender = false;

const logger = new Logger("POST /api/auth/reset-password");

/**
 * POST /api/auth/reset-password
 * Sends a password reset email to the user
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { email } = validationResult.data;

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create auth service and send reset email
    const authService = createAuthService(supabase);
    await authService.resetPassword(email);

    // Return success response (don't reveal if email exists or not for security)
    const response: SuccessResponseDto = {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent",
    };
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
