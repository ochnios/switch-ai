import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiKeyService } from "@/lib/services/api-key.service";
import { ApiKeyEncryptionError, ApiKeyDecryptionError, ApiKeyNotFoundError } from "@/lib/errors";
import type { SupabaseClient } from "@/db/supabase.client";
import * as crypto from "@/lib/crypto";
import { createFlexibleMockSupabaseClient } from "../../mocks/supabase";

// Mock crypto module
vi.mock("@/lib/crypto", () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));

describe("UT-APIKEY-01: Upsert API Key", () => {
  let supabase: Partial<SupabaseClient>;
  let service: ApiKeyService;
  let mockUpsert: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-chars-long!");
    vi.mocked(crypto.encrypt).mockReturnValue("encrypted-key");

    mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockResult = createFlexibleMockSupabaseClient({
      tableName: "api_keys",
      mocks: {
        upsert: mockUpsert,
      },
    });
    supabase = mockResult.client;

    service = new ApiKeyService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("1.1: Successfully encrypts and stores API key for user", async () => {
    const userId = "user-123";
    const apiKey = "sk-or-v1-test-key";

    await service.upsertApiKey(userId, apiKey);

    expect(crypto.encrypt).toHaveBeenCalledWith(apiKey);
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: userId,
        encrypted_key: "encrypted-key",
        created_at: expect.any(String),
      },
      {
        onConflict: "user_id",
      }
    );
  });

  it("1.2: Updates existing API key when user already has one", async () => {
    const userId = "user-123";
    const apiKey = "sk-or-v1-test-key";

    await service.upsertApiKey(userId, apiKey);

    // Should use upsert with onConflict, so it updates if exists
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        encrypted_key: "encrypted-key",
      }),
      { onConflict: "user_id" }
    );
  });

  it("1.3: Throws ApiKeyEncryptionError when encryption fails", async () => {
    const userId = "user-123";
    const apiKey = "sk-or-v1-test-key";

    vi.mocked(crypto.encrypt).mockImplementation(() => {
      throw new Error("Encryption failed: test error");
    });

    await expect(service.upsertApiKey(userId, apiKey)).rejects.toThrow(ApiKeyEncryptionError);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("1.4: Throws error when Supabase upsert operation fails", async () => {
    const userId = "user-123";
    const apiKey = "sk-or-v1-test-key";

    mockUpsert.mockResolvedValue({ error: { message: "Database error", code: "23505" } });

    await expect(service.upsertApiKey(userId, apiKey)).rejects.toThrow("Failed to save API key");
  });

  it("1.5: Handles empty or invalid API key strings", async () => {
    const userId = "user-123";

    // Empty string
    await expect(service.upsertApiKey(userId, "")).resolves.not.toThrow();

    // Very long string
    const longKey = "sk-or-v1-" + "x".repeat(1000);
    await expect(service.upsertApiKey(userId, longKey)).resolves.not.toThrow();
  });
});

describe("UT-APIKEY-02: Check API Key Exists", () => {
  let supabase: Partial<SupabaseClient>;
  let service: ApiKeyService;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let mockDataEq: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMaybeSingle = vi.fn();
    mockDataEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });

    const mockResult = createFlexibleMockSupabaseClient({
      tableName: "api_keys",
      mocks: {
        dataEq: mockDataEq,
        dataMaybeSingle: mockMaybeSingle,
      },
    });
    supabase = mockResult.client;

    service = new ApiKeyService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("2.1: Returns true when API key exists for user", async () => {
    const userId = "user-123";
    mockMaybeSingle.mockResolvedValue({ data: { id: "key-123" }, error: null });

    const result = await service.checkApiKeyExists(userId);

    expect(result).toBe(true);
    expect(mockDataEq).toHaveBeenCalledWith("user_id", userId);
  });

  it("2.2: Returns false when API key does not exist for user", async () => {
    const userId = "user-123";
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await service.checkApiKeyExists(userId);

    expect(result).toBe(false);
  });

  it("2.3: Throws error when database query fails", async () => {
    const userId = "user-123";
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error", code: "PGRST116" },
    });

    await expect(service.checkApiKeyExists(userId)).rejects.toThrow("Failed to check API key existence");
  });
});

