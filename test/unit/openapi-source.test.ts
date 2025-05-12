import { OpenApiSource } from '../../src';
import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import fastify from 'fastify';
import yaml from 'yaml';
import { SpecInvalidError } from '../../src';

// Create test directory and files before tests
const testDir = path.join(__dirname, '../../test-temp');
const jsonFilePath = path.join(testDir, 'test-spec.json');
const yamlFilePath = path.join(testDir, 'test-spec.yaml');

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

      // Create YAML file
      const yamlContent = yaml.stringify(sampleSpec);
      await fs.writeFile(yamlFilePath, yamlContent);
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

  describe('fromYaml', () => {
    it('creates a source from a YAML string', () => {
      // Create a YAML string from the sample spec
      const yamlString = yaml.stringify(sampleSpec);

      // Create a source from the YAML string
      const source = OpenApiSource.fromYaml(yamlString);

      // Verify that getRawSpec returns the parsed object
      expect(source.getRawSpec()).toEqual(sampleSpec);
    });

    it('throws SpecInvalidError for malformed YAML', () => {
      // Create an invalid YAML string
      const invalidYaml = `
        openapi: 3.0.0
        info:
          title: Test API
          version: 1.0.0
        paths:
          /hello:
          get:  # This line should be indented further
            summary: Say hello
      `;

      // Verify that creating a source with invalid YAML throws
      expect(() => OpenApiSource.fromYaml(invalidYaml)).toThrow(SpecInvalidError);
    });
  });

  describe('fromFile', () => {
    it('creates a source from a JSON file', async () => {
      // Create a source from the JSON file
      const source = await OpenApiSource.fromFile(jsonFilePath);

      // Verify that getRawSpec returns the parsed object
      expect(source.getRawSpec()).toEqual(sampleSpec);
    });

    it('creates a source from a YAML file', async () => {
      // Create a source from the YAML file
      const source = await OpenApiSource.fromFile(yamlFilePath);

      // Verify that getRawSpec returns the parsed object
      expect(source.getRawSpec()).toEqual(sampleSpec);
    });

    it('throws SpecInvalidError for non-existent file', async () => {
      // Attempt to create a source from a non-existent file
      await expect(OpenApiSource.fromFile('/path/to/nonexistent-file.json')).rejects.toThrow(
        SpecInvalidError
      );
    });
  });

  describe('fromExpress', () => {
    it('creates a source from an Express app', () => {
      // Create an Express app
      const app = express();

      // Define some routes
      app.get('/hello', (_req, res) => {
        res.json({ message: 'Hello, world!' });
      });

      // Create a source from the Express app
      const source = OpenApiSource.fromExpress(app);

      // Verify that getRawSpec returns an object with basic OpenAPI structure
      const spec = source.getRawSpec() as any;
      expect(spec.openapi).toBeDefined();
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.paths).toBeDefined();
    });

    it('throws SpecInvalidError for invalid Express app', () => {
      // Create an object that is not an Express app
      const notAnApp = {
        notExpress: true,
      };

      // Verify that creating a source with an invalid Express app throws
      expect(() => OpenApiSource.fromExpress(notAnApp)).toThrow(SpecInvalidError);
    });
  });

  describe('fromFastify', () => {
    it('creates a source from a Fastify app', () => {
      // Create a Fastify app
      const app = fastify();

      // Define some routes
      app.get('/hello', async (_request, _reply) => {
        return { message: 'Hello, world!' };
      });

      // Create a source from the Fastify app
      const source = OpenApiSource.fromFastify(app);

      // Verify that getRawSpec returns an object with basic OpenAPI structure
      const spec = source.getRawSpec() as any;
      expect(spec.openapi).toBeDefined();
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.paths).toBeDefined();
    });

    it('throws SpecInvalidError for invalid Fastify app', () => {
      // Create an object that is not a Fastify app
      const notAnApp = {
        notFastify: true,
      };

      // Verify that creating a source with an invalid Fastify app throws
      expect(() => OpenApiSource.fromFastify(notAnApp)).toThrow(SpecInvalidError);
    });

    it('uses Fastify swagger method if available', () => {
      // Create a Fastify app with a mock swagger method
      const app = fastify();

      // Add a mock swagger method
      (app as any).swagger = () => ({
        openapi: '3.0.0',
        info: {
          title: 'Fastify Swagger API',
          version: '1.0.0',
        },
        paths: {
          '/custom': {
            get: {
              summary: 'Custom endpoint',
            },
          },
        },
      });

      // Create a source from the Fastify app
      const source = OpenApiSource.fromFastify(app);

      // Verify that getRawSpec returns the object from the swagger method
      const spec = source.getRawSpec() as any;
      expect(spec.info.title).toBe('Fastify Swagger API');
      expect(spec.paths['/custom']).toBeDefined();
    });
  });
});
