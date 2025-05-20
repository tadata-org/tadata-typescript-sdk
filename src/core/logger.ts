/**
 * Logger interface for the SDK.
 * Consumers of the SDK can implement this interface to provide a custom logging
 * solution (e.g., to integrate with their existing logging infrastructure like Pino or Winston).
 * If no logger is provided to `Tadata`, a default `ConsoleLogger` will be used.
 *
 * @since 0.1.0
 */
export interface Logger {
  debug(msg: string, ...meta: unknown[]): void;
  info(msg: string, ...meta: unknown[]): void;
  warn(msg: string, ...meta: unknown[]): void;
  error(msg: string, ...meta: unknown[]): void;
}

/**
 * Simple console-based logger implementation
 *
 * @since 0.1.0
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
 *
 * @since 0.1.0
 */
export function createDefaultLogger(): Logger {
  return new ConsoleLogger();
}
