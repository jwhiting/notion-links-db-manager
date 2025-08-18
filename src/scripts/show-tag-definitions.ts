#!/usr/bin/env ts-node

/**
 * Standalone script to show all tag definitions
 * Usage: npx ts-node src/scripts/show-tag-definitions.ts
 */

import { runShowDefinitionsCommand } from '../commands/check-tags';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile (but this command doesn't use logger much)
  configureLoggerFromEnv();
  
  await runShowDefinitionsCommand();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
