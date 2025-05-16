/**
 * Logger interface for the SDK
 */
export interface Logger {
  debug(msg: string, ...meta: unknown[]): void;
  info(msg: string, ...meta: unknown[]): void;
  warn(msg: string, ...meta: unknown[]): void;
  error(msg: string, ...meta: unknown[]): void;
}

/**
 * Simple console-based logger implementation
 */
export class ConsoleLogger implements Logger {
  debug(msg: string, ...meta: unknown[]): void {
    console.debug(msg, ...meta);
  }

  info(msg: string, ...meta: unknown[]): void {
    console.info(msg, ...meta);
  }

  warn(msg: string, ...meta: unknown[]): void {
    console.warn(msg, ...meta);
  }

  error(msg: string, ...meta: unknown[]): void {
    console.error(msg, ...meta);
  }
}

/**
 * Creates a default console logger
 */
export function createDefaultLogger(): Logger {
  return new ConsoleLogger();
}
