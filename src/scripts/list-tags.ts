#!/usr/bin/env ts-node

/**
 * Standalone script to list all unique tags
 * Usage: npx ts-node src/scripts/list-tags.ts [--no-counts] [--sort-by-name] [--quiet]
 */

import { runListTagsCommand } from '../commands/list-tags';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();
  
  const args = process.argv.slice(2);
  
  const showCounts = !args.includes('--no-counts');
  const sortByName = args.includes('--sort-by-name');
  const ascending = args.includes('--asc');

  await runListTagsCommand({
    showCounts,
    sortBy: sortByName ? 'name' : 'count',
    sortDirection: ascending ? 'asc' : 'desc',
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
