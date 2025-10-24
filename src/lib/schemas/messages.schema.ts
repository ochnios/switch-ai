import { z } from "zod";

/**
 * Schema for validating SendMessageCommand request body
 */
export const sendMessageCommandSchema = z.object({
  content: z.string().min(1, { message: "Message content cannot be empty" }).max(10000, {
    message: "Message content cannot exceed 10000 characters",
  }),
  model: z.string().min(1, { message: "Model name is required" }),
});
