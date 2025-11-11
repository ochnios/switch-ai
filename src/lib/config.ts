/**
 * Application configuration
 * Centralized configuration for various app settings
 */
export const config = {
  /**
   * AI/OpenRouter configuration
   */
  ai: {
    summaryModel: "anthropic/claude-3.5-sonnet",
    titleGenerationModel: "anthropic/claude-3.5-sonnet",
  },

  /**
   * Pagination defaults
   */
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 100,
  },

  /**
   * Encryption configuration
   */
  crypto: {
    algorithm: "aes-256-gcm" as const,
    saltLength: 16,
    ivLength: 16,
    authTagLength: 16,
    keyLength: 32,
  },
} as const;
