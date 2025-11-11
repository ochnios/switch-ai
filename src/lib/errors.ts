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

