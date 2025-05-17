import { z } from 'zod';
import { createApiResponseSchema } from './response.schema';

export const DeploymentResponseMinSchema = z.object({
  id: z.string(),
  createdAt: z
    .union([z.string(), z.date()])
    .transform(val => (val instanceof Date ? val.toISOString() : val))
    .optional(),
  createdBy: z.string(),
  updatedBy: z.string(),
  mcpServerId: z.string(),
  openAPISpecHash: z.string(),
  mcpSpecHash: z.string(),
  status: z.string(),
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

export const UpsertDeploymentBodySchema = z.object({
  openApiSpec: OpenApi3Schema,
  name: z.string().optional(),
  baseUrl: z.string().optional(),
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
