import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { SpecInvalidError } from '../errors';

/**
 * Class for handling different sources of OpenAPI specifications
 */
export class OpenApiSource {
  private constructor(private readonly rawSpec: unknown) {}

  /**
   * Returns the raw specification object
   */
  getRawSpec(): unknown {
    return this.rawSpec;
  }

  /**
   * Creates an OpenApiSource from a file
   */
  static async fromFile(filePath: string): Promise<OpenApiSource> {
    try {
      const resolvedPath = path.resolve(filePath);
      const fileContent = await fs.readFile(resolvedPath, 'utf-8');

      // Parse based on file extension
      let parsed: unknown;
      if (resolvedPath.endsWith('.json')) {
        parsed = JSON.parse(fileContent);
      } else if (resolvedPath.endsWith('.yaml') || resolvedPath.endsWith('.yml')) {
        parsed = yaml.parse(fileContent);
      } else {
        throw new Error(`Unsupported file extension: ${path.extname(filePath)}`);
      }

      return new OpenApiSource(parsed);
    } catch (error) {
      throw new SpecInvalidError(
        `Failed to read spec file: ${(error as Error).message}`,
        { filePath },
        error
      );
    }
  }

  /**
   * Creates an OpenApiSource from a JSON string
   */
  static fromJson(jsonStr: string): OpenApiSource {
    try {
      const parsed = JSON.parse(jsonStr);
      return new OpenApiSource(parsed);
    } catch (error) {
      throw new SpecInvalidError(`Invalid JSON: ${(error as Error).message}`, undefined, error);
    }
  }

  /**
   * Creates an OpenApiSource from a YAML string
   */
  static fromYaml(yamlStr: string): OpenApiSource {
    try {
      const parsed = yaml.parse(yamlStr);
      return new OpenApiSource(parsed);
    } catch (error) {
      throw new SpecInvalidError(`Invalid YAML: ${(error as Error).message}`, undefined, error);
    }
  }

  /**
   * Creates an OpenApiSource from a plain JavaScript object
   */
  static fromObject(obj: Record<string, any>): OpenApiSource {
    return new OpenApiSource(obj);
  }

  /**
   * Creates an OpenApiSource from an Express application
   * This is a placeholder implementation. In a real implementation,
   * you would use a library like swagger-jsdoc to generate an OpenAPI spec.
   */
  static fromExpress(app: any): OpenApiSource {
    try {
      // Validation that it's likely an Express app
      if (typeof app?.use !== 'function' || typeof app?.listen !== 'function') {
        throw new Error('Not a valid Express app');
      }

      // Here you would typically use swagger-jsdoc or similar to generate a spec
      // This is a simplified placeholder implementation
      const spec = {
        openapi: '3.0.0',
        info: {
          title: 'Express API',
          version: '1.0.0',
        },
        paths: {},
      };

      return new OpenApiSource(spec);
    } catch (error) {
      throw new SpecInvalidError(
        `Failed to generate spec from Express app: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }

  /**
   * Creates an OpenApiSource from a Fastify instance
   * This is a placeholder implementation. In a real implementation,
   * you would use Fastify's swagger method to generate an OpenAPI spec.
   */
  static fromFastify(fastify: any): OpenApiSource {
    try {
      // Validation that it's likely a Fastify instance
      if (typeof fastify?.register !== 'function' || typeof fastify?.listen !== 'function') {
        throw new Error('Not a valid Fastify instance');
      }

      // If Fastify has a swagger method, use it
      if (typeof fastify.swagger === 'function') {
        return new OpenApiSource(fastify.swagger());
      }

      // Fallback to a minimal spec
      const spec = {
        openapi: '3.0.0',
        info: {
          title: 'Fastify API',
          version: '1.0.0',
        },
        paths: {},
      };

      return new OpenApiSource(spec);
    } catch (error) {
      throw new SpecInvalidError(
        `Failed to generate spec from Fastify instance: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }
}
