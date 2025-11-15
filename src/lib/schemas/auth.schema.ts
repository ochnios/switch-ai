import { z } from "zod";

/**
 * Zod validation schemas for authentication endpoints
 */

/**
 * Schema for user login
 * Used by POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for user registration
 * Used by POST /api/auth/register
 */
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Schema for password reset request
 * Used by POST /api/auth/reset-password
 */
export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Schema for password update
 * Used by POST /api/auth/update-password
 */
export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  token: z.string().min(1, "Recovery token is required"),
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
