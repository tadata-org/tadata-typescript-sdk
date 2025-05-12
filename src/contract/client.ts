import { initClient } from '@ts-rest/core';
import axios, { AxiosError } from 'axios';
import { tadataContract } from './tadata-contract';
import { AuthError, NetworkError, ApiError } from '../errors';
import { Logger } from '../core/logger';

interface ClientOptions {
  baseUrl?: string;
  version?: string;
  retries?: number;
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
    retries = 3,
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
    api: async ({ path, method, body, headers }) => {
      try {
        const config = {
          url: path,
          method,
          headers,
        };

        if (body) {
          config.data = body;
        }

        let retryCount = 0;
        let lastError = null;

        // Simple retry logic
        while (retryCount < retries) {
          try {
            const response = await axiosInstance.request(config);

            return {
              status: response.status,
              body: response.data,
              headers: response.headers as Record<string, string>,
            };
          } catch (error) {
            lastError = error as AxiosError;

            if (!shouldRetry(lastError, retryCount)) {
              break;
            }

            retryCount++;

            if (logger) {
              logger.warn(`Retrying request (${retryCount}/${retries})`);
            }

            // Exponential backoff: wait longer between each retry
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
          }
        }

        // Handle errors and translate to our domain errors
        if (lastError) {
          if (!lastError.response) {
            throw new NetworkError('Network error occurred', lastError);
          }

          const { status, data } = lastError.response;

          if (status === 401 || status === 403) {
            throw new AuthError(data?.message || 'Authentication failed', lastError);
          }

          throw new ApiError(data?.message || `API error: ${status}`, status, data, lastError);
        }

        // This shouldn't happen but satisfies TypeScript
        throw new NetworkError('Unknown error occurred');
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

// Helper function to determine if a request should be retried
function shouldRetry(error: AxiosError, _retryCount: number): boolean {
  // Don't retry client errors (except rate limiting)
  if (error.response) {
    const status = error.response.status;

    if (status === 429) {
      return true; // Always retry rate limiting
    }

    if (status >= 400 && status < 500) {
      return false; // Don't retry other client errors
    }
  }

  // Retry on network errors and server errors
  return true;
}
