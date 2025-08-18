#!/usr/bin/env ts-node

/**
 * Standalone script to check for undefined tags
 * Usage: npx ts-node src/scripts/check-undefined-tags.ts
 */

import { runCheckTagsCommand } from '../commands/check-tags';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();
  
  await runCheckTagsCommand();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
