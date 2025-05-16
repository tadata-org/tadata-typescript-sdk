import { z } from 'zod';
import { createApiResponseSchema } from './response.schema';

export const DeploymentResponseMinSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(), // Added from existing McpDeploymentSchema
  // specVersion: z.string(), // Consider if this is needed for 'Min' schema
  // createdAt: z.date(), // Consider if this is needed for 'Min' schema
});

// Define a Zod schema for OpenAPI 3.0 with basic validation
export const OpenApi3Schema = z
  .object({
    openapi: z.string().startsWith('3.'),
    info: z
      .object({
        title: z.string(),
        version: z.string(),
      })
      .passthrough(),
    paths: z.record(z.string(), z.unknown()),
  })
  .passthrough();

// Assuming UpsertMCPServerFromOpenAPISchema is defined elsewhere
// For now, let's define a placeholder based on the description
export const UpsertDeploymentBodySchema = z.object({
  // Updated to use the OpenApi3Schema
  openapiSpec: OpenApi3Schema,
  serviceName: z.string().optional(), // Corresponds to 'name' in mcpDeploy body
  // 'version' from the plan doesn't directly map to mcpDeploy, adding as optional
  version: z.string().optional(),
  // 'baseUrl' from mcpDeploy body doesn't seem to be in the plan's subset, omitting for now
  // 'dev' from mcpDeploy body doesn't seem to be in the plan's subset, omitting for now
});

// Original unwrapped response schema
const UpsertDeploymentResponseDataSchema = z.object({
  updated: z.boolean(),
  deployment: DeploymentResponseMinSchema,
});

// API Response envelope wrapped schema
export const UpsertDeploymentResponseSchema = createApiResponseSchema(
  UpsertDeploymentResponseDataSchema
);
