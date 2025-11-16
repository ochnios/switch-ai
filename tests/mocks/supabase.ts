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
 * Configuration for creating a flexible auth mock
 */
export interface MockAuthConfig {
  /**
   * Mock functions for auth operations
   * If not provided, default mocks will be created
   */
  mocks?: {
    getUser?: ReturnType<typeof vi.fn>;
    signInWithPassword?: ReturnType<typeof vi.fn>;
    signUp?: ReturnType<typeof vi.fn>;
    signOut?: ReturnType<typeof vi.fn>;
    resetPasswordForEmail?: ReturnType<typeof vi.fn>;
    exchangeCodeForSession?: ReturnType<typeof vi.fn>;
    updateUser?: ReturnType<typeof vi.fn>;
  };
}

/**
 * Result of creating a flexible auth mock
 * Includes the client and access to mock functions for assertions
 */
export interface FlexibleMockAuthResult {
  client: Partial<SupabaseClient>;
  mocks: {
    getUser: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    resetPasswordForEmail: ReturnType<typeof vi.fn>;
    exchangeCodeForSession: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
}

/**
 * Creates a flexible mock Supabase client with customizable auth methods
 * Useful for testing AuthService with full control over auth method behavior
 */
export const createFlexibleMockAuthClient = (config: MockAuthConfig = {}): FlexibleMockAuthResult => {
  const { mocks = {} } = config;

  // Create default mocks if not provided
  const mockGetUser =
    mocks.getUser ||
    vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

  const mockSignInWithPassword =
    mocks.signInWithPassword ||
    vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

  const mockSignUp =
    mocks.signUp ||
    vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

  const mockSignOut =
    mocks.signOut ||
    vi.fn().mockResolvedValue({
      error: null,
    });

  const mockResetPasswordForEmail =
    mocks.resetPasswordForEmail ||
    vi.fn().mockResolvedValue({
      error: null,
    });

  const mockExchangeCodeForSession =
    mocks.exchangeCodeForSession ||
    vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });

  const mockUpdateUser =
    mocks.updateUser ||
    vi.fn().mockResolvedValue({
      error: null,
    });

  const client = {
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      exchangeCodeForSession: mockExchangeCodeForSession,
      updateUser: mockUpdateUser,
    },
  } as unknown as Partial<SupabaseClient>;

  return {
    client,
    mocks: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      exchangeCodeForSession: mockExchangeCodeForSession,
      updateUser: mockUpdateUser,
    },
  };
};

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
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
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

/**
 * Configuration for creating a flexible Supabase mock with complex query chains
 * This is useful for testing services that use complex query builder patterns
 */
export interface MockSupabaseConfig {
  /**
   * Mock functions for query operations
   * These will be returned from the query builder chain
   */
  mocks?: {
    countEq?: ReturnType<typeof vi.fn>;
    dataEq?: ReturnType<typeof vi.fn>;
    dataSecondEq?: ReturnType<typeof vi.fn>; // For double eq chains (e.g., select().eq().eq().maybeSingle())
    dataMaybeSingle?: ReturnType<typeof vi.fn>; // For maybeSingle() method
    dataNeq?: ReturnType<typeof vi.fn>;
    dataOrder?: ReturnType<typeof vi.fn>;
    dataRange?: ReturnType<typeof vi.fn>;
    insertSelect?: ReturnType<typeof vi.fn>;
    insertSingle?: ReturnType<typeof vi.fn>;
    upsert?: ReturnType<typeof vi.fn>; // For upsert() operations
    deleteFirstEq?: ReturnType<typeof vi.fn>; // For delete().eq().eq() pattern
    deleteSecondEq?: ReturnType<typeof vi.fn>; // Second eq in delete chain
  };
  /**
   * Table name to match in the from() call
   */
  tableName?: string;
}

/**
 * Result of creating a flexible mock Supabase client
 * Includes the client and access to mock functions for assertions
 */
