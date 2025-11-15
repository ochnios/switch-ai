import type { ErrorResponseDto } from "../../types";
import {
  ApiKeyNotFoundError,
  OpenRouterNetworkError,
  OpenRouterProviderOverloadedError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterUnauthorizedError,
  OpenRouterValidationError,
} from "../errors";
import { Logger } from "../logger";

/**
 * Maps domain errors to HTTP error responses
 * Provides consistent error handling across API routes
 *
 * @param error - The error to map
 * @param logger - Logger instance for error logging
 * @param context - Optional context for logging
 * @returns Response object with appropriate status code and error message
 */
export function handleApiError(error: unknown, logger: Logger, context?: Record<string, unknown>): Response {
  // Handle API key not found error (404)
  if (error instanceof ApiKeyNotFoundError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 404,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle unauthorized/invalid API key errors (401)
  if (error instanceof OpenRouterUnauthorizedError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 401,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle validation errors (400)
  if (error instanceof OpenRouterValidationError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 400,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle rate limit errors (429)
  if (error instanceof OpenRouterRateLimitError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 429,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle provider overloaded errors (503)
  if (error instanceof OpenRouterProviderOverloadedError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 503,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle network errors (503)
  if (error instanceof OpenRouterNetworkError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 503,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle OpenRouter server errors (502)
  if (error instanceof OpenRouterServerError) {
    const errorResponse: ErrorResponseDto = {
      statusCode: 502,
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle unexpected errors (500)
  logger.error(error instanceof Error ? error : new Error(String(error)), context);
  const errorResponse: ErrorResponseDto = {
    statusCode: 500,
    message: "Internal server error",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
