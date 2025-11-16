import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthService } from "@/lib/services/auth.service";
import { AuthenticationError, RegistrationError, TokenError } from "@/lib/errors/auth.errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { createFlexibleMockAuthClient } from "../../mocks/supabase";

describe("UT-AUTH-01: Sign In", () => {
  let supabase: Partial<SupabaseClient<Database>>;
  let service: AuthService;
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignIn = vi.fn();
    const mockResult = createFlexibleMockAuthClient({
      mocks: {
        signInWithPassword: mockSignIn,
      },
    });
    supabase = mockResult.client as Partial<SupabaseClient<Database>>;

    service = new AuthService(supabase as SupabaseClient<Database>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("1.1: Successfully authenticates user with valid credentials", async () => {
    const email = "test@example.com";
    const password = "password123";
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      aud: "authenticated",
      role: "authenticated",
    };

    mockSignIn.mockResolvedValue({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    const result = await service.signIn(email, password);

    expect(result).toEqual({
      id: "user-123",
      email: "test@example.com",
    });
    expect(mockSignIn).toHaveBeenCalledWith({ email, password });
  });

  it("1.2: Returns AuthUser object with correct id and email", async () => {
    const email = "test@example.com";
    const password = "password123";
    const mockUser = {
      id: "user-456",
      email: "test2@example.com",
      aud: "authenticated",
      role: "authenticated",
    };

    mockSignIn.mockResolvedValue({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    const result = await service.signIn(email, password);

    expect(result.id).toBe("user-456");
    expect(result.email).toBe("test2@example.com");
  });

  it("1.3: Throws AuthenticationError when credentials are invalid", async () => {
    const email = "test@example.com";
    const password = "wrong-password";

    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(service.signIn(email, password)).rejects.toThrow(AuthenticationError);
  });

  it("1.4: Throws AuthenticationError when user email is missing", async () => {
    const email = "test@example.com";
    const password = "password123";
    const mockUser = {
      id: "user-123",
      email: null,
      aud: "authenticated",
      role: "authenticated",
    };

    mockSignIn.mockResolvedValue({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    await expect(service.signIn(email, password)).rejects.toThrow(AuthenticationError);
  });

  it("1.5: Throws AuthenticationError when user object is null", async () => {
    const email = "test@example.com";
    const password = "password123";

    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    await expect(service.signIn(email, password)).rejects.toThrow(AuthenticationError);
  });

  it("1.6: Maps Supabase auth errors correctly using mapSupabaseAuthError", async () => {
    const email = "test@example.com";
    const password = "password123";

    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email not confirmed" },
    });

    await expect(service.signIn(email, password)).rejects.toThrow(AuthenticationError);
  });
});

describe("UT-AUTH-02: Sign Out", () => {
  let supabase: Partial<SupabaseClient<Database>>;
  let service: AuthService;
  let mockSignOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignOut = vi.fn();
    const mockResult = createFlexibleMockAuthClient({
      mocks: {
        signOut: mockSignOut,
      },
    });
    supabase = mockResult.client as Partial<SupabaseClient<Database>>;

    service = new AuthService(supabase as SupabaseClient<Database>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("2.1: Successfully signs out authenticated user", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    await service.signOut();

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("2.2: Throws AuthError when sign out fails", async () => {
    mockSignOut.mockResolvedValue({
      error: { message: "Sign out failed" },
    });

    await expect(service.signOut()).rejects.toThrow();
  });

  it("2.3: Maps Supabase errors correctly", async () => {
    mockSignOut.mockResolvedValue({
      error: { message: "Network error" },
    });

    await expect(service.signOut()).rejects.toThrow();
  });
});

describe("UT-AUTH-03: Get User", () => {
  let supabase: Partial<SupabaseClient<Database>>;
  let service: AuthService;
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUser = vi.fn();
    const mockResult = createFlexibleMockAuthClient({
      mocks: {
        getUser: mockGetUser,
      },
    });
    supabase = mockResult.client as Partial<SupabaseClient<Database>>;

    service = new AuthService(supabase as SupabaseClient<Database>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("3.1: Returns AuthUser when user is authenticated", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      aud: "authenticated",
      role: "authenticated",
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const result = await service.getUser();

    expect(result).toEqual({
      id: "user-123",
      email: "test@example.com",
    });
  });

  it("3.2: Returns null when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const result = await service.getUser();

    expect(result).toBeNull();
  });

  it("3.3: Returns null when user exists but email is missing (logs warning)", async () => {
    const mockUser = {
      id: "user-123",
      email: null,
      aud: "authenticated",
      role: "authenticated",
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const result = await service.getUser();

    expect(result).toBeNull();
  });

  it("3.4: Returns null on any error (does not throw)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Some error" },
    });

    const result = await service.getUser();

    expect(result).toBeNull();
  });
});

describe("UT-AUTH-04: Sign Up", () => {
  let supabase: Partial<SupabaseClient<Database>>;
  let service: AuthService;
  let mockSignUp: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignUp = vi.fn();
    const mockResult = createFlexibleMockAuthClient({
      mocks: {
        signUp: mockSignUp,
      },
    });
    supabase = mockResult.client as Partial<SupabaseClient<Database>>;

    service = new AuthService(supabase as SupabaseClient<Database>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("4.1: Successfully registers new user with valid email and password", async () => {
    const email = "newuser@example.com";
    const password = "password123";
    const mockUser = {
      id: "user-123",
      email: "newuser@example.com",
      aud: "authenticated",
      role: "authenticated",
    };

    mockSignUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    const result = await service.signUp(email, password);

    expect(result).toEqual({
      id: "user-123",
      email: "newuser@example.com",
    });
    expect(mockSignUp).toHaveBeenCalledWith({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });
  });

  it("4.2: Returns AuthUser object with correct id and email", async () => {
    const email = "test@example.com";
    const password = "password123";
    const mockUser = {
      id: "user-456",
      email: "test@example.com",
      aud: "authenticated",
      role: "authenticated",
    };

    mockSignUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    const result = await service.signUp(email, password);

    expect(result.id).toBe("user-456");
    expect(result.email).toBe("test@example.com");
  });

  it("4.3: Throws RegistrationError when email already exists (409)", async () => {
    const email = "existing@example.com";
    const password = "password123";

    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    await expect(service.signUp(email, password)).rejects.toThrow(RegistrationError);
  });

  it("4.4: Throws RegistrationError when registration fails", async () => {
    const email = "test@example.com";
    const password = "password123";

    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Registration failed" },
    });

    await expect(service.signUp(email, password)).rejects.toThrow();
  });

  it("4.5: Throws error when user object is null after registration", async () => {
    const email = "test@example.com";
    const password = "password123";

    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    await expect(service.signUp(email, password)).rejects.toThrow("User registration failed");
  });

  it("4.6: Throws error when user email is missing after registration", async () => {
    const email = "test@example.com";
    const password = "password123";
    const mockUser = {
      id: "user-123",
      email: null,
      aud: "authenticated",
      role: "authenticated",
    };

    mockSignUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    await expect(service.signUp(email, password)).rejects.toThrow("email is missing");
  });
});

describe("UT-AUTH-05: Reset Password", () => {
  let supabase: Partial<SupabaseClient<Database>>;
  let service: AuthService;
  let mockResetPassword: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("SITE_URL", "https://example.com");
    mockResetPassword = vi.fn();
    const mockResult = createFlexibleMockAuthClient({
      mocks: {
        resetPasswordForEmail: mockResetPassword,
      },
    });
    supabase = mockResult.client as Partial<SupabaseClient<Database>>;

    service = new AuthService(supabase as SupabaseClient<Database>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("5.1: Successfully sends password reset email", async () => {
    const email = "test@example.com";

    mockResetPassword.mockResolvedValue({ error: null });

    await service.resetPassword(email);

    expect(mockResetPassword).toHaveBeenCalledWith(email, {
      redirectTo: "https://example.com/auth/update-password",
    });
  });

  it("5.2: Uses correct redirect URL from environment or default", async () => {
    const email = "test@example.com";

    // Test with environment variable
    vi.stubEnv("SITE_URL", "https://custom.com");
    mockResetPassword.mockResolvedValue({ error: null });

    await service.resetPassword(email);

    expect(mockResetPassword).toHaveBeenCalledWith(email, {
      redirectTo: "https://custom.com/auth/update-password",
    });

    // Test with default
    vi.unstubAllEnvs();
    const service2 = new AuthService(supabase as SupabaseClient<Database>);
    await service2.resetPassword(email);

    expect(mockResetPassword).toHaveBeenCalledWith(email, {
      redirectTo: "http://localhost:3000/auth/update-password",
    });
  });

  it("5.3: Throws AuthError when reset password request fails", async () => {
    const email = "test@example.com";

    mockResetPassword.mockResolvedValue({
      error: { message: "Reset password failed" },
    });

    await expect(service.resetPassword(email)).rejects.toThrow();
  });

  it("5.4: Maps Supabase errors correctly", async () => {
    const email = "test@example.com";

    mockResetPassword.mockResolvedValue({
      error: { message: "User not found" },
    });

    await expect(service.resetPassword(email)).rejects.toThrow();
  });
});

describe("UT-AUTH-06: Update Password", () => {
  let supabase: Partial<SupabaseClient<Database>>;
  let service: AuthService;
  let mockExchangeCode: ReturnType<typeof vi.fn>;
  let mockUpdateUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExchangeCode = vi.fn();
    mockUpdateUser = vi.fn();
    const mockResult = createFlexibleMockAuthClient({
      mocks: {
        exchangeCodeForSession: mockExchangeCode,
        updateUser: mockUpdateUser,
      },
    });
    supabase = mockResult.client as Partial<SupabaseClient<Database>>;

    service = new AuthService(supabase as SupabaseClient<Database>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("6.1: Successfully updates password with valid token", async () => {
    const password = "newpassword123";
    const token = "valid-token";

    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });

    await service.updatePassword(password, token);

    expect(mockExchangeCode).toHaveBeenCalledWith(token);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password });
  });

  it("6.2: Throws TokenError when token is invalid or expired", async () => {
    const password = "newpassword123";
    const token = "invalid-token";

    mockExchangeCode.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid token" },
    });

    await expect(service.updatePassword(password, token)).rejects.toThrow(TokenError);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("6.3: Throws TokenError when exchangeCodeForSession fails", async () => {
    const password = "newpassword123";
    const token = "expired-token";

    mockExchangeCode.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(service.updatePassword(password, token)).rejects.toThrow(TokenError);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("6.4: Throws AuthError when password update fails", async () => {
    const password = "newpassword123";
    const token = "valid-token";

    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password update failed" },
    });

    await expect(service.updatePassword(password, token)).rejects.toThrow();
  });

  it("6.5: Maps Supabase errors correctly", async () => {
    const password = "newpassword123";
    const token = "valid-token";

    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password should be at least 8 characters" },
    });

    await expect(service.updatePassword(password, token)).rejects.toThrow();
  });
});
