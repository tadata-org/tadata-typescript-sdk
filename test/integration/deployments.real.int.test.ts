// import * as nock from 'nock'; // Removed nock
import { v4 as uuidv4 } from 'uuid';
import { ApiError, AuthError, OpenApiSource, SpecInvalidError, TadataNodeSDK } from '../../src';

// More realistic OpenAPI spec with a path
const validOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {
    '/test': {
      get: {
        summary: 'Test endpoint',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
  },
};

const invalidOpenApiSpec = {
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {},
};

// Use your real API key here (this is an example, replace with your actual key)
const REAL_API_KEY = 'fc2b51fef0f646aabe533f895a58ec64a61bdb77fbd81693f908339d2312cb7e';
const INVALID_API_KEY = 'invalid_api_key';

// Can remove this constant since it's not needed anymore
// const MOCKED_DEPLOYMENT_NAME = 'Mocked Test API Service';

describe('Deployments Integration Test (Real Backend)', () => {
  // Extend timeout for real API calls
  jest.setTimeout(60000);

  const sdk = new TadataNodeSDK({
    apiKey: REAL_API_KEY,
  });

  const invalidSdk = new TadataNodeSDK({
    apiKey: INVALID_API_KEY,
  });

  // Removed nock related beforeAll, afterEach, afterAll

  // First test to verify backend connection is working
  it('should verify backend is running by rejecting invalid credentials', async () => {
    const source = OpenApiSource.fromObject(validOpenApiSpec);

    await expect(
      invalidSdk.mcp.deploy({
        spec: source,
        name: 'Auth Test',
      })
    ).rejects.toThrow(AuthError);
  });

  describe('when deploying an OpenAPI spec', () => {
    it('should successfully deploy an MCP server', async () => {
      const source = OpenApiSource.fromObject(validOpenApiSpec);

      const result = await sdk.mcp.deploy({
        spec: source,
        name: `Test API Service ${uuidv4()}`,
        specBaseUrl: 'https://example.com/api',
      });

      // Validate the response structure
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.specVersion).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(result.id)).toBe(true);
    });

    it('should throw SpecInvalidError for invalid OpenAPI specs before making API call', () => {
      expect(() => OpenApiSource.fromObject(invalidOpenApiSpec)).toThrow(SpecInvalidError);
    });

    it('should throw AuthError when using incorrect API key', async () => {
      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        invalidSdk.mcp.deploy({
          spec: source,
          name: 'Auth Test Service (Real Backend)',
        })
      ).rejects.toThrow(AuthError);
    });

    it('should throw ApiError for backend validation failures', async () => {
      // Using a spec that should trigger validation failures on the backend
      const invalidSource = OpenApiSource.fromObject({
        openapi: '3.0.0',
        info: { title: 'Invalid API Spec', version: '1.0.0' },
        // Empty paths object with no endpoints
        paths: {},
      });

      await expect(
        sdk.mcp.deploy({
          spec: invalidSource,
          name: 'Backend Validation Error Test',
        })
      ).rejects.toThrow(ApiError);
    });

    it('should throw SpecInvalidError for malformed request body', async () => {
      const source = OpenApiSource.fromObject(validOpenApiSpec);

      await expect(
        sdk.mcp.deploy({
          spec: source,
          // @ts-expect-error - intentionally passing wrong type for testing
          name: 12345,
        })
      ).rejects.toThrow(SpecInvalidError);
    });

    it('should throw ApiError for not found errors (404)', async () => {
      const source = OpenApiSource.fromObject(validOpenApiSpec);

      // To trigger a 404, we need to hit a non-existent endpoint
      // We'll do this by modifying the request to include a specific ID that doesn't exist
      await expect(
        sdk.mcp.deploy({
          spec: source,
          name: 'Not Found Test',
          // @ts-expect-error - intentionally passing a property that doesn't exist to trigger 404
          id: 'non-existent-id',
        })
      ).rejects.toThrow(ApiError);
    });

    // Keep this test skipped as it's hard to reliably trigger a 500 error
    it.skip('should throw ApiError for server errors (e.g., 500)', async () => {
      // This test is skipped because it's difficult to reliably trigger a 500 error
      // on the real backend without specific server conditions
    });
  });
});
