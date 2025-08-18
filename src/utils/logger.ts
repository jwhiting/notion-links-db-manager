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

/**
 * Configure logger based on environment variable and dotfile
 * Checks in order:
 * 1. LOG_LEVEL environment variable
 * 2. .loglevel file in project root
 * 3. Defaults to ERROR (clean output for daily use)
 */
export function configureLoggerFromEnv(): void {
  let logLevel = LogLevel.ERROR; // Default to clean output
  
  try {
    // Check environment variable first
    const envLogLevel = process.env['LOG_LEVEL']?.toUpperCase();
    if (envLogLevel) {
      switch (envLogLevel) {
        case 'DEBUG':
          logLevel = LogLevel.DEBUG;
          break;
        case 'INFO':
          logLevel = LogLevel.INFO;
          break;
        case 'WARN':
          logLevel = LogLevel.WARN;
          break;
        case 'ERROR':
          logLevel = LogLevel.ERROR;
          break;
      }
    } else {
      // Check for .loglevel file in project root
      const fs = require('fs');
      const path = require('path');
      
      // Find project root (where package.json is)
      let currentDir = __dirname;
      while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, 'package.json'))) {
        currentDir = path.dirname(currentDir);
      }
      
      const logLevelFile = path.join(currentDir, '.loglevel');
      if (fs.existsSync(logLevelFile)) {
        const fileContent = fs.readFileSync(logLevelFile, 'utf8').trim().toUpperCase();
        switch (fileContent) {
          case 'DEBUG':
            logLevel = LogLevel.DEBUG;
            break;
          case 'INFO':
            logLevel = LogLevel.INFO;
            break;
          case 'WARN':
            logLevel = LogLevel.WARN;
            break;
          case 'ERROR':
            logLevel = LogLevel.ERROR;
            break;
        }
      }
    }
  } catch (error) {
    // If anything fails, stick with ERROR default
  }
  
  logger.setLevel(logLevel);
}
