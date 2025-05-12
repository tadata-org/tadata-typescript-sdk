import { OpenApiSource } from '../../src';
import fs from 'fs/promises';
import path from 'path';
import { SpecInvalidError } from '../../src';

// Create test directory and files before tests
const testDir = path.join(__dirname, '../../test-temp');
const jsonFilePath = path.join(testDir, 'test-spec.json');

// Sample OpenAPI spec for tests
const sampleSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {
    '/hello': {
      get: {
        summary: 'Say hello',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe('OpenApiSource', () => {
  // Set up test files
  beforeAll(async () => {
    try {
      // Create test directory
      await fs.mkdir(testDir, { recursive: true });

      // Create JSON file
      await fs.writeFile(jsonFilePath, JSON.stringify(sampleSpec, null, 2));
    } catch (error) {
      console.error('Failed to set up test files:', error);
      throw error;
    }
  });

  // Clean up test files
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up test files:', error);
    }
  });

  describe('fromObject', () => {
    it('creates a source from a JavaScript object', () => {
      // Create a source from the sample spec object
      const source = OpenApiSource.fromObject(sampleSpec);

      // Verify that getRawSpec returns the exact same object
      expect(source.getRawSpec()).toEqual(sampleSpec);

      // Verify specific properties to ensure deep equality
      const spec = source.getRawSpec() as any;
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Test API');
      expect(spec.paths['/hello'].get.summary).toBe('Say hello');
    });
  });

  describe('fromJson', () => {
    it('creates a source from a JSON string', () => {
      // Convert the sample spec to a JSON string
      const jsonString = JSON.stringify(sampleSpec);

      // Create a source from the JSON string
      const source = OpenApiSource.fromJson(jsonString);

      // Verify that getRawSpec returns the parsed object
      expect(source.getRawSpec()).toEqual(sampleSpec);
    });

    it('throws SpecInvalidError for malformed JSON', () => {
      // Create an invalid JSON string
      const invalidJson = '{ "openapi": "3.0.0", missing: quotes }';

      // Verify that creating a source with invalid JSON throws
      expect(() => OpenApiSource.fromJson(invalidJson)).toThrow(SpecInvalidError);
    });
  });

  describe('fromFile', () => {
    it('creates a source from a JSON file', async () => {
      // Create a source from the JSON file
      const source = await OpenApiSource.fromFile(jsonFilePath);

      // Verify that getRawSpec returns the parsed object
      expect(source.getRawSpec()).toEqual(sampleSpec);
    });

    it('throws SpecInvalidError for non-existent file', async () => {
      // Attempt to create a source from a non-existent file
      await expect(OpenApiSource.fromFile('/path/to/nonexistent-file.json')).rejects.toThrow(
        SpecInvalidError
      );
    });

    it('throws SpecInvalidError for unsupported file extension', async () => {
      // Create a path with an unsupported extension
      const unsupportedPath = path.join(testDir, 'test-spec.txt');
      
      // Write some content to the file
      await fs.writeFile(unsupportedPath, 'Not a valid spec file');
      
      // Attempt to create a source from a file with unsupported extension
      await expect(OpenApiSource.fromFile(unsupportedPath)).rejects.toThrow(
        SpecInvalidError
      );
    });
  });
});
