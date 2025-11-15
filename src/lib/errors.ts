/**
 * Custom error classes for the application
 * Allows for better error handling using instanceof checks
 */

/**
 * Base error for OpenRouter service related issues
 * This includes API key problems, encryption/decryption failures, and AI model errors
 */
export class OpenRouterError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "OpenRouterError";
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenRouterError);
    }
  }
}

/**
 * Error thrown when user's API key is not found in the database
 */
export class ApiKeyNotFoundError extends OpenRouterError {
  constructor(message = "API key not found") {
    super(message);
    this.name = "ApiKeyNotFoundError";
  }
}

/**
 * Error thrown when API key decryption fails
 */
export class ApiKeyDecryptionError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "ApiKeyDecryptionError";
  }
}

/**
 * Error thrown when API key encryption fails
 */
export class ApiKeyEncryptionError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "ApiKeyEncryptionError";
  }
}

/**
 * Error thrown when OpenRouter API key is invalid or expired (401/403)
 */
export class OpenRouterUnauthorizedError extends OpenRouterError {
  constructor(message = "Invalid or expired OpenRouter API key", cause?: Error) {
    super(message, cause);
    this.name = "OpenRouterUnauthorizedError";
  }
}

/**
 * Error thrown when OpenRouter rate limit is exceeded (429)
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message = "OpenRouter rate limit exceeded. Please try again later.", cause?: Error) {
    super(message, cause);
    this.name = "OpenRouterRateLimitError";
  }
}

/**
 * Error thrown when OpenRouter server error occurs (5xx)
 */
export class OpenRouterServerError extends OpenRouterError {
  constructor(message = "OpenRouter server error. Please try again later.", cause?: Error) {
    super(message, cause);
    this.name = "OpenRouterServerError";
  }
}

/**
 * Error thrown when OpenRouter upstream provider is overloaded (529)
 */
export class OpenRouterProviderOverloadedError extends OpenRouterError {
  constructor(
    message = "AI model provider is currently overloaded. Please try again or switch models.",
    cause?: Error
  ) {
    super(message, cause);
    this.name = "OpenRouterProviderOverloadedError";
  }
}

/**
 * Error thrown when request validation fails (400)
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message = "Invalid request parameters", cause?: Error) {
    super(message, cause);
    this.name = "OpenRouterValidationError";
  }
}

/**
 * Error thrown when network/timeout errors occur
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message = "Network error while communicating with OpenRouter", cause?: Error) {
    super(message, cause);
    this.name = "OpenRouterNetworkError";
  }
}
