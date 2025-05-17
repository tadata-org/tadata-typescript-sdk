import { OpenApiSource } from '../../openapi';

/**
 * Input for MCP deployment
 */
export interface McpDeployInput {
  spec: OpenApiSource;
  specBaseUrl?: string;
  name?: string;
}

/**
 * Result of a successful MCP deployment
 */
export interface McpDeploymentResult {
  id: string;
  url: string;
  specVersion: string;
  createdAt: Date;
}
