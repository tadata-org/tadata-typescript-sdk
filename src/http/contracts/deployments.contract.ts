import { initContract } from '@ts-rest/core';
import { HttpStatusCode } from 'axios';
import { z } from 'zod';
import {
  createApiResponseSchema,
  UpsertDeploymentBodySchema,
  UpsertDeploymentResponseSchema,
} from '../schemas';

const contract = initContract();

const ErrorResponseBadRequest = createApiResponseSchema(z.null());
const ErrorResponseUnauthorized = createApiResponseSchema(z.null());
const ErrorResponseForbidden = createApiResponseSchema(z.null());
const ErrorResponseInternalServerError = createApiResponseSchema(z.null());

export const deploymentsContract = contract.router({
  upsertFromOpenApi: {
    method: 'POST',
    path: '/api/deployments/from-openapi',
    body: UpsertDeploymentBodySchema,
    responses: {
      [HttpStatusCode.Ok]: UpsertDeploymentResponseSchema, // Success with response envelope
      [HttpStatusCode.Created]: UpsertDeploymentResponseSchema, // Created with response envelope
      [HttpStatusCode.BadRequest]: ErrorResponseBadRequest, // Validation error
      [HttpStatusCode.Unauthorized]: ErrorResponseUnauthorized, // Auth error
      [HttpStatusCode.Forbidden]: ErrorResponseForbidden, // Permission error
      [HttpStatusCode.InternalServerError]: ErrorResponseInternalServerError, // Internal server error
    },
    summary: 'Upsert a deployment from an OpenAPI specification',
  },
});
