import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { DeploymentResponseMinSchema, UpsertMCPServerFromOpenAPISchema } from '../schemas';

/**
 * Contract for the MCP API
 */
const c = initContract();

export const mcpContract = c.router({
  create: {
    method: 'POST',
    path: '/v1/mcp',
    responses: {
      201: DeploymentResponseMinSchema,
      400: z.object({ code: z.string(), message: z.string() }),
      401: z.object({ code: z.string(), message: z.string() }),
      409: z.object({ code: z.string(), message: z.string() }),
      422: z.object({ code: z.string(), message: z.string() }),
    },
    body: UpsertMCPServerFromOpenAPISchema,
    summary: 'Create an MCP server from an OpenAPI spec',
  },
  retrieve: {
    method: 'GET',
    path: '/v1/mcp/:id',
    responses: {
      200: DeploymentResponseMinSchema,
      401: z.object({ code: z.string(), message: z.string() }),
      404: z.object({ code: z.string(), message: z.string() }),
    },
    pathParams: z.object({
      id: z.string(),
    }),
    summary: 'Retrieve an MCP server by ID',
  },
  list: {
    method: 'GET',
    path: '/v1/mcp',
    responses: {
      200: z.array(DeploymentResponseMinSchema),
      401: z.object({ code: z.string(), message: z.string() }),
    },
    query: z.object({}).optional(),
    summary: 'List all MCP servers',
  },
});
