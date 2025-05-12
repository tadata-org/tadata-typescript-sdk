import { createApiClient } from '../contract';
import { McpResource } from '../mcp';
import { Logger, createDefaultLogger } from './logger';

/**
 * Options for initializing the Tadata Node SDK
 */
export interface TadataOptions {
  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * Whether to use development mode (sandbox)
   * @default false
   */
  dev?: boolean;

  /**
   * API version to use
   * @default latest
   */
  version?: string;

  /**
   * Custom logger instance
   * @default ConsoleLogger
   */
  logger?: Logger;

  /**
   * Custom base URL for the API
   * @default https://api.tadata.com
   */
  baseUrl?: string;
}

/**
 * Main class for the Tadata Node SDK
 *
 * @example
 * ```typescript
 * import { TadataNodeSDK, OpenApiSource } from '@tadata/node-sdk';
 *
 * const tadata = new TadataNodeSDK({
 *   apiKey: process.env.TADATA_KEY!,
 *   dev: process.env.NODE_ENV !== 'production',
 *   version: '10-10-2024',
 *   logger: pino(),          // optional
 * });
 *
 * // Load from JSON file
 * const source = await OpenApiSource.fromFile('./acme-openapi.json');
 * // Or from JSON string or object
 * // const source = OpenApiSource.fromJson(jsonString);
 * // const source = OpenApiSource.fromObject(specObject);
 *
 * await tadata.mcp.deploy({
 *   spec: source,
 *   specBaseUrl: 'https://acme.com/api',
 * });
 * ```
 */
export class TadataNodeSDK {
  /**
   * MCP resource for deploying and managing Multi-Channel Proxies
   */
  readonly mcp: McpResource;

  /**
   * Create a new Tadata Node SDK instance
   */
  constructor(options: TadataOptions) {
    // Initialize dependencies
    const logger = options.logger || createDefaultLogger();
    const isDev = options.dev || false;

    // Create API client
    const client = createApiClient(options.apiKey, {
      baseUrl: options.baseUrl,
      version: options.version,
      logger,
    });

    // Initialize resources
    this.mcp = new McpResource(client, logger, isDev);
  }
}
