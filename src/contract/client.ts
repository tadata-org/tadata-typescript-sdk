import { initClient } from '@ts-rest/core';
import axios, { AxiosError } from 'axios';
import { Logger } from '../core/logger';
import { ApiError, AuthError, NetworkError } from '../errors';
import { tadataContract } from './tadata-contract';

interface ClientOptions {
  baseUrl: string;
  version: '05-2025' | 'latest';
  timeout?: number;
  logger?: Logger;
  isDev: boolean;
}

// Custom type for the fetcher args that includes query
interface CustomApiFetcherArgs {
  path: string;
  method: string;
  body?: any;
  headers: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Creates a configured ts-rest client for the Tadata API
 */
export function createApiClient(apiKey: string, options: ClientOptions) {
  const { baseUrl, version, timeout = 30000, logger } = options;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-version': version as string,
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for logging
  if (logger) {
    axiosInstance.interceptors.request.use(
      config => {
        logger.debug(`Making request to ${config.method?.toUpperCase()} ${config.url}`);
        // Log API version header specifically
        logger.debug(`Using API version: ${config.headers['x-api-version']}`);
        return config;
      },
      error => {
        // Format error for cleaner logs
        const errorInfo = {
          message: error.message,
          code: error.code,
        };
        logger.error('Request error', errorInfo);
        return Promise.reject(error);
      }
    );

    axiosInstance.interceptors.response.use(
      response => {
        logger.debug(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      error => {
        // Format error for cleaner logs
        const errorInfo: Record<string, any> = {
          message: error.message,
          code: error.code,
        };

        if (error.response) {
          errorInfo.status = error.response.status;

          // Extract specific error details
          if (error.response.data && error.response.data.error) {
            errorInfo.errorCode = error.response.data.error.code;
            errorInfo.errorMessage = error.response.data.error.message;

            // Include first validation error if present
            if (error.response.data.error.errors && error.response.data.error.errors.length > 0) {
              errorInfo.validation = error.response.data.error.errors[0];
            }
          }
        }

        logger.error('Response error', errorInfo);
        return Promise.reject(error);
      }
    );
  }

  // Create the ts-rest client with our axios instance adapter
  return initClient(tadataContract, {
    baseUrl,
    baseHeaders: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-version': version,
    },

    /**
     * Adapter for `ts-rest` to perform API requests to the Tadata API.
     *
     * @param {CustomApiFetcherArgs} args - Request arguments with path, method, body, headers, and query params.
     * @returns {Promise<ApiResponse<any>>} - Response with status, body, and headers.
     * @throws {AuthError} - If authentication fails.
     * @throws {ApiError} - If the API returns an error response.
     * @throws {NetworkError} - If a network error occurs.
     */
    api: async ({ path, method, body, headers, query = {} }: CustomApiFetcherArgs) => {
      try {
        // Add the apiKey to query parameters for every request
        // This avoids having to manually add it in each method call
        const augmentedQuery = {
          ...query,
          apiKey,
        };

        // Create query string
        const queryString = new URLSearchParams(augmentedQuery).toString();
        const urlWithQuery = queryString ? `${path}?${queryString}` : path;

        const config: any = {
          url: urlWithQuery,
          method,
          headers,
        };

        if (body) {
          config.data = body;
        }

        try {
          const response = await axiosInstance.request(config);

          return {
            status: response.status,
            body: response.data,
            headers: new Headers(response.headers as Record<string, string>),
          };
        } catch (error) {
          const axiosError = error as AxiosError;

          // Handle errors and translate to our domain errors
          if (!axiosError.response) {
            throw new NetworkError('Network error occurred', axiosError);
          }

          const { status, data } = axiosError.response;

          // Extract error details from the standardized response envelope
          // The server returns: { ok: false, status: number, error: { code, message, errors?, details? } }
          const errorResponse = data as any;
          const errorDetails = errorResponse?.error || {};

          const errorMessage = errorDetails.message || `API error: ${status}`;

          if (status === 401 || status === 403) {
            throw new AuthError(errorMessage || 'Authentication failed', axiosError);
          }

          // For all other errors, throw ApiError with the full response
          // Higher-level SDK code can inspect this and throw more specific errors
          throw new ApiError(errorMessage, status, errorResponse, axiosError);
        }
      } catch (error) {
        // Re-throw domain errors
        if (
          error instanceof AuthError ||
          error instanceof ApiError ||
          error instanceof NetworkError
        ) {
          throw error;
        }

        // Wrap other errors
        throw new NetworkError(`Unexpected error: ${(error as Error).message}`, error);
      }
    },
  });
}
