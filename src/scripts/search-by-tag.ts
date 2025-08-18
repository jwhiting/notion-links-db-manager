#!/usr/bin/env ts-node

/**
 * Standalone script to search bookmarks by tag(s)
 * Usage: npx ts-node src/scripts/search-by-tag.ts <tag1> [tag2] [tag3] ... [--quiet]
 */

import { runSearchCommand } from '../commands/search';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npx ts-node src/scripts/search-by-tag.ts <tag1> [tag2] [tag3] ...');
    console.error('');
    console.error('Examples:');
    console.error('  npx ts-node src/scripts/search-by-tag.ts ai');
    console.error('  npx ts-node src/scripts/search-by-tag.ts ai agents');
    console.error('  npx ts-node src/scripts/search-by-tag.ts ai coding oss');
    console.error('');
    console.error('Multiple tags are treated as an intersection (AND) query.');
    process.exit(1);
  }

  if (args.length === 1) {
    // Single tag search
    const tag = args[0]!;
    await runSearchCommand({
      tag,
      limit: 50,
      showEmptyFields: false,
    });
  } else {
    // Multiple tags search (intersection/AND)
    const tags = args;
    await runSearchCommand({
      allTags: tags,
      limit: 50,
      showEmptyFields: false,
    });
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
