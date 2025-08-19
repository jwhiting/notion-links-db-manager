#!/usr/bin/env ts-node

/**
 * Standalone script to show cache status
 * Usage: npx ts-node src/scripts/cache-status.ts
 */

import { showCacheStatus } from '../commands/warm-cache';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  await showCacheStatus();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
