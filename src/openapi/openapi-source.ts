import fs from 'fs/promises';
import path from 'path';
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

      // Only support JSON files
      if (resolvedPath.endsWith('.json')) {
        const parsed = JSON.parse(fileContent);
        return new OpenApiSource(parsed);
      } else {
        throw new Error(`Unsupported file extension: ${path.extname(filePath)}. Only JSON files are supported.`);
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
      return new OpenApiSource(parsed);
    } catch (error) {
      throw new SpecInvalidError(`Invalid JSON: ${(error as Error).message}`, undefined, error);
    }
  }

  /**
   * Creates an OpenApiSource from a plain JavaScript object
   */
  static fromObject(obj: Record<string, any>): OpenApiSource {
    return new OpenApiSource(obj);
  }
}
