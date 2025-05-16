import { ErrorCode } from '../../src';

/**
 * Helper to create a success response envelope
 * Used for testing API responses
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
 * Used for testing API error responses
 */
export function createErrorResponse(error: {
  status: number;
  code: ErrorCode;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    source?: string;
  }>;
  details?: unknown;
}) {
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