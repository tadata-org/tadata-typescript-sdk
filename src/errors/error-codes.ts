import { StatusCodes } from 'http-status-codes';

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
 * NOTE: This mapping is currently not being used in the codebase.
 * Consider removing it if not needed or implementing proper usage.
 */
// export const HTTP_STATUS_TO_ERROR_CODE: Record<number, TadataErrorCode> = {
//   [StatusCodes.BAD_REQUEST]: 'TADATA/INVALID_SPEC',
//   [StatusCodes.UNAUTHORIZED]: 'TADATA/AUTH',
//   [StatusCodes.NOT_FOUND]: 'TADATA/NOT_FOUND',
//   [StatusCodes.CONFLICT]: 'TADATA/HASH_EXISTS',
//   [StatusCodes.UNPROCESSABLE_ENTITY]: 'TADATA/INVALID_SPEC',
//   [StatusCodes.TOO_MANY_REQUESTS]: 'TADATA/RATE_LIMIT',
//   [StatusCodes.INTERNAL_SERVER_ERROR]: 'TADATA/SERVER_ERROR',
//   [StatusCodes.BAD_GATEWAY]: 'TADATA/SERVER_ERROR',
//   [StatusCodes.SERVICE_UNAVAILABLE]: 'TADATA/SERVER_ERROR',
//   [StatusCodes.GATEWAY_TIMEOUT]: 'TADATA/SERVER_ERROR',
// };

/**
 * Check if an error is retryable based on its status code
 */
export function isRetryableError(status: number): boolean {
  return status >= StatusCodes.INTERNAL_SERVER_ERROR && status < 600;
}
