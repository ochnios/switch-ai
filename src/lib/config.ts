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
} as const;
