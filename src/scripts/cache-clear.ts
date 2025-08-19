#!/usr/bin/env ts-node

/**
 * Standalone script to clear the cache
 * Usage: npx ts-node src/scripts/cache-clear.ts
 */

import { clearCache } from '../commands/warm-cache';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  await clearCache();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
