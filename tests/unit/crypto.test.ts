import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

describe("UT-CRYPTO-01: Encryption Function", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-chars-long!");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("1.1: Encrypts plaintext string successfully and returns base64-encoded string", () => {
    const plaintext = "test message";
    const encrypted = encrypt(plaintext);

    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    // Base64 strings are alphanumeric with +, /, = characters
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("1.2: Throws error when ENCRYPTION_KEY environment variable is not set", () => {
    vi.unstubAllEnvs();

    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY environment variable is not configured");
  });

  it("1.3: Encrypted output is different for same plaintext (due to random salt/IV)", () => {
    const plaintext = "test message";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Due to random salt and IV, same plaintext should produce different ciphertext
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("1.4: Encrypted output has correct structure (base64 format)", () => {
    const plaintext = "test message";
    const encrypted = encrypt(plaintext);

    // Base64 validation
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    // Should be reasonably long (salt + IV + authTag + encrypted data)
    expect(encrypted.length).toBeGreaterThan(50);
  });

  it("1.5: Handles empty string input", () => {
    const encrypted = encrypt("");
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("1.6: Handles special characters and unicode in plaintext", () => {
    const plaintexts = [
      "Hello, World!",
      "Special chars: !@#$%^&*()",
      "Unicode: 你好世界 🌍",
      "Emoji: 😀🎉🚀",
      "Mixed: Hello 世界! 🎉",
    ];

    for (const plaintext of plaintexts) {
      const encrypted = encrypt(plaintext);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");

      // Verify we can decrypt it back
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    }
  });

  it("1.7: Handles very long plaintext strings", () => {
    const longPlaintext = "a".repeat(10000);
    const encrypted = encrypt(longPlaintext);

    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");

    // Verify we can decrypt it back
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(longPlaintext);
  });
});

describe("UT-CRYPTO-02: Decryption Function", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-chars-long!");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("2.1: Decrypts valid encrypted data and returns original plaintext", () => {
    const plaintext = "test message";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it("2.2: Throws error when ENCRYPTION_KEY environment variable is not set", () => {
    const plaintext = "test message";
    const encrypted = encrypt(plaintext);

    vi.unstubAllEnvs();

    expect(() => decrypt(encrypted)).toThrow("ENCRYPTION_KEY environment variable is not configured");
  });

  it("2.3: Throws error when encrypted data is corrupted (invalid base64)", () => {
    const invalidBase64 = "not-valid-base64!!!";

    expect(() => decrypt(invalidBase64)).toThrow("Decryption failed");
  });

  it("2.4: Throws error when encrypted data is tampered with (auth tag mismatch)", () => {
    const plaintext = "test message";
    const encrypted = encrypt(plaintext);

    // Tamper with the encrypted data by modifying a character
    const tampered = encrypted.slice(0, -5) + "XXXXX";

    expect(() => decrypt(tampered)).toThrow("Decryption failed");
  });

  it("2.5: Throws error when encrypted data has incorrect length", () => {
    // Create a buffer that's too short to contain all required components
    const shortBuffer = Buffer.from("short").toString("base64");

    expect(() => decrypt(shortBuffer)).toThrow("Decryption failed");
  });

  it("2.6: Handles decryption of empty string", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe("");
  });

  it("2.7: Handles decryption of special characters and unicode", () => {
    const plaintexts = [
      "Hello, World!",
      "Special chars: !@#$%^&*()",
      "Unicode: 你好世界 🌍",
      "Emoji: 😀🎉🚀",
      "Mixed: Hello 世界! 🎉",
    ];

    for (const plaintext of plaintexts) {
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    }
  });
});

describe("UT-CRYPTO-03: Encryption/Decryption Roundtrip", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-chars-long!");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("3.1: Encrypt and decrypt roundtrip preserves original plaintext", () => {
    const plaintexts = [
      "simple text",
      "Text with spaces and punctuation!",
      "1234567890",
      "Special: !@#$%^&*()",
      "Unicode: 你好世界",
      "Emoji: 😀🎉🚀",
    ];

    for (const plaintext of plaintexts) {
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    }
  });

  it("3.2: Multiple encryptions of same plaintext produce different ciphertexts but decrypt to same value", () => {
    const plaintext = "test message";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    const encrypted3 = encrypt(plaintext);

    // All should be different
    expect(encrypted1).not.toBe(encrypted2);
    expect(encrypted2).not.toBe(encrypted3);
    expect(encrypted1).not.toBe(encrypted3);

    // But all should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
    expect(decrypt(encrypted3)).toBe(plaintext);
  });

  it("3.3: Roundtrip works with various data types (strings, JSON strings, multiline text)", () => {
    const testCases = [
      "simple string",
      JSON.stringify({ key: "value", number: 123, nested: { data: "test" } }),
      "multiline\ntext\nwith\nnewlines",
      "text with\ttabs\tand\tspaces",
      "very long string " + "x".repeat(1000),
    ];

    for (const plaintext of testCases) {
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    }
  });
});
