import type { SupabaseClient } from "../../db/supabase.client";
import { encrypt, decrypt } from "../crypto";
import { ApiKeyDecryptionError, ApiKeyEncryptionError, ApiKeyNotFoundError } from "../errors";
import { Logger } from "../logger";

const logger = new Logger("ApiKeyService");

/**
 * Service for managing OpenRouter API keys
 * Handles encryption, storage, and retrieval of user API keys
 */
export class ApiKeyService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Upserts (creates or updates) an API key for a user
   * The API key is encrypted before storage
   *
   * @param userId - The user's ID
   * @param apiKey - The plain-text API key to encrypt and store
   * @throws Error if encryption or database operation fails
   */
  async upsertApiKey(userId: string, apiKey: string): Promise<void> {
    try {
      // Encrypt the API key
      const encryptedKey = encrypt(apiKey);

      // Upsert into database
      const { error } = await this.supabase.from("api_keys").upsert(
        {
          user_id: userId,
          encrypted_key: encryptedKey,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        logger.error(new Error("Failed to upsert API key"), {
          userId,
          error,
        });
        throw new Error("Failed to save API key");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Encryption failed")) {
        logger.error(error, { userId });
        throw new ApiKeyEncryptionError("Failed to encrypt API key", error);
      }
      throw error;
    }
  }

  /**
   * Checks if an API key exists for a specific user
   *
   * @param userId - The user's ID
   * @returns True if an API key exists, false otherwise
   * @throws Error if the database query fails
   */
  async checkApiKeyExists(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("api_keys").select("id").eq("user_id", userId).maybeSingle();

    if (error) {
      logger.error(new Error("Failed to check API key existence"), {
        userId,
        error,
      });
      throw new Error("Failed to check API key existence");
    }

    return data !== null;
  }

  /**
   * Deletes the API key for a specific user
   *
   * @param userId - The user's ID
   * @throws Error if the database operation fails
   */
  async deleteApiKey(userId: string): Promise<void> {
    const { error } = await this.supabase.from("api_keys").delete().eq("user_id", userId);

    if (error) {
      logger.error(new Error("Failed to delete API key"), {
        userId,
        error,
      });
      throw new Error("Failed to delete API key");
    }
  }

  /**
   * Retrieves and decrypts the API key for a specific user
   *
   * @param userId - The user's ID
   * @returns The decrypted API key
   * @throws Error if API key is not found or decryption fails
   */
  async getApiKey(userId: string): Promise<string> {
    try {
      // Fetch encrypted key from database
      const { data, error } = await this.supabase
        .from("api_keys")
        .select("encrypted_key")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logger.error(new Error("Failed to fetch API key"), {
          userId,
          error,
        });
        throw new Error("Failed to fetch API key");
      }

      if (!data) {
        throw new ApiKeyNotFoundError();
      }

      // Decrypt and return
      const decryptedKey = decrypt(data.encrypted_key);
      return decryptedKey;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Decryption failed")) {
        logger.error(error, { userId });
        throw new ApiKeyDecryptionError("Failed to decrypt API key", error);
      }
      throw error;
    }
  }
}
