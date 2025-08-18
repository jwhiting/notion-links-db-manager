#!/usr/bin/env ts-node

/**
 * Standalone script to list the most recent bookmarks
 * Usage: npx ts-node src/scripts/list-recent.ts [count]
 */

import { runListRecentCommand } from '../commands/list-recent';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0], 10) : 20;

  if (isNaN(count) || count <= 0) {
    console.error('Error: Count must be a positive number');
    process.exit(1);
  }

  await runListRecentCommand({
    count,
    dateFormat: 'short',
    showEmptyFields: false,
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
