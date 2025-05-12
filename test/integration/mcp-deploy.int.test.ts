import nock from 'nock';
import {
  TadataNodeSDK,
  OpenApiSource,
  SpecInvalidError,
  AuthError,
  ApiError,
  NetworkError,
} from '../../src';

// Mock OpenAPI spec
const mockOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {},
};

// Success response from the API
const successResponse = {
  id: 'mcp_123456',
  url: 'https://mcp.tadata.com/mcp_123456',
  specVersion: '1.0.0',
  createdAt: new Date().toISOString(),
};

describe('MCP Deploy Integration', () => {
  // Set up the SDK instance for testing
  const sdk = new TadataNodeSDK({
    apiKey: 'test_api_key',
    baseUrl: 'https://api.tadata.com',
    dev: true,
  });

  beforeEach(() => {
    // Clear any existing nock interceptors
    nock.cleanAll();
  });

  afterAll(() => {
    // Ensure no interceptors remain after tests
    nock.restore();
  });

  it('should successfully deploy an MCP server', async () => {
    // Set up the mock API response
    nock('https://api.tadata.com')
      .post('/v1/mcp', {
        spec: mockOpenApiSpec,
        baseUrl: 'https://example.com/api',
        name: 'Test API',
        dev: true,
      })
      .reply(201, successResponse);

    // Create OpenApiSource from the mock spec
    const source = OpenApiSource.fromObject(mockOpenApiSpec);

    // Call the deploy method
    const result = await sdk.mcp.deploy({
      spec: source,
      specBaseUrl: 'https://example.com/api',
      name: 'Test API',
    });

    // Verify the result
    expect(result).toEqual({
      id: successResponse.id,
      url: successResponse.url,
      specVersion: successResponse.specVersion,
      createdAt: successResponse.createdAt,
    });
  });

  it('should throw SpecInvalidError for invalid spec', async () => {
    // Set up the mock API response for a 400 error
    nock('https://api.tadata.com')
      .post('/v1/mcp')
      .reply(400, {
        message: 'Invalid OpenAPI specification',
        details: { errors: ['Invalid format'] },
      });

    // Create OpenApiSource from the mock spec
    const source = OpenApiSource.fromObject(mockOpenApiSpec);

    // Call the deploy method and expect it to throw
    await expect(
      sdk.mcp.deploy({
        spec: source,
        specBaseUrl: 'https://example.com/api',
      })
    ).rejects.toThrow(SpecInvalidError);
  });

  it('should throw AuthError for authentication failure', async () => {
    // Set up the mock API response for a 401 error
    nock('https://api.tadata.com').post('/v1/mcp').reply(401, {
      message: 'Invalid API key',
    });

    // Create OpenApiSource from the mock spec
    const source = OpenApiSource.fromObject(mockOpenApiSpec);

    // Call the deploy method and expect it to throw
    await expect(
      sdk.mcp.deploy({
        spec: source,
        specBaseUrl: 'https://example.com/api',
      })
    ).rejects.toThrow(AuthError);
  });

  it('should throw ApiError for server error', async () => {
    // Set up the mock API response for a 500 error
    nock('https://api.tadata.com').post('/v1/mcp').reply(500, {
      message: 'Internal server error',
    });

    // Create OpenApiSource from the mock spec
    const source = OpenApiSource.fromObject(mockOpenApiSpec);

    // Call the deploy method and expect it to throw
    await expect(
      sdk.mcp.deploy({
        spec: source,
        specBaseUrl: 'https://example.com/api',
      })
    ).rejects.toThrow(ApiError);
  });

  it('should throw NetworkError for network failure', async () => {
    // Set up the mock API to simulate a network error
    nock('https://api.tadata.com').post('/v1/mcp').replyWithError('Network error');

    // Create OpenApiSource from the mock spec
    const source = OpenApiSource.fromObject(mockOpenApiSpec);

    // Call the deploy method and expect it to throw
    await expect(
      sdk.mcp.deploy({
        spec: source,
        specBaseUrl: 'https://example.com/api',
      })
    ).rejects.toThrow(NetworkError);
  });
});
