/**
 * Entry point for the Tadata Node SDK public API.
 *
 * Only the symbols re-exported from this file should be considered stable. All
 * other internal modules are implementation details and may change without
 * notice.
 *
 * @since 0.1.0
 */
// Export the main SDK class and its options
export { TadataNodeSDK } from './core/sdk';
export type { TadataOptions } from './core/sdk';

// Logger interface (optional for consumers to type their own loggers)
export type { Logger } from './core/logger';

// OpenAPI helpers
export { OpenApiSource } from './openapi/openapi-source';

// Resources
export { McpResource } from './resources/mcp';

// Error classes
export { TadataSDKError, SpecInvalidError, AuthError, ApiError, NetworkError } from './errors';
