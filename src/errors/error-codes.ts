/**
 * All possible error codes returned by the Tadata API
 */
export type TadataErrorCode =
  | 'TADATA/NETWORK'
  | 'TADATA/AUTH'
  | 'TADATA/INVALID_SPEC'
  | 'TADATA/HASH_EXISTS'
  | 'TADATA/NOT_FOUND'
  | 'TADATA/RATE_LIMIT'
  | 'TADATA/SERVER_ERROR'
  | 'TADATA/UNEXPECTED';

/**
 * Maps HTTP status codes to Tadata error codes
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, TadataErrorCode> = {
  400: 'TADATA/INVALID_SPEC',
  401: 'TADATA/AUTH',
  404: 'TADATA/NOT_FOUND',
  409: 'TADATA/HASH_EXISTS',
  422: 'TADATA/INVALID_SPEC',
  429: 'TADATA/RATE_LIMIT',
  500: 'TADATA/SERVER_ERROR',
  502: 'TADATA/SERVER_ERROR',
  503: 'TADATA/SERVER_ERROR',
  504: 'TADATA/SERVER_ERROR',
};

/**
 * Check if an error is retryable based on its status code
 */
export function isRetryableError(status: number): boolean {
  return status >= 500 && status < 600;
}
