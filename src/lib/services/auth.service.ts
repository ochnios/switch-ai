import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { AuthUser } from "@/types";
import { AuthenticationError, mapSupabaseAuthError } from "@/lib/errors/auth.errors";
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

      return {
        id: data.user.id,
        email: data.user.email!,
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
   * @throws {AuthError} If there's an error retrieving user data
   */
  async getUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        // For getUser, we don't throw on "not authenticated" - just return null
        this.logger.error(error instanceof Error ? error : new Error(String(error)), {
          operation: "getUser",
        });
        return null;
      }

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
      };
    } catch (error) {
      this.logger.error(error instanceof Error ? error : new Error(String(error)), {
        operation: "getUser",
      });
      return null;
    }
  }

  /**
   * Registers a new user with email and password
   * Note: This will be implemented in Phase 2
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

      return {
        id: data.user.id,
        email: data.user.email!,
      };
    } catch (error) {
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
