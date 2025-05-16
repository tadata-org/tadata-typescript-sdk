import { z } from 'zod';

/**
 * Strictly typed error codes for consistent error handling
 * Matches the implementation in the @tadata/shared package
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVICE_VALIDATION_ERROR = 'SERVICE_VALIDATION_ERROR',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
  INVALID_CONTENT_TYPE = 'INVALID_CONTENT_TYPE',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Define ValidationErrorSchema or import if it exists elsewhere - assuming it for now
const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  source: z.string().optional(), // Or more specific if applicable
});

export const ApiErrorSchema = z.object({
  status: z.number(),
  code: z.nativeEnum(ErrorCode), // Use the ErrorCode enum instead of z.string()
  message: z.string(),
  errors: z.array(ValidationErrorSchema).optional(),
  details: z.unknown().optional(),
});
