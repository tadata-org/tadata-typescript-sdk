import { TadataErrorCode } from './error-codes';

/**
 * Base error class for all errors thrown by the Tadata SDK
 */
export class TadataError extends Error {
  /**
   * Tadata-specific error code
   */
  readonly code: TadataErrorCode;

  /**
   * HTTP status code if available
   */
  readonly status?: number;

  /**
   * Additional error details
   */
  readonly details?: unknown;

  /**
   * Original error that caused this error
   */
  readonly cause?: Error;

  constructor(
    code: TadataErrorCode,
    message: string,
    options?: {
      status?: number;
      details?: unknown;
      cause?: Error;
    }
  ) {
    // In environments where Error doesn't support the cause option
    // we need to handle it manually
    super(message);

    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
    this.cause = options?.cause;
    this.name = 'TadataError';
  }
}

/**
 * Factory for creating different types of TadataErrors
 */
export class TadataErrorFactory {
  /**
   * Create a network error
   */
  createNetworkError(message: string, cause?: Error): TadataError {
    return new TadataError('TADATA/NETWORK', message, { cause });
  }

  /**
   * Create an authentication error
   */
  createAuthError(message = 'Invalid API key'): TadataError {
    return new TadataError('TADATA/AUTH', message, { status: 401 });
  }

  /**
   * Create an invalid spec error
   */
  createInvalidSpecError(message: string, details?: unknown): TadataError {
    return new TadataError('TADATA/INVALID_SPEC', message, { status: 422, details });
  }

  /**
   * Create a hash exists error
   */
  createHashExistsError(message = 'Identical spec already deployed'): TadataError {
    return new TadataError('TADATA/HASH_EXISTS', message, { status: 409 });
  }

  /**
   * Create a not found error
   */
  createNotFoundError(message = 'Resource not found'): TadataError {
    return new TadataError('TADATA/NOT_FOUND', message, { status: 404 });
  }

  /**
   * Create a server error
   */
  createServerError(message = 'Tadata API server error', status = 500): TadataError {
    return new TadataError('TADATA/SERVER_ERROR', message, { status });
  }

  /**
   * Create an unexpected error
   */
  createUnexpectedError(message = 'Unexpected error occurred', details?: unknown): TadataError {
    return new TadataError('TADATA/UNEXPECTED', message, { details });
  }
}
