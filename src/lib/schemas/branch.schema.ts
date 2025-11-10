import { z } from "zod";

/**
 * Schema for validating CreateBranchCommand request body
 */
export const createBranchCommandSchema = z.object({
  type: z.enum(["full", "summary"], {
    errorMap: () => ({ message: "Branch type must be either 'full' or 'summary'" }),
  }),
});

/**
 * Schema for validating message ID path parameter
 */
export const messageIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid message ID format" }),
});
