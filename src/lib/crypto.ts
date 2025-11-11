import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

import { config } from "./config";

/**
 * Retrieves the encryption key from environment variables
 * @throws Error if encryption key is not configured
 */
function getEncryptionKey(): string {
  const key = import.meta.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not configured");
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 *
 * @param plaintext - The text to encrypt
 * @returns Base64-encoded string containing salt, IV, auth tag, and encrypted data
 * @throws Error if encryption fails
 */
export function encrypt(plaintext: string): string {
  try {
    const encryptionKey = getEncryptionKey();

    // Generate random salt and IV
    const salt = randomBytes(config.crypto.saltLength);
    const iv = randomBytes(config.crypto.ivLength);

    // Derive key from encryption key and salt
    const key = scryptSync(encryptionKey, salt, config.crypto.keyLength);

    // Create cipher and encrypt
    const cipher = createCipheriv(config.crypto.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine salt + iv + authTag + encrypted data
    const result = Buffer.concat([salt, iv, authTag, encrypted]);

    // Return as base64
    return result.toString("base64");
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 *
 * @param encryptedData - Base64-encoded string containing salt, IV, auth tag, and encrypted data
 * @returns The decrypted plaintext
 * @throws Error if decryption fails or data is corrupted
 */
export function decrypt(encryptedData: string): string {
  try {
    const encryptionKey = getEncryptionKey();

    // Decode from base64
    const buffer = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = buffer.subarray(0, config.crypto.saltLength);
    const iv = buffer.subarray(config.crypto.saltLength, config.crypto.saltLength + config.crypto.ivLength);
    const authTag = buffer.subarray(
      config.crypto.saltLength + config.crypto.ivLength,
      config.crypto.saltLength + config.crypto.ivLength + config.crypto.authTagLength
    );
    const encrypted = buffer.subarray(config.crypto.saltLength + config.crypto.ivLength + config.crypto.authTagLength);

    // Derive key from encryption key and salt
    const key = scryptSync(encryptionKey, salt, config.crypto.keyLength);

    // Create decipher and decrypt
    const decipher = createDecipheriv(config.crypto.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
