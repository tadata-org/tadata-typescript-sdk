import { OpenApiSource } from '../../openapi';

/**
 * Defines the input parameters required for deploying a Model Context Protocol (MCP) instance.
 *
 * @since 0.1.0
 */
export interface McpDeployInput {
  /**
   * The OpenAPI specification for the API to be proxied.
   * This should be an instance of {@link OpenApiSource},
   * created from a file, JSON string, or object.
   */
  spec: OpenApiSource;

  /**
   * The base URL of the target API that the MCP will proxy requests to.
   * This is the actual endpoint where your backend service is running.
   * @example "https://api.example.com/v1"
   */
  specBaseUrl?: string;

  /**
   * An optional descriptive name for this MCP deployment.
   * This can help you identify the deployment in the Tadata dashboard or logs.
   * @example "My Customer API Proxy"
   */
  name?: string;

  /**
   * Optional configuration for handling authentication between the MCP and your API.
   * Controls which headers, query parameters, and other auth-related data are passed through.
   * @example { passHeaders: ['authorization', 'x-api-key'], passQueryParams: ['api_key'] }
   */
  authConfig?: {
    /**
     * List of HTTP headers that should be passed from requests to the MCP through to your API.
     * @default ['authorization', 'api-key', 'api_key', 'apikey', 'x-api-key', 'x-apikey']
     */
    passHeaders?: string[];
    /**
     * List of query parameters that should be passed from requests to the MCP through to your API.
     * @default ['api-key', 'api_key', 'apikey']
     */
    passQueryParams?: string[];
    /**
     * List of JSON body fields that should be extracted from requests to the MCP and passed to your API.
     * @default []
     */
    passJsonBodyParams?: string[];
    /**
     * List of form data fields that should be extracted from requests to the MCP and passed to your API.
     * @default []
     */
    passFormDataParams?: string[];
  };
}

/**
 * Represents the result of a successful Model Context Protocol (MCP) deployment.
 * This object contains details about the deployed MCP instance.
 *
 * @since 0.1.0
 */
export interface McpDeploymentResult {
  /**
   * The unique identifier for this MCP deployment.
   */
  id: string;

  /**
   * The URL at which the deployed MCP instance is accessible.
   */
  url: string;

  /**
   * The version of the OpenAPI specification used for this deployment.
   * This typically corresponds to the `version` field in your OpenAPI document's `info` object.
   */
  specVersion: string;

  /**
   * The date and time when this MCP instance was created.
   */
  createdAt: Date;
}
