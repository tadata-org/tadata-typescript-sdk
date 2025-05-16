import { z } from 'zod';
import { ApiErrorSchema, ErrorCode } from './error.schema';

/**
 * Standard API response envelope that works for both success and error cases
 * T is the type of the data payload for successful responses
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      ok: z.boolean(),
      status: z.number(),
      data: dataSchema.optional(),
      error: ApiErrorSchema.omit({ status: true }).optional(),
    })
    .refine(
      data => (data.ok && data.data !== undefined) || (!data.ok && data.error !== undefined),
      {
        message: "Response must have 'data' when ok is true and 'error' when ok is false",
      }
    );

/**
 * Helper to create a successful response envelope
 */
export function createSuccessResponse<T>(status: number, data: T) {
  return {
    ok: true,
    status,
    data,
  };
}

/**
 * Helper to create an error response envelope
 */
export function createErrorResponse(error: z.infer<typeof ApiErrorSchema>) {
  const response: {
    ok: false;
    status: number;
    error: {
      code: ErrorCode;
      message: string;
      errors?: any[];
      details?: unknown;
    };
  } = {
    ok: false,
    status: error.status,
    error: {
      code: error.code,
      message: error.message,
    },
  };

  // Conditionally add errors and details only if they exist
  if (error.errors) {
    response.error.errors = error.errors;
  }

  if (error.details) {
    response.error.details = error.details;
  }

  return response;
}
