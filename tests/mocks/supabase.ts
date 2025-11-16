import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mock query builder for Supabase operations
 */
interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Supabase client for testing
 */
export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(
      (): MockQueryBuilder => ({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
        limit: mockLimit,
      })
    ),
  } as unknown as Partial<SupabaseClient>;
};

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  aud: "authenticated",
  role: "authenticated",
};

/**
 * Mock session data for testing
 */
export const mockSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Date.now() + 3600000,
  user: mockUser,
};

/**
 * Mock conversation data for testing
 */
export const mockConversation = {
  id: "test-conversation-id",
  user_id: "test-user-id",
  title: "Test Conversation",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

/**
 * Mock message data for testing
 */
export const mockMessage = {
  id: "test-message-id",
  conversation_id: "test-conversation-id",
  role: "user" as const,
  content: "Test message content",
  model_id: "gpt-4o-mini",
  token_count: 10,
  created_at: "2024-01-01T00:00:00.000Z",
};
