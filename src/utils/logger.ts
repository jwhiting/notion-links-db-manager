/* eslint-disable no-console */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

// Export a default logger instance
export const logger = new Logger();
export { Logger };
