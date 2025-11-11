import { z } from "zod";

/**
 * Schema for validating UpsertApiKeyCommand request body
 * Validates that the API key is in the correct OpenRouter format
 */
export const upsertApiKeyCommandSchema = z.object({
  apiKey: z
    .string()
    .min(1, { message: "API key is required" })
    .startsWith("sk-or-", { message: "API key must start with 'sk-or-'" })
    .max(500, { message: "API key cannot exceed 500 characters" }),
});
