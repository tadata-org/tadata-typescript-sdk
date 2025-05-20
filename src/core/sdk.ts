import { createApiClient } from '../contract';
import { McpResource } from '../resources/mcp';
import { createDefaultLogger, Logger } from './logger';

/**
 * Options for initializing the Tadata Node SDK.
 * These settings configure the behavior of the SDK client.
 *
 * @since 0.1.0
 */
export interface TadataOptions {
  /**
   * Your Tadata API key. This is required for authentication.
   * You can obtain an API key from the Tadata dashboard.
   */
  apiKey: string;

  /**
   * Specifies whether to use the development mode (sandbox environment).
   * Set to `true` to use the sandbox for testing purposes.
   * @default false
   */
  dev?: boolean;

  /**
   * The API version to use for requests.
   * It's recommended to use a specific version for stability.
   * @default ApiVersion.LATEST
   */
  version?: '05-2025' | 'latest';
  /**
   * A custom logger instance that conforms to the {@link Logger} interface.
   * If not provided, a default console logger (`ConsoleLogger`) will be used.
   * This allows you to integrate SDK logging with your application's logging solution.
   * @default ConsoleLogger
   */
  logger?: Logger;
}

/**
 * The main class for interacting with the Tadata API.
 * This class provides access to various Tadata resources and functionalities.
 *
 * @since 0.1.0
 * @example
 * \`\`\`typescript
 * import { Tadata, ApiVersion } from '@tadata/node-sdk';
 * // Assumes pino is installed for custom logging, otherwise default logger is used.
 * // import pino from 'pino';
 *
 * const tadata = new Tadata({
 *   apiKey: process.env.TADATA_KEY!,
 *   dev: process.env.NODE_ENV !== 'production',
 *   version: ApiVersion.V_05_2025, // Optional: Defaults to ApiVersion.LATEST
 *   // logger: pino(),             // Optional: Provide a custom logger
 * });
 *
 * async function main() {
 *   // Example usage (assuming OpenApiSource and MCP deployment)
 *   // const source = await OpenApiSource.fromFile('./my-api-spec.json');
 *   // const deployment = await tadata.mcp.deploy({
 *   //   spec: source,
 *   //   specBaseUrl: 'https://api.example.com',
 *   //   name: 'My API Proxy'
 *   // });
 *   // console.log('Deployment URL:', deployment.url);
 * }
 *
 * main().catch(console.error);
 * \`\`\`
 */
export class Tadata {
  /**
   * Access to Model Context Protocol (MCP) functionalities.
   * Use this resource to deploy and manage your Model Context Protocol instances.
   * @readonly
   */
  public readonly mcp: McpResource;

  /**
   * Creates a new instance of the Tadata.
   *
   * @param options Configuration options for the SDK. See {@link TadataOptions}.
   */
  constructor(options: TadataOptions) {
    const logger = options.logger || createDefaultLogger();
    const isDev = options.dev || false;
    const baseUrl = isDev ? 'https://api.stage.tadata.com' : 'https://api.tadata.com';

    const client = createApiClient(options.apiKey, {
      baseUrl,
      version: options.version || 'latest',
      logger,
      isDev,
    });

    this.mcp = new McpResource(client.deployments, logger);
  }
}
