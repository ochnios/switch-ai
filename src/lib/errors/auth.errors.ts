/**
 * Custom error classes for authentication-related errors
 * These errors are thrown by the auth service and handled by API endpoints
 */

/**
 * Base authentication error class
 * All auth-specific errors extend this class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Thrown when authentication credentials are invalid
 * HTTP Status: 401 Unauthorized
 */
export class AuthenticationError extends AuthError {
  constructor(message: string = "Invalid email or password") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Thrown when user registration fails
 * HTTP Status: 409 Conflict (email exists) or 400 Bad Request
 */
export class RegistrationError extends AuthError {
  constructor(message: string = "Registration failed", statusCode: number = 400) {
    super(message, statusCode);
    this.name = "RegistrationError";
  }
}

/**
 * Thrown when input validation fails
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends AuthError {
  constructor(
    message: string = "Validation failed",
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/**
 * Thrown when authentication token is invalid or expired
 * HTTP Status: 400 Bad Request or 401 Unauthorized
 */
export class TokenError extends AuthError {
  constructor(message: string = "Invalid or expired token", statusCode: number = 400) {
    super(message, statusCode);
    this.name = "TokenError";
  }
}

/**
 * Maps Supabase auth errors to application-specific error types
 * @param error - Error from Supabase auth operation
 * @returns Mapped application error
 */
export function mapSupabaseAuthError(error: unknown): AuthError {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    // Check for specific Supabase error patterns
    if (message.includes("Invalid login credentials") || message.includes("Email not confirmed")) {
      return new AuthenticationError("Invalid email or password");
    }

    if (message.includes("User already registered")) {
      return new RegistrationError("An account with this email already exists", 409);
    }

    if (message.includes("Password should be at least")) {
      return new ValidationError("Password must be at least 8 characters long");
    }

    if (message.includes("Invalid token") || message.includes("Token has expired")) {
      return new TokenError("Password reset link is invalid or has expired");
    }

    // Generic auth error
    return new AuthError(message);
  }

  // Unknown error
  return new AuthError("An unexpected error occurred");
}
