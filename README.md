# Tadata Node SDK

A Node.js SDK for deploying Model Context Protocol (MCP) servers with your OpenAPI specifications.

## Installation

```bash
npm install @tadata-js/sdk
# or
yarn add @tadata-js/sdk
# or
pnpm add @tadata-js/sdk
```

## Quickstart

Deploy a Model Context Protocol (MCP) server with your OpenAPI specification:

```typescript
import { Tadata, OpenApiSource, ApiVersion } from '@tadata-js/sdk';

// Initialize the SDK
const tadata = new Tadata({
  apiKey: process.env.TADATA_KEY!,
  version: ApiVersion.V_05_2025,  // Optional: specify API version
  logger: pino(),         // Optional: use custom logger
});

// Create an OpenAPI source from JSON file
const source = await OpenApiSource.fromFile('./acme-openapi.json');

// Deploy the MCP server
const deployment = await tadata.mcp.deploy({
  spec: source,
  apiBaseUrl: 'https://acme.com/api',
  name: 'Acme API',  // Optional
  
  // Optional: Configure authentication handling
  authConfig: {
    passHeaders: ['authorization'],  // Specify which headers to pass through. Defaults to ['authorization', 'api-key', 'api_key', 'apikey', 'x-api-key', 'x-apikey']
    passQueryParams: ['api_key'],  // Specify which query parameters to pass through. Defaults to ['api-key', 'api_key', 'apikey']
  },
});

console.log(`Deployed Model Context Protocol (MCP) server: ${deployment.url}`);
```

## OpenAPI Source Formats

The SDK supports multiple ways to provide your OpenAPI specification:

```typescript
// From a JSON file
const source = await OpenApiSource.fromFile('./openapi.json');

// From a JSON string
const source = OpenApiSource.fromJson(jsonString);

// From a JavaScript object
const source = OpenApiSource.fromObject({
  openapi: '3.0.0',
  info: { title: 'Example API', version: '1.0.0' },
  paths: { /* ... */ }
});
```

## Error Handling

The SDK provides specific error classes for better error handling:

```typescript
import { SpecInvalidError, AuthError, ApiError, NetworkError } from '@tadata-js/sdk';

try {
  await tadata.mcp.deploy({ /* ... */ });
} catch (error) {
  if (error instanceof SpecInvalidError) {
    console.error('Invalid OpenAPI spec:', error.message, error.details);
  } else if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ApiError) {
    console.error('API error:', error.message, error.statusCode);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Custom Logging

You can provide your own logger implementation:

```typescript
import pino from 'pino';
import { Tadata, Logger } from '@tadata-js/sdk';

// Use pino
const pinoLogger = pino();

const tadata = new Tadata({
  apiKey: 'your-api-key',
  logger: pinoLogger,
});

// Or create a custom logger
class CustomLogger implements Logger {
  debug(msg: string, ...meta: unknown[]): void {
    // Your implementation
  }
  info(msg: string, ...meta: unknown[]): void {
    // Your implementation
  }
  warn(msg: string, ...meta: unknown[]): void {
    // Your implementation
  }
  error(msg: string, ...meta: unknown[]): void {
    // Your implementation
  }
}
```

## License

MIT 