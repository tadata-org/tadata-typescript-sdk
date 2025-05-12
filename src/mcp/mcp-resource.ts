import { McpDeploymentResult } from '../contract';
import { Logger } from '../core/logger';
import { OpenApiSource } from '../openapi/openapi-source';
import { SpecInvalidError, ApiError } from '../errors';

/**
 * Input for MCP deployment
 */
export interface McpDeployInput {
  spec: OpenApiSource;
  specBaseUrl: string;
  name?: string;
}

/**
 * Class for interacting with MCP resources
 */
export class McpResource {
  constructor(
    private readonly client: any,
    private readonly logger: Logger,
    private readonly isDev: boolean = false
  ) {}

  /**
   * Deploy an MCP server from an OpenAPI specification
   */
  async deploy(input: McpDeployInput): Promise<McpDeploymentResult> {
    this.logger.info('Deploying MCP server from OpenAPI spec');
    
    try {
      // Get the raw spec from the OpenApiSource
      const rawSpec = input.spec.getRawSpec();
      
      // Make the API call
      const response = await this.client.mcpDeploy({
        body: {
          spec: rawSpec,
          baseUrl: input.specBaseUrl,
          name: input.name,
          dev: this.isDev,
        }
      });
      
      // For successful response, return the deployment result
      if (response.status === 201) {
        return response.body;
      }
      
      // This shouldn't happen because the client should throw for other status codes
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      // If it's already a domain error, rethrow
      if (error instanceof SpecInvalidError) {
        throw error;
      }
      
      // Convert API errors with status 400 to SpecInvalidError
      if (error instanceof ApiError && error.statusCode === 400) {
        throw new SpecInvalidError(
          error.message,
          error.body && typeof error.body === 'object' ? (error.body as any).details : undefined,
          error
        );
      }
      
      // Log and rethrow the error
      this.logger.error('Failed to deploy MCP server', error);
      throw error;
    }
  }
}
