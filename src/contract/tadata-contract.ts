
// Schema definitions
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const McpDeploymentSchema = z.object({
  id: z.string(),
  url: z.string(),
  specVersion: z.string(),
  createdAt: z.string().transform(str => new Date(str)),
});

const c = initContract();

// API contract
export const tadataContract = c.router({
  // MCP endpoints
  mcpDeploy: {
    method: 'POST',
    path: '/v1/mcp',
    responses: {
      201: McpDeploymentSchema,
      400: z.object({ message: z.string(), details: z.any().optional() }),
      401: z.object({ message: z.string() }),
      403: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    body: z.object({
      spec: z.any(),
      baseUrl: z.string(),
      name: z.string().optional(),
      dev: z.boolean().optional(),
    }),
    summary: 'Deploy an MCP server from an OpenAPI specification',
  },
});

// Type exports
export type McpDeploymentResult = z.infer<typeof McpDeploymentSchema>;
export type TadataContract = typeof tadataContract;
