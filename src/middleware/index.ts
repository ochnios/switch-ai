import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";
import { createAuthService } from "../lib/services/auth.service";

/**
 * Public routes that don't require authentication
 * These routes are accessible to everyone
 */
// const PUBLIC_ROUTES = ["/"];

/**
 * Auth-only routes that should redirect authenticated users
 * These routes are for login, registration, password reset, etc.
 */
const AUTH_ONLY_ROUTES = ["/auth/login", "/auth/register", "/auth/reset-password", "/auth/update-password"];

/**
 * Protected routes that require authentication
 * Pattern matching for routes under /app/*
 */
const isProtectedRoute = (pathname: string): boolean => {
  return pathname.startsWith("/app");
};

/**
 * API routes that don't require authentication
 * All other API routes are protected by default
 */
const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/register", "/api/auth/session"];

/**
 * Middleware for authentication and route protection
 *
 * Responsibilities:
 * 1. Create Supabase SSR client with cookie handling
 * 2. Retrieve authenticated user and add to context.locals
 * 3. Protect routes based on authentication status
 * 4. Redirect authenticated users from auth-only pages
 * 5. Redirect unauthenticated users from protected routes
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client with SSR support
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Add Supabase client to context for use in endpoints
  locals.supabase = supabase;

  // Get authenticated user
  const authService = createAuthService(supabase);
  const user = await authService.getUser();
  locals.user = user;

  const pathname = url.pathname;

  // Allow public API routes without authentication
  if (PUBLIC_API_ROUTES.some((route) => pathname === route)) {
    return next();
  }

  // Protect API routes (except auth endpoints)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    if (!user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Redirect authenticated users from auth-only routes to /app/new
  if (AUTH_ONLY_ROUTES.some((route) => pathname === route)) {
    if (user) {
      return redirect("/app/new", 302);
    }
  }

  // Redirect authenticated users from landing page to /app/new
  if (pathname === "/" && user) {
    return redirect("/app/new", 302);
  }

  // Protect /app/* routes - redirect to login with redirect parameter
  if (isProtectedRoute(pathname)) {
    if (!user) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      return redirect(redirectUrl, 302);
    }
  }

  // Continue to the requested route
  return next();
});
