import { Logger } from "../logger";

const logger = new Logger("ApiKeyService");

/**
 * Service for managing OpenRouter API keys
 * Currently uses environment variable for development
 */
export class ApiKeyService {
  /**
   * Retrieves the OpenRouter API key from environment variables
   * In production, this would fetch and decrypt from the database
   *
   * @returns The API key
   * @throws Error if API key is not configured
   */
  getApiKey(): string {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      logger.error(new Error("OpenRouter API key not configured"));
      throw new Error("OpenRouter API key not configured");
    }

    return apiKey;
  }
}
