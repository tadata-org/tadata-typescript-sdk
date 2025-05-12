import nock from 'nock';
import { TadataNodeSDK } from '../../src/tadata';
import { DeploymentResponseMin } from '../../src/schemas';

// Mock API base URL
const API_BASE_URL = 'https://sandbox.api.tadata.com';
const API_KEY = 'sk_test_123';

// Sample deployment response
const sampleDeployment: DeploymentResponseMin = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'test-deployment',
  status: 'active',
  createdAt: new Date(),
};

// Simple test spec
const testSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {
    '/test': {
      get: {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
  },
};

describe('Tadata Node SDK Integration', () => {
  // Create an SDK instance for testing
  const tadata = new TadataNodeSDK({
    apiKey: API_KEY,
    baseUrl: API_BASE_URL,
    dev: true,
    retries: 0, // Disable retries for testing
  });

  beforeAll(() => {
    // Disable external HTTP requests
    nock.disableNetConnect();
  });

  afterAll(() => {
    // Re-enable external HTTP requests
    nock.enableNetConnect();
    // Clean up any pending mocks
    nock.cleanAll();
  });

  afterEach(() => {
    // Ensure all nock interceptors are used
    expect(nock.isDone()).toBeTruthy();
    // Clean up after each test
    nock.cleanAll();
  });

  describe('MCP.deploy', () => {
    test('should successfully deploy an MCP server with raw spec', async () => {
      // Mock the API response
      nock(API_BASE_URL)
        .post('/v1/mcp', body => {
          // Verify request body contains the spec and options
          return (
            body.spec !== undefined &&
            body.baseUrl === 'https://example.com' &&
            body.name === 'test-deployment' &&
            body.dev === true // Should include dev flag from SDK initialization
          );
        })
        .reply(201, sampleDeployment);

      // Call the SDK method (using instance created at the top)
      const result = await tadata.mcp.deploy(
        { spec: testSpec },
        {
          baseUrl: 'https://example.com',
          name: 'test-deployment',
        }
      );

      // Verify the result
      expect(result).toEqual(sampleDeployment);
    });

    test('should handle validation errors from the API', async () => {
      // Mock the API validation error response
      nock(API_BASE_URL)
        .post('/v1/mcp')
        .reply(422, {
          code: 'TADATA/INVALID_SPEC',
          message: 'Invalid OpenAPI spec',
          details: { errors: ['Missing required field: paths'] },
        });

      // Call the method and expect it to throw
      await expect(
        tadata.mcp.deploy({ spec: { openapi: '3.0.0' } }, { baseUrl: 'https://example.com' })
      ).rejects.toThrow();
    });

    test('should handle duplicate spec errors (hash exists)', async () => {
      // Mock the API hash exists error response
      nock(API_BASE_URL).post('/v1/mcp').reply(409, {
        code: 'TADATA/HASH_EXISTS',
        message: 'Identical spec already deployed',
      });

      // Call the method and expect it to throw
      await expect(
        tadata.mcp.deploy({ spec: testSpec }, { baseUrl: 'https://example.com' })
      ).rejects.toThrow();
    });

    test('should handle network errors', async () => {
      // Mock a network error
      nock(API_BASE_URL).post('/v1/mcp').replyWithError('Network error');

      // Call the method and expect it to throw
      await expect(
        tadata.mcp.deploy({ spec: testSpec }, { baseUrl: 'https://example.com' })
      ).rejects.toThrow();
    });
  });

  describe('MCP.retrieve', () => {
    test('should successfully retrieve an MCP server', async () => {
      // Mock the API response
      nock(API_BASE_URL)
        .get('/v1/mcp/123e4567-e89b-12d3-a456-426614174000')
        .reply(200, sampleDeployment);

      // Call the SDK method
      const result = await tadata.mcp.retrieve('123e4567-e89b-12d3-a456-426614174000');

      // Verify the result
      expect(result).toEqual(sampleDeployment);
    });

    test('should handle not found errors', async () => {
      // Mock the API not found error response
      nock(API_BASE_URL).get('/v1/mcp/non-existent-id').reply(404, {
        code: 'TADATA/NOT_FOUND',
        message: 'MCP server not found',
      });

      // Call the method and expect it to throw
      await expect(tadata.mcp.retrieve('non-existent-id')).rejects.toThrow();
    });
  });

  describe('MCP.list', () => {
    test('should successfully list MCP servers', async () => {
      // Mock the API response
      nock(API_BASE_URL).get('/v1/mcp').reply(200, [sampleDeployment]);

      // Call the SDK method
      const result = await tadata.mcp.list();

      // Verify the result
      expect(result).toEqual([sampleDeployment]);
      expect(result.length).toBe(1);
    });

    test('should handle empty list', async () => {
      // Mock the API empty list response
      nock(API_BASE_URL).get('/v1/mcp').reply(200, []);

      // Call the SDK method
      const result = await tadata.mcp.list();

      // Verify the result
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    test('should handle authorization errors', async () => {
      // Mock the API auth error response
      nock(API_BASE_URL).get('/v1/mcp').reply(401, {
        code: 'TADATA/AUTH',
        message: 'Invalid API key',
      });

      // Call the method and expect it to throw
      await expect(tadata.mcp.list()).rejects.toThrow();
    });
  });

  describe('SDK Initialization', () => {
    test('should support different initialization options', () => {
      // Production mode
      const prodSdk = new TadataNodeSDK({
        apiKey: 'sk_live_123',
        dev: false,
      });

      // With custom base URL
      const customUrlSdk = new TadataNodeSDK({
        apiKey: 'sk_test_123',
        baseUrl: 'https://custom-api.example.com',
      });

      // With custom retries
      const retriesSdk = new TadataNodeSDK({
        apiKey: 'sk_test_123',
        retries: 5,
      });

      // Verify SDK instances were created
      // (Since we can't directly test private properties,
      // we just check that instances were created successfully)
      expect(prodSdk).toBeInstanceOf(TadataNodeSDK);
      expect(customUrlSdk).toBeInstanceOf(TadataNodeSDK);
      expect(retriesSdk).toBeInstanceOf(TadataNodeSDK);
    });
  });
});
