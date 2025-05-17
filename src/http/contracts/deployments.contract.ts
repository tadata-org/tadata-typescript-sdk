import { initContract } from '@ts-rest/core';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import {
  createApiResponseSchema,
  UpsertDeploymentBodySchema,
  UpsertDeploymentResponseSchema,
} from '../schemas';

const contract = initContract();

const ErrorResponse400 = createApiResponseSchema(z.null());
const ErrorResponseNotFound = createApiResponseSchema(z.null());
const ErrorResponse500 = createApiResponseSchema(z.null());
const ErrorResponseUnauthorized = createApiResponseSchema(z.null());

export const deploymentsContract = contract.router({
  upsertFromOpenApi: {
    method: 'POST',
    path: '/api/deployments/from-openapi',
    body: UpsertDeploymentBodySchema,
    responses: {
      [StatusCodes.CREATED]: UpsertDeploymentResponseSchema, // Created with response envelope
      [StatusCodes.BAD_REQUEST]: ErrorResponse400, // Validation error
      [StatusCodes.NOT_FOUND]: ErrorResponseNotFound, // Not found error
      [StatusCodes.INTERNAL_SERVER_ERROR]: ErrorResponse500, // Internal server error
      [StatusCodes.UNAUTHORIZED]: ErrorResponseUnauthorized, // Auth error handled by middleware
    },
    summary: 'Upsert a deployment from an OpenAPI specification',
  },
});
