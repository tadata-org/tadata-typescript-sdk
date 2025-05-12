# Tadata Node SDK

A Node.js SDK for deploying MCP (Multi-Channel Proxy) servers with your OpenAPI specifications.

## Installation

```bash
npm install @tadata/node-sdk
# or
yarn add @tadata/node-sdk
# or
pnpm add @tadata/node-sdk
```

## Quickstart

Deploy an MCP server with your OpenAPI specification:

```typescript
import { TadataNodeSDK, OpenApiSource } from '@tadata/node-sdk';

// Initialize the SDK
const tadata = new TadataNodeSDK({
  apiKey: process.env.TADATA_KEY!,
  dev: process.env.NODE_ENV !== 'production',
  version: '10-10-2024',  // Optional: specify API version
  logger: pino(),         // Optional: use custom logger
});

// Create an OpenAPI source from JSON file
const source = await OpenApiSource.fromFile('./acme-openapi.json');

// Deploy the MCP server
const deployment = await tadata.mcp.deploy({
  spec: source,
  specBaseUrl: 'https://acme.com/api',
  name: 'Acme API',  // Optional
});

console.log(`Deployed MCP server: ${deployment.url}`);
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
import { SpecInvalidError, AuthError, ApiError, NetworkError } from '@tadata/node-sdk';

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
import { TadataNodeSDK, Logger } from '@tadata/node-sdk';

// Use pino
const pinoLogger = pino();

const tadata = new TadataNodeSDK({
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