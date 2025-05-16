import { initClient } from '@ts-rest/core';
import axios, { AxiosError } from 'axios';
import { tadataContract } from './tadata-contract';
import { AuthError, NetworkError, ApiError } from '../errors';
import { Logger } from '../core/logger';

interface ClientOptions {
  baseUrl: string;
  version: string;
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

  // Create axios instance with defaults
  const axiosInstance = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-version': version,
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor for logging
  if (logger) {
    axiosInstance.interceptors.request.use(
      config => {
        logger.debug(`Making request to ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => {
        // Format error for cleaner logs
        const errorInfo = {
          message: error.message,
          code: error.code
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
        let errorInfo: Record<string, any> = {
          message: error.message,
          code: error.code
        };
        
        if (error.response) {
          errorInfo.status = error.response.status;
          
          // Extract specific error details
          if (error.response.data && error.response.data.error) {
            errorInfo.errorCode = error.response.data.error.code;
            errorInfo.errorMessage = error.response.data.error.message;
            
            // Include first validation error if present
            if (error.response.data.error.errors && 
                error.response.data.error.errors.length > 0) {
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
          const errorMessage =
            typeof data === 'object' && data !== null ? (data as any).message : undefined;

          if (status === 401 || status === 403) {
            throw new AuthError(errorMessage || 'Authentication failed', axiosError);
          }

          throw new ApiError(errorMessage || `API error: ${status}`, status, data, axiosError);
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
