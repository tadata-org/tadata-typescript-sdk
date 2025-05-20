import { StatusCodes } from 'http-status-codes';
import * as nock from 'nock';
import { v4 as uuidv4 } from 'uuid';
import { OpenApiSource, SpecInvalidError, Tadata } from '../../src';
import { ErrorCode } from '../../src/http/schemas';
import { createErrorResponse, createSuccessResponse } from '../utils/response-helpers';

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

const BASE_URL = 'https://api.tadata.com';

// Force nock to use the same URL construction that axios uses
// This ensures that the interceptors match the actual requests
nock.enableNetConnect('127.0.0.1'); // Allow localhost connections for CI/CD if needed

describe('Deployments Integration Test (Nock)', () => {
  const sdk = new Tadata({
    apiKey: TEST_API_KEY,
  });

  const invalidSdk = new Tadata({
    apiKey: INVALID_API_KEY,
  });

  beforeAll(() => {
    // Strictly disable all network connections except those we explicitly mock
    nock.disableNetConnect();
    // Optionally allow localhost for debugging
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(() => {
    nock.cleanAll();

    // Ensure no pending mocks
    if (!nock.isDone()) {
      console.error('Not all nock interceptors were used!');
      nock.cleanAll();
    }
  });

  afterAll(() => {
    nock.enableNetConnect();
    nock.restore();
  });

  describe('when deploying an OpenAPI spec', () => {
    it('should successfully deploy an MCP server', async () => {
      const mockDeploymentId = uuidv4();
      const mockCreatedAt = new Date().toISOString();
      const serviceNameInMockedResponse = 'Service Name From Mocked Server Response';

      const mockServerResponseData = {
        updated: true,
        deployment: {
          id: mockDeploymentId,
          name: serviceNameInMockedResponse,
          updated: true,
          createdAt: mockCreatedAt,
          createdBy: 'test-user',
          updatedBy: 'test-user',
          mcpServerId: uuidv4(),
          openAPISpecHash: 'hash123',
          mcpSpecHash: 'hash456',
          status: 'active',
        },
      };
      const successResponseEnvelope = createSuccessResponse(
        StatusCodes.CREATED,
        mockServerResponseData
      );

      // Mock the POST request to the deployments endpoint
      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query(true) // Match any query params
        .reply(function (uri) {
          // Verify apiKey is in the query as expected
          const url = new URL(`${BASE_URL}${uri}`);
          const apiKey = url.searchParams.get('apiKey');

          if (apiKey !== TEST_API_KEY) {
            return [
              401,
              createErrorResponse({
                status: 401,
                code: ErrorCode.AUTH_ERROR,
                message: 'Invalid API key from mock',
              }),
            ];
          }

          return [StatusCodes.CREATED, successResponseEnvelope];
        });

      const source = OpenApiSource.fromObject(validOpenApiSpec);
      const requestedDeploymentName = 'Test API Service from Nock';

      const result = await sdk.mcp.deploy({
        spec: source,
        name: requestedDeploymentName,
        apiBaseUrl: 'https://example.com/api',
      });

      // Validate expected response structure
      expect(result).toBeDefined();
      expect(result.id).toBe(mockDeploymentId);
      expect(result.updated).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(Date.now() - result.createdAt.getTime()).toBeLessThan(60000);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(result.id)).toBe(true);

      expect(scope.isDone()).toBe(true);
    });

    it('should throw SpecInvalidError for invalid OpenAPI specs before making API call', () => {
      // This test doesn't need scope since it's testing client-side validation
      expect(() => OpenApiSource.fromObject(invalidOpenApiSpec)).toThrow(SpecInvalidError);
    });

    it('should throw SpecInvalidError for backend validation failures', async () => {
      const originalBackendErrorMessage = 'Invalid OpenAPI specification from backend';
      const mockErrorResponseBody = {
        status: StatusCodes.BAD_REQUEST,
        code: ErrorCode.VALIDATION_ERROR,
        message: originalBackendErrorMessage,
        errors: [
          {
            field: 'openapiSpec.paths',
            message: 'Must contain at least one path',
            source: 'body',
          },
        ],
      };
      const mockFullErrorResponse = createErrorResponse(mockErrorResponseBody);

      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query(true) // Match any query string
        .reply(StatusCodes.BAD_REQUEST, mockFullErrorResponse);

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        sdk.mcp.deploy({
          spec: source,
          name: 'Test API for Backend Validation Error',
        })
      ).rejects.toThrowErrorMatchingSnapshot();

      expect(scope.isDone()).toBe(true);
    });

    it('should throw SpecInvalidError for malformed request body', async () => {
      const malformedRequestErrorMessage = 'Validation error';
      const mockErrorResponseBody = {
        status: StatusCodes.BAD_REQUEST,
        code: ErrorCode.VALIDATION_ERROR,
        message: malformedRequestErrorMessage,
        errors: [
          {
            field: 'name',
            message: 'Expected string, received number',
            source: 'body',
          },
        ],
      };
      const mockFullErrorResponse = createErrorResponse(mockErrorResponseBody);

      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query(true)
        .reply(StatusCodes.BAD_REQUEST, mockFullErrorResponse);

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        sdk.mcp.deploy({
          spec: source,
          name: 12345 as unknown as string, // Force invalid type for test
        })
      ).rejects.toThrowErrorMatchingSnapshot();

      expect(scope.isDone()).toBe(true);
    });

    it('should throw AuthError when using invalid API key', async () => {
      const mockErrorResponse = createErrorResponse({
        status: StatusCodes.UNAUTHORIZED,
        code: ErrorCode.AUTH_ERROR,
        message: 'Invalid API key from mock',
      });

      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query(true)
        .reply(StatusCodes.UNAUTHORIZED, mockErrorResponse);

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        invalidSdk.mcp.deploy({
          spec: source,
          name: 'Auth Test Service (Nock)',
        })
      ).rejects.toThrowErrorMatchingSnapshot();

      expect(scope.isDone()).toBe(true);
    });

    it('should throw ApiError for server errors (e.g., 500)', async () => {
      const serverErrorMessage = 'Internal mock server error occurred';
      const mockErrorResponse = createErrorResponse({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        code: ErrorCode.INTERNAL_ERROR,
        message: serverErrorMessage,
      });

      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query(true)
        .reply(StatusCodes.INTERNAL_SERVER_ERROR, mockErrorResponse);

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        sdk.mcp.deploy({
          spec: source,
          name: 'Server Error Test (Nock)',
        })
      ).rejects.toThrowErrorMatchingSnapshot();

      expect(scope.isDone()).toBe(true);
    });

    it('should throw ApiError for not found errors (404)', async () => {
      const notFoundMessage = 'Deployment not found';
      const mockErrorResponse = createErrorResponse({
        status: StatusCodes.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: notFoundMessage,
        errors: [{ field: 'id', message: notFoundMessage, source: 'service' }],
      });

      const scope = nock(BASE_URL)
        .post('/api/deployments/from-openapi')
        .query(true)
        .reply(StatusCodes.NOT_FOUND, mockErrorResponse);

      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        sdk.mcp.deploy({
          spec: source,
          name: 'Not Found Test (Nock)',
        })
      ).rejects.toThrowErrorMatchingSnapshot();

      expect(scope.isDone()).toBe(true);
    });
  });
});
