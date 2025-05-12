import { initClient, ApiFetcherArgs } from '@ts-rest/core';
import axios, { AxiosError } from 'axios';
import { tadataContract } from './tadata-contract';
import { AuthError, NetworkError, ApiError } from '../errors';
import { Logger } from '../core/logger';

interface ClientOptions {
  baseUrl?: string;
  version?: string;
  timeout?: number;
  logger?: Logger;
}

/**
 * Creates a configured ts-rest client for the Tadata API
 */
export function createApiClient(apiKey: string, options: ClientOptions = {}) {
  const {
    baseUrl = 'https://api.tadata.com',
    version = 'latest',
    timeout = 30000,
    logger,
  } = options;

  // Create axios instance with defaults
  const axiosInstance = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-tadata-version': version,
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
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    axiosInstance.interceptors.response.use(
      response => {
        logger.debug(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      error => {
        logger.error('Response error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Create the ts-rest client with our axios instance adapter
  return initClient(tadataContract, {
    baseUrl,
    baseHeaders: {
      'Authorization': `Bearer ${apiKey}`,
      'x-tadata-version': version,
    },
/* <<<<<<<<<<<<<<  ✨ Windsurf Command ⭐ >>>>>>>>>>>>>>>> */
    /**
     * Adapter for `ts-rest` to perform API requests to the Tadata API.
     *
     * @param {ApiFetcherArgs<any>} args - Request arguments with path, method, body, and headers.
     * @returns {Promise<ApiResponse<any>>} - Response with status, body, and headers.
     * @throws {AuthError} - If authentication fails.
     * @throws {ApiError} - If the API returns an error response.
     * @throws {NetworkError} - If a network error occurs.
     */
/* <<<<<<<<<<  5f3418b3-bf5f-4f26-b9b9-206215461c08  >>>>>>>>>>> */
    api: async ({ path, method, body, headers }: ApiFetcherArgs<any>) => {
      try {
        const config: any = {
          url: path,
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
          const errorMessage = typeof data === 'object' && data !== null ? (data as any).message : undefined;

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
