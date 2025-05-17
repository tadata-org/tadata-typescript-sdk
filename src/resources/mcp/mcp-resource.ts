import { ClientArgs, InitClientReturn } from '@ts-rest/core';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { Logger } from '../../core/logger';
import { ApiError, SpecInvalidError } from '../../errors';
import { deploymentsContract } from '../../http/contracts';
import { OpenApi3Schema } from '../../http/schemas';
import { McpDeployInput, McpDeploymentResult } from './types';

interface DeploymentSuccessResponse {
  ok: true;
  data: {
    updated: boolean;
    deployment: {
      id: string;
      name: string;
      url?: string; // URL is optional in the server response
      specVersion?: string; // specVersion is optional in the server response
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

interface DeploymentErrorResponse {
  ok: false;
  error: {
    message: string;
    details?: unknown;
  };
}

type DeploymentResponse = DeploymentSuccessResponse | DeploymentErrorResponse;

/**
 * Class for interacting with MCP resources
 * This serves as a user-friendly interface that hides the REST contract details
 */
export class McpResource {
  constructor(
    private readonly client: InitClientReturn<typeof deploymentsContract, ClientArgs>,
    private readonly logger: Logger
  ) {}

  /**
   * Deploy an MCP server from an OpenAPI specification
   * This provides an intuitive API that hides the underlying REST contract
   */
  async deploy(input: McpDeployInput): Promise<McpDeploymentResult> {
    this.logger.info('Deploying MCP server from OpenAPI spec');

    // Type guard to check for the response structure
    const isDeploymentResponse = (body: unknown): body is DeploymentResponse => {
      return typeof body === 'object' && body !== null && 'ok' in body;
    };

    try {
      // Get the raw spec from the OpenApiSource
      const rawSpec = input.spec.getRawSpec();

      // TypeScript needs help understanding the spec is compatible with the schema
      const openapiSpec = rawSpec as z.infer<typeof OpenApi3Schema>;

      // Make the API call using the deployments contract
      // No need to pass apiKey as it's automatically added by the client
      const response = await this.client.upsertFromOpenApi({
        body: {
          openApiSpec: openapiSpec,
          name: input.name,
          baseUrl: input.specBaseUrl,
        },
      });

      if (isDeploymentResponse(response.body) && response.body.ok) {
        const deploymentData = response.body.data.deployment;

        return {
          id: deploymentData.id,
          // Provide a default value for specVersion if undefined
          specVersion: deploymentData.specVersion || '1.0.0',
          // Provide a default URL value (required by type) if not returned from server
          url: deploymentData.url || `http://localhost:3000/mcp/${deploymentData.id}`,
          createdAt: deploymentData.createdAt ? new Date(deploymentData.createdAt) : new Date(),
        };
      }

      // Handle error cases
      if (isDeploymentResponse(response.body) && !response.body.ok) {
        const error = response.body.error;
        throw new ApiError(error.message, response.status, error, null);
      }

      // Unexpected response structure
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      // If it's already a domain error, rethrow
      if (error instanceof SpecInvalidError) {
        throw error;
      }

      // Convert API errors with status 400 to SpecInvalidError
      if (error instanceof ApiError && error.statusCode === StatusCodes.BAD_REQUEST) {
        throw new SpecInvalidError(
          error.message,
          error.body && typeof error.body === 'object'
            ? (error.body as { details?: unknown }).details
            : undefined,
          error
        );
      }

      // Log and rethrow the error
      const errorInfo = formatErrorForLogging(error);
      this.logger.error('Deploy failed', errorInfo);
      throw error;
    }
  }
}

/**
 * Format error objects for logging to reduce noise
 */
function formatErrorForLogging(error: unknown): Record<string, any> {
  if (!error) return { type: 'unknown' };

  // Handle ApiError
  if (error instanceof ApiError) {
    const result: Record<string, any> = {
      type: 'ApiError',
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };

    // Extract response body if available
    if (error.body) {
      if (typeof error.body === 'object') {
        const body = error.body as any;
        if (body.error) {
          result.errorCode = body.error.code;
          result.errorMessage = body.error.message;

          // Include first validation error if present
          if (body.error.errors && body.error.errors.length > 0) {
            result.validation = body.error.errors[0];
          }
        }
      }
    }

    return result;
  }

  // Handle AuthError
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message,
      code: (error as any).code,
    };
  }

  // Unknown error type
  return {
    type: 'unknown',
    error: String(error),
  };
}
