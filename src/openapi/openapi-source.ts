import fs from 'fs/promises';
import path from 'path';
import type { OpenAPI3 } from 'openapi-typescript';
import { SpecInvalidError } from '../errors';

/**
 * Class for handling different sources of OpenAPI specifications
 */
export class OpenApiSource {
  private constructor(private readonly rawSpec: OpenAPI3) {}

  /**
   * Returns the raw specification object
   */
  getRawSpec(): OpenAPI3 {
    return this.rawSpec;
  }

  /**
   * Creates an OpenApiSource from a file
   */
  static async fromFile(filePath: string): Promise<OpenApiSource> {
    try {
      const resolvedPath = path.resolve(filePath);
      const fileContent = await fs.readFile(resolvedPath, 'utf-8');

      // Only support JSON files
      if (resolvedPath.endsWith('.json')) {
        const parsed = JSON.parse(fileContent);

        // Validate basic OpenAPI structure
        validateOpenApiSpec(parsed);

        return new OpenApiSource(parsed);
      } else {
        throw new Error(
          `Unsupported file extension: ${path.extname(filePath)}. Only JSON files are supported.`
        );
      }
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

      // Validate basic OpenAPI structure
      validateOpenApiSpec(parsed);

      return new OpenApiSource(parsed);
    } catch (error) {
      throw new SpecInvalidError(`Invalid JSON: ${(error as Error).message}`, undefined, error);
    }
  }

  /**
   * Creates an OpenApiSource from a plain JavaScript object
   */
  static fromObject(obj: Record<string, any>): OpenApiSource {
    // Validate basic OpenAPI structure
    validateOpenApiSpec(obj);

    return new OpenApiSource(obj);
  }
}

/**
 * Validate that the object matches the basic structure of an OpenAPI3 spec
 */
function validateOpenApiSpec(spec: unknown): asserts spec is OpenAPI3 {
  if (typeof spec !== 'object' || spec === null) {
    throw new SpecInvalidError('Spec must be an object', { spec });
  }

  const specObj = spec as Record<string, unknown>;

  // Check for required OpenAPI fields
  if (!('openapi' in specObj) || typeof specObj.openapi !== 'string') {
    throw new SpecInvalidError('Missing or invalid "openapi" field', { spec });
  }

  // Check OpenAPI version starts with 3.
  if (!specObj.openapi.startsWith('3.')) {
    throw new SpecInvalidError('Only OpenAPI 3.x specifications are supported', {
      version: specObj.openapi,
    });
  }

  // Check for info object
  if (!('info' in specObj) || typeof specObj.info !== 'object' || specObj.info === null) {
    throw new SpecInvalidError('Missing or invalid "info" field', { spec });
  }

  // Check for paths object
  if (!('paths' in specObj) || typeof specObj.paths !== 'object' || specObj.paths === null) {
    throw new SpecInvalidError('Missing or invalid "paths" field', { spec });
  }
}
