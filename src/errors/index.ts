/**
 * Base error class for all Tadata SDK errors
 */
export class TadataError extends Error {
  constructor(
    readonly message: string,
    readonly code: string,
    readonly statusCode?: number,
    readonly cause?: Error | unknown
  ) {
    super(message);
    this.name = 'TadataError';

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when the OpenAPI specification is invalid
 */
export class SpecInvalidError extends TadataError {
  constructor(message: string, details?: unknown, cause?: Error | unknown) {
    super(message, 'spec_invalid', 400, cause);
    this.name = 'SpecInvalidError';
    this.details = details;
  }

  readonly details?: unknown;
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends TadataError {
  constructor(message = 'Authentication failed', cause?: Error | unknown) {
    super(message, 'auth_error', 401, cause);
    this.name = 'AuthError';
  }
}

/**
 * Error thrown for API errors
 */
export class ApiError extends TadataError {
  constructor(
    message: string,
    statusCode: number,
    readonly body?: unknown,
    cause?: Error | unknown
  ) {
    super(message, 'api_error', statusCode, cause);
    this.name = 'ApiError';
  }
}

/**
 * Error thrown for network-related failures
 */
export class NetworkError extends TadataError {
  constructor(message: string, cause?: Error | unknown) {
    super(message, 'network_error', undefined, cause);
    this.name = 'NetworkError';
  }
}
