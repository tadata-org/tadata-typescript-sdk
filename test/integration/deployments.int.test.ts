import { StatusCodes } from 'http-status-codes';
import * as nock from 'nock';
import {
  ApiError,
  AuthError,
  ErrorCode,
  OpenApiSource,
  SpecInvalidError,
  TadataNodeSDK,
  McpDeploymentResult,
} from '../../src';
import { createErrorResponse, createSuccessResponse } from '../utils';

const validOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {},
};

const invalidOpenApiSpec = {
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {},
};

const TEST_API_KEY = 'test_api_key';
const INVALID_API_KEY = 'invalid_api_key';

const BASE_URL = 'https://api.stage.tadata.com';

const successResponseData = {
  updated: true,
  deployment: {
    id: 'deploy_123456',
    name: 'Test API',
    url: '/placeholder/url',
  },
};

const successResponseEnvelope = createSuccessResponse(StatusCodes.OK, successResponseData);

describe('Deployments Integration Test', () => {
  const sdk = new TadataNodeSDK({
    apiKey: TEST_API_KEY,
    dev: true,
  });

  const invalidSdk = new TadataNodeSDK({
    apiKey: INVALID_API_KEY,
    dev: true,
  });

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
    nock.restore();
  });

  describe('when deploying an OpenAPI spec', () => {
    it('should successfully deploy an MCP server', async () => {
      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query({ apiKey: TEST_API_KEY })
        .reply(StatusCodes.OK, successResponseEnvelope);

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      const result = await sdk.mcp.deploy({
        spec: source,
        name: 'Test API',
        specBaseUrl: 'https://example.com/api',
      });

      expect(result).toStrictEqual<McpDeploymentResult>({
        id: 'deploy_123456',
        url: '/placeholder/url',
        specVersion: result.specVersion,
        createdAt: expect.any(Date),
      });

      expect(scope.isDone()).toBe(true);
    });

    it('should throw SpecInvalidError for invalid OpenAPI specs before making API call', async () => {
      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query({ apiKey: TEST_API_KEY })
        .reply(
          StatusCodes.BAD_REQUEST,
          createErrorResponse({
            status: StatusCodes.BAD_REQUEST,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid OpenAPI specification',
            errors: [
              {
                field: 'openapiSpec.openapi',
                message: 'Required field missing',
                source: 'body',
              },
            ],
          })
        );

      expect(() => OpenApiSource.fromObject(invalidOpenApiSpec)).toThrow(SpecInvalidError);

      expect(scope.isDone()).toBe(false);
    });

    it('should throw SpecInvalidError for backend validation failures', async () => {
      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query({ apiKey: TEST_API_KEY })
        .reply(
          StatusCodes.BAD_REQUEST,
          createErrorResponse({
            status: StatusCodes.BAD_REQUEST,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid OpenAPI specification',
            errors: [
              {
                field: 'openapiSpec.paths',
                message: 'Must contain at least one path',
                source: 'body',
              },
            ],
          })
        );

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(() =>
        sdk.mcp.deploy({
          spec: source,
          name: 'Test API',
          specBaseUrl: 'https://example.com/api',
        })
      ).rejects.toThrow(SpecInvalidError);

      expect(scope.isDone()).toBe(true);
    });

    it('should throw AuthError when using invalid API key', async () => {
      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query({ apiKey: INVALID_API_KEY })
        .reply(
          StatusCodes.UNAUTHORIZED,
          createErrorResponse({
            status: StatusCodes.UNAUTHORIZED,
            code: ErrorCode.AUTH_ERROR,
            message: 'Invalid API key',
          })
        );

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(() =>
        invalidSdk.mcp.deploy({
          spec: source,
          name: 'Test API',
          specBaseUrl: 'https://example.com/api',
        })
      ).rejects.toThrow(AuthError);

      expect(scope.isDone()).toBe(true);
    });

    it('should throw ApiError for server errors', async () => {
      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query({ apiKey: TEST_API_KEY })
        .reply(
          StatusCodes.INTERNAL_SERVER_ERROR,
          createErrorResponse({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Internal server error occurred',
          })
        );

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(() =>
        sdk.mcp.deploy({
          spec: source,
          name: 'Test API',
          specBaseUrl: 'https://example.com/api',
        })
      ).rejects.toThrow(ApiError);

      expect(scope.isDone()).toBe(true);
    });
  });
});
