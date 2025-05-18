import { StatusCodes } from 'http-status-codes';

/**
 * Base error class for all errors originating from the Tadata SDK.
 * All specific SDK errors will extend this class.
 * You can use this class to catch any error thrown by the SDK.
 *
 * @since 0.1.0
 */
export class TadataSDKError extends Error {
  /**
   * A unique machine-readable error code string.
   * @readonly
   */
  public readonly code: string;

  /**
   * The HTTP status code associated with this error, if applicable (e.g., for API errors).
   * @readonly
   */
  public readonly statusCode?: number;

  /**
   * The original error or cause, if this error was triggered by another exception.
   * @readonly
   */
  public readonly cause?: Error | unknown;

  /**
   * Creates an instance of TadataSDKError.
   * @param message A human-readable description of the error.
   * @param code A unique machine-readable error code.
   * @param statusCode Optional HTTP status code related to the error.
   * @param cause Optional original error that led to this error.
   */
  constructor(
    message: string, // Keep `readonly` on class property, not constructor param for JSDoc
    code: string,
    statusCode?: number,
    cause?: Error | unknown
  ) {
    super(message);
    this.name = 'TadataSDKError';
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when an OpenAPI specification is invalid or cannot be processed.
 * This can occur during operations like `OpenApiSource.fromFile()` or `tadata.mcp.deploy()`
 * if the provided specification has structural issues, syntax errors, or fails validation.
 *
 * @since 0.1.0
 */
export class SpecInvalidError extends TadataSDKError {
  /**
   * Additional details about the validation error, if available.
   * The structure of this property can vary depending on the specific validation failure.
   * @readonly
   */
  public readonly details?: unknown;

  /**
   * Creates an instance of SpecInvalidError.
   * @param message A human-readable description of the validation error.
   * @param details Optional additional details about the validation failure.
   * @param cause Optional original error that led to this validation error.
   */
  constructor(message: string, details?: unknown, cause?: Error | unknown) {
    super(message, 'spec_invalid', StatusCodes.BAD_REQUEST, cause);
    this.name = 'SpecInvalidError';
    this.details = details;
  }
}

/**
 * Error thrown when an API request fails due to authentication issues.
 * This typically means the provided API key is invalid, expired, or lacks necessary permissions.
 *
 * @since 0.1.0
 */
export class AuthError extends TadataSDKError {
  /**
   * Creates an instance of AuthError.
   * @param message A human-readable description of the authentication failure. Defaults to "Authentication failed".
   * @param cause Optional original error that led to this authentication error.
   */
  constructor(message = 'Authentication failed', cause?: Error | unknown) {
    super(message, 'auth_error', StatusCodes.UNAUTHORIZED, cause);
    this.name = 'AuthError';
  }
}

/**
 * Error thrown when the Tadata API returns an error response (e.g., HTTP 4xx or 5xx status codes).
 * This class provides access to the HTTP status code and the body of the API error response.
 *
 * @since 0.1.0
 */
export class ApiError extends TadataSDKError {
  /**
   * The body of the API error response, if available.
   * The structure of this property depends on the specific API endpoint and error.
   * @readonly
   */
  public readonly body?: unknown;

  /**
   * Creates an instance of ApiError.
   * @param message A human-readable description of the API error.
   * @param statusCode The HTTP status code received from the API.
   * @param body Optional body of the API error response.
   * @param cause Optional original error that led to this API error.
   */
  constructor(
    message: string,
    statusCode: number, // Already documented as a property of TadataSDKError, but good to have here for context
    body?: unknown,
    cause?: Error | unknown
  ) {
    super(message, 'api_error', statusCode, cause);
    this.name = 'ApiError';
    this.body = body;
  }
}

/**
 * Error thrown for network-related issues encountered while trying to communicate with the Tadata API.
 * This could be due to DNS resolution failures, TCP connection timeouts, or other network interruptions.
 *
 * @since 0.1.0
 */
export class NetworkError extends TadataSDKError {
  /**
   * Creates an instance of NetworkError.
   * @param message A human-readable description of the network failure.
   * @param cause Optional original error that led to this network error (e.g., a socket error).
   */
  constructor(message: string, cause?: Error | unknown) {
    super(message, 'network_error', undefined, cause);
    this.name = 'NetworkError';
  }
}
