import type { ErrorResponseDto } from "@/types";

/**
 * Extracts the authenticated user ID from the Astro context.
 * Returns the userId if authenticated, or an unauthorized Response if not.
 *
 * Usage in API routes:
 * ```typescript
 * const userId = getUserIdOrUnauthorized(context);
 * if (userId instanceof Response) return userId;
 * // Now userId is a string and you can use it safely
 * ```
 *
 * @param context - Astro API context with locals
 * @returns User ID string or 401 Response object
 */
export function getUserIdOrUnauthorized(context: { locals: { user?: { id?: string } | null } }): string | Response {
  const userId = context.locals.user?.id;

  if (!userId) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 401,
      message: "Unauthorized",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return userId;
}
