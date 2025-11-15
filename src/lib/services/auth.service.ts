import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { AuthUser } from "@/types";
import { AuthenticationError, mapSupabaseAuthError, TokenError } from "@/lib/errors/auth.errors";
import { Logger } from "@/lib/logger";

/**
 * Authentication service for managing user authentication
 * Wraps Supabase Auth with application-specific error handling and types
 */
export class AuthService {
  private logger = new Logger("AuthService");

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Authenticates a user with email and password
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Authenticated user information
   * @throws {AuthenticationError} When credentials are invalid
   * @throws {AuthError} For other authentication errors
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw mapSupabaseAuthError(error);
      }

      if (!data.user) {
        throw new AuthenticationError();
      }

      if (!data.user.email) {
        throw new AuthenticationError("User email is missing");
      }

      return {
        id: data.user.id,
        email: data.user.email,
      };
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof Error && error.name.includes("Error")) {
        throw error;
      }

      // Otherwise, map it
      throw mapSupabaseAuthError(error);
    }
  }

  /**
   * Signs out the current user
   *
   * @throws {AuthError} If sign out fails
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw mapSupabaseAuthError(error);
      }
    } catch (error) {
      throw mapSupabaseAuthError(error);
    }
  }

  /**
   * Retrieves the currently authenticated user
   *
   * @returns User information or null if not authenticated
   */
  async getUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        // For getUser, we don't throw on "not authenticated" - just return null
        return null;
      }

      if (!user) {
        return null;
      }

      if (!user.email) {
        // If user exists but has no email, log and return null
        this.logger.warn("User exists but email is missing", {
          operation: "getUser",
          userId: user.id,
        });
        return null;
      }

      return {
        id: user.id,
        email: user.email,
      };
    } catch {
      // For getUser, we don't throw on errors - just return null
      // Errors are expected when user is not authenticated
      return null;
    }
  }

  /**
   * Registers a new user with email and password
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Created user information
   * @throws {RegistrationError} When registration fails
   */
  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Email confirmation disabled for MVP
        },
      });

      if (error) {
        throw mapSupabaseAuthError(error);
      }

      if (!data.user) {
        throw new Error("User registration failed");
      }

      if (!data.user.email) {
        throw new Error("User registration failed: email is missing");
      }

      return {
        id: data.user.id,
        email: data.user.email,
      };
    } catch (error) {
      throw mapSupabaseAuthError(error);
    }
  }

  /**
   * Sends a password reset email to the user
   *
   * @param email - User's email address
   * @throws {AuthError} If reset password request fails
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const siteUrl = import.meta.env.SITE_URL || "http://localhost:3000";
      const redirectTo = `${siteUrl}/auth/update-password`;

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        throw mapSupabaseAuthError(error);
      }
    } catch (error) {
      throw mapSupabaseAuthError(error);
    }
  }

  /**
   * Updates the user's password using a recovery token
   *
   * @param password - New password
   * @param token - Password recovery token from email link
   * @throws {TokenError} If token is invalid or expired
   * @throws {AuthError} If password update fails
   */
  async updatePassword(password: string, token: string): Promise<void> {
    try {
      // Exchange the recovery token for a session
      const { data: sessionData, error: sessionError } = await this.supabase.auth.exchangeCodeForSession(token);

      if (sessionError || !sessionData.session) {
        throw new TokenError("Password reset link is invalid or has expired");
      }

      // Update password using the authenticated session
      const { error: updateError } = await this.supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw mapSupabaseAuthError(updateError);
      }
    } catch (error) {
      if (error instanceof TokenError) {
        throw error;
      }
      throw mapSupabaseAuthError(error);
    }
  }
}

/**
 * Factory function to create an AuthService instance
 * @param supabase - Supabase client instance
 * @returns New AuthService instance
 */
export function createAuthService(supabase: SupabaseClient<Database>): AuthService {
  return new AuthService(supabase);
}
