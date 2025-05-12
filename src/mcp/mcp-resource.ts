import { McpDeploymentResult, TadataContract } from '../contract';
import { Logger } from '../core/logger';
import { SpecInvalidError } from '../errors';
import { OpenApiSource } from '../openapi/index.js';

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
    private readonly client: ReturnType<TadataContract>,
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
        },
      });

      // Handle possible error responses
      if (response.status === 400) {
        throw new SpecInvalidError(response.body.message, response.body.details);
      }

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

      // Log and rethrow the error
      this.logger.error('Failed to deploy MCP server', error);
      throw error;
    }
  }
}
