import * as fs from 'fs/promises';
import * as path from 'path';
import type { OpenAPI3 } from 'openapi-typescript';
import { SpecInvalidError } from '../errors';

/**
 * Represents a source for an OpenAPI specification.
 * This class provides factory methods to create an OpenAPI source from various inputs
 * like a file, a JSON string, or a JavaScript object.
 * It handles parsing and basic validation of the OpenAPI document.
 *
 * @since 0.1.0
 */
export class OpenApiSource {
  private constructor(private readonly rawSpec: OpenAPI3) {}

  /**
   * Returns the raw, parsed OpenAPI specification object.
   * This object conforms to the OpenAPI3 interface.
   *
   * @returns The OpenAPI specification as a JavaScript object.
   * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md|OpenAPI 3.0.3 Specification}
   */
  getRawSpec(): OpenAPI3 {
    return this.rawSpec;
  }

  /**
   * Creates an `OpenApiSource` instance from a local JSON file path.
   * The file must be a valid OpenAPI 3.x specification in JSON format.
   *
   * @param filePath The absolute or relative path to the OpenAPI JSON file.
   * @returns A promise that resolves to an `OpenApiSource` instance.
   * @throws {SpecInvalidError} If the file cannot be read, is not valid JSON,
   * or does not conform to the OpenAPI 3.x specification structure.
   * @example
   * \`\`\`typescript
   * async function loadSpec() {
   *   try {
   *     const source = await OpenApiSource.fromFile('./path/to/your/openapi.json');
   *     console.log('Successfully loaded spec:', source.getRawSpec().info.title);
   *   } catch (error) {
   *     console.error('Failed to load OpenAPI spec from file:', error);
   *   }
   * }
   * loadSpec();
   * \`\`\`
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
   * Creates an `OpenApiSource` instance from a JSON string.
   * The string must represent a valid OpenAPI 3.x specification.
   *
   * @param jsonStr A string containing the OpenAPI specification in JSON format.
   * @returns An `OpenApiSource` instance.
   * @throws {SpecInvalidError} If the string is not valid JSON or does not conform
   * to the OpenAPI 3.x specification structure.
   * @example
   * \`\`\`typescript
   * const specJson = '{
   *   "openapi": "3.0.0",
   *   "info": { "title": "My API", "version": "1.0.0" },
   *   "paths": {}
   * }';
   * try {
   *   const source = OpenApiSource.fromJson(specJson);
   *   console.log('Successfully loaded spec:', source.getRawSpec().info.title);
   * } catch (error) {
   *   console.error('Failed to load OpenAPI spec from JSON string:', error);
   * }
   * \`\`\`
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
   * Creates an `OpenApiSource` instance from a plain JavaScript object.
   * The object must conform to the OpenAPI 3.x specification structure.
   *
   * @param obj A JavaScript object representing the OpenAPI specification.
   * @returns An `OpenApiSource` instance.
   * @throws {SpecInvalidError} If the object does not conform to the OpenAPI 3.x specification structure.
   * @example
   * \`\`\`typescript
   * const specObject = {
   *   openapi: '3.0.0',
   *   info: { title: 'My API from Object', version: '1.0.0' },
   *   paths: {}
   * };
   * try {
   *   const source = OpenApiSource.fromObject(specObject);
   *   console.log('Successfully loaded spec:', source.getRawSpec().info.title);
   * } catch (error) {
   *   console.error('Failed to load OpenAPI spec from object:', error);
   * }
   * \`\`\`
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
