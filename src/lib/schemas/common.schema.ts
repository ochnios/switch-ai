import { z } from "zod";

/**
 * Schema for validating UUID path parameters
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid UUID format" }),
});

/**
 * Schema for validating pagination query parameters
 * Can be reused across multiple endpoints
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive({ message: "Page must be a positive integer" })),
  pageSize: z
    .string()
    .optional()
    .default("50")
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int()
        .positive({ message: "Page size must be a positive integer" })
        .max(100, { message: "Page size cannot exceed 100" })
    ),
});
