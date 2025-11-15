import { z } from "zod";

import { config } from "../config";

/**
 * Schema for validating chat message structure
 */
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, { message: "Message content cannot be empty" }),
});

/**
 * Schema for validating model parameters
 */
export const modelParametersSchema = z.object({
  temperature: z
    .number()
    .min(config.ai.parameters.temperature.min, {
      message: `Temperature must be at least ${config.ai.parameters.temperature.min}`,
    })
    .max(config.ai.parameters.temperature.max, {
      message: `Temperature cannot exceed ${config.ai.parameters.temperature.max}`,
    })
    .optional(),
  maxTokens: z
    .number()
    .int()
    .min(config.ai.parameters.maxTokens.min, {
      message: `Max tokens must be at least ${config.ai.parameters.maxTokens.min}`,
    })
    .max(config.ai.parameters.maxTokens.max, {
      message: `Max tokens cannot exceed ${config.ai.parameters.maxTokens.max}`,
    })
    .optional(),
  topP: z
    .number()
    .min(config.ai.parameters.topP.min, {
      message: `Top P must be at least ${config.ai.parameters.topP.min}`,
    })
    .max(config.ai.parameters.topP.max, {
      message: `Top P cannot exceed ${config.ai.parameters.topP.max}`,
    })
    .optional(),
  frequencyPenalty: z
    .number()
    .min(config.ai.parameters.frequencyPenalty.min, {
      message: `Frequency penalty must be at least ${config.ai.parameters.frequencyPenalty.min}`,
    })
    .max(config.ai.parameters.frequencyPenalty.max, {
      message: `Frequency penalty cannot exceed ${config.ai.parameters.frequencyPenalty.max}`,
    })
    .optional(),
  presencePenalty: z
    .number()
    .min(config.ai.parameters.presencePenalty.min, {
      message: `Presence penalty must be at least ${config.ai.parameters.presencePenalty.min}`,
    })
    .max(config.ai.parameters.presencePenalty.max, {
      message: `Presence penalty cannot exceed ${config.ai.parameters.presencePenalty.max}`,
    })
    .optional(),
});

/**
 * Schema for validating chat completion parameters
 */
export const chatCompletionParamsSchema = z.object({
  userId: z.string().uuid({ message: "Invalid user ID format" }),
  model: z.string().min(1, { message: "Model identifier is required" }),
  systemMessage: z.string().optional(),
  userMessages: z
    .array(chatMessageSchema.omit({ role: true }))
    .min(1, { message: "At least one user message is required" })
    .max(config.ai.parameters.maxHistoryMessages, {
      message: `Cannot exceed ${config.ai.parameters.maxHistoryMessages} messages`,
    }),
  assistantMessages: z
    .array(chatMessageSchema.omit({ role: true }))
    .max(config.ai.parameters.maxHistoryMessages, {
      message: `Cannot exceed ${config.ai.parameters.maxHistoryMessages} messages`,
    })
    .optional(),
  modelParams: modelParametersSchema.optional(),
});