export interface FlexibleMockSupabaseResult {
  client: Partial<SupabaseClient>;
  mocks: {
    insert: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    countEq: ReturnType<typeof vi.fn>;
    dataEq: ReturnType<typeof vi.fn>;
    dataSecondEq: ReturnType<typeof vi.fn>;
    dataMaybeSingle: ReturnType<typeof vi.fn>;
    dataNeq: ReturnType<typeof vi.fn>;
    dataOrder: ReturnType<typeof vi.fn>;
    dataRange: ReturnType<typeof vi.fn>;
    insertSingle: ReturnType<typeof vi.fn>;
    deleteFirstEq: ReturnType<typeof vi.fn>;
    deleteSecondEq: ReturnType<typeof vi.fn>;
  };
}

/**
 * Creates a flexible mock Supabase client that supports complex query builder chains
 * Useful for testing services like MessageService and ConversationService
 */
export const createFlexibleMockSupabaseClient = (config: MockSupabaseConfig = {}): FlexibleMockSupabaseResult => {
  const { mocks = {}, tableName = "messages" } = config;

  // Create default mocks if not provided
  const mockCountEq = mocks.countEq || vi.fn();
  const mockDataRange = mocks.dataRange || vi.fn();
  const mockDataOrder = mocks.dataOrder || vi.fn().mockReturnValue({ range: mockDataRange });
  const mockDataNeq = mocks.dataNeq || vi.fn().mockReturnValue({ order: mockDataOrder });

  // Support for double eq chains (e.g., select().eq().eq().maybeSingle())
  const mockDataMaybeSingle = mocks.dataMaybeSingle || vi.fn();
  const mockDataSecondEq = mocks.dataSecondEq || vi.fn().mockReturnValue({ maybeSingle: mockDataMaybeSingle });
  const mockDataEq =
    mocks.dataEq ||
    vi.fn().mockReturnValue({
      neq: mockDataNeq,
      order: mockDataOrder,
      eq: mockDataSecondEq, // Support chaining another eq()
    });
  const mockInsertSingle = mocks.insertSingle || vi.fn();
  const mockInsertSelect = mocks.insertSelect || vi.fn().mockReturnValue({ single: mockInsertSingle });
  const mockInsert = vi.fn().mockReturnValue({
    select: mockInsertSelect,
  });

  // Support for upsert operations
  const mockUpsert = mocks.upsert || vi.fn().mockResolvedValue({ error: null });

  // Support for delete operations (delete().eq().eq())
  const mockDeleteSecondEq = mocks.deleteSecondEq || vi.fn();
  const mockDeleteFirstEq = mocks.deleteFirstEq || vi.fn().mockReturnValue({ eq: mockDeleteSecondEq });
  const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteFirstEq });

  // Create query builder objects
  const mockCountSelect = {
    eq: mockCountEq,
  };

  const mockDataSelect = {
    eq: mockDataEq,
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === tableName) {
        return {
          select: (fields: string, options?: { count?: string; head?: boolean }) => {
            if (options?.head) {
              return mockCountSelect;
            }
            return mockDataSelect;
          },
          insert: mockInsert,
          upsert: mockUpsert,
          delete: mockDelete,
        };
      }
      return {};
    }),
  } as unknown as Partial<SupabaseClient>;

  return {
    client,
    mocks: {
      insert: mockInsert,
      upsert: mockUpsert,
      delete: mockDelete,
      countEq: mockCountEq,
      dataEq: mockDataEq,
      dataSecondEq: mockDataSecondEq,
      dataMaybeSingle: mockDataMaybeSingle,
      dataNeq: mockDataNeq,
      dataOrder: mockDataOrder,
      dataRange: mockDataRange,
      insertSingle: mockInsertSingle,
      deleteFirstEq: mockDeleteFirstEq,
      deleteSecondEq: mockDeleteSecondEq,
    },
  };
};