describe("UT-APIKEY-03: Delete API Key", () => {
  let supabase: Partial<SupabaseClient>;
  let service: ApiKeyService;
  let mockDeleteFirstEq: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDeleteFirstEq = vi.fn().mockResolvedValue({ error: null });

    const mockResult = createFlexibleMockSupabaseClient({
      tableName: "api_keys",
      mocks: {
        deleteFirstEq: mockDeleteFirstEq,
      },
    });
    supabase = mockResult.client;

    service = new ApiKeyService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("3.1: Successfully deletes API key for user", async () => {
    const userId = "user-123";

    await service.deleteApiKey(userId);

    expect(mockDeleteFirstEq).toHaveBeenCalledWith("user_id", userId);
  });

  it("3.2: Does not throw error when deleting non-existent key (idempotent)", async () => {
    const userId = "user-123";
    // Supabase delete with no rows affected doesn't error
    mockDeleteFirstEq.mockResolvedValue({ error: null });

    await expect(service.deleteApiKey(userId)).resolves.not.toThrow();
  });

  it("3.3: Throws error when database delete operation fails", async () => {
    const userId = "user-123";
    mockDeleteFirstEq.mockResolvedValue({ error: { message: "Database error", code: "PGRST116" } });

    await expect(service.deleteApiKey(userId)).rejects.toThrow("Failed to delete API key");
  });
});

describe("UT-APIKEY-04: Get API Key", () => {
  let supabase: Partial<SupabaseClient>;
  let service: ApiKeyService;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let mockDataEq: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-chars-long!");
    vi.mocked(crypto.decrypt).mockReturnValue("decrypted-key");

    mockMaybeSingle = vi.fn();
    mockDataEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });

    const mockResult = createFlexibleMockSupabaseClient({
      tableName: "api_keys",
      mocks: {
        dataEq: mockDataEq,
        dataMaybeSingle: mockMaybeSingle,
      },
    });
    supabase = mockResult.client;

    service = new ApiKeyService(supabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("4.1: Successfully retrieves and decrypts API key for user", async () => {
    const userId = "user-123";
    const encryptedKey = "encrypted-key-data";
    mockMaybeSingle.mockResolvedValue({
      data: { encrypted_key: encryptedKey },
      error: null,
    });

    const result = await service.getApiKey(userId);

    expect(result).toBe("decrypted-key");
    expect(mockDataEq).toHaveBeenCalledWith("user_id", userId);
    expect(crypto.decrypt).toHaveBeenCalledWith(encryptedKey);
  });

  it("4.2: Throws ApiKeyNotFoundError when API key does not exist", async () => {
    const userId = "user-123";
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(service.getApiKey(userId)).rejects.toThrow(ApiKeyNotFoundError);
    expect(crypto.decrypt).not.toHaveBeenCalled();
  });

  it("4.3: Throws ApiKeyDecryptionError when decryption fails", async () => {
    const userId = "user-123";
    const encryptedKey = "encrypted-key-data";
    mockMaybeSingle.mockResolvedValue({
      data: { encrypted_key: encryptedKey },
      error: null,
    });

    vi.mocked(crypto.decrypt).mockImplementation(() => {
      throw new Error("Decryption failed: test error");
    });

    await expect(service.getApiKey(userId)).rejects.toThrow(ApiKeyDecryptionError);
  });

  it("4.4: Throws error when database query fails", async () => {
    const userId = "user-123";
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error", code: "PGRST116" },
    });

    await expect(service.getApiKey(userId)).rejects.toThrow("Failed to fetch API key");
    expect(crypto.decrypt).not.toHaveBeenCalled();
  });
});
