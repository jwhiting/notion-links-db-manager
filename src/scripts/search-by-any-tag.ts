#!/usr/bin/env ts-node

/**
 * Standalone script to search bookmarks by any of the specified tags (OR query)
 * Usage: npx ts-node src/scripts/search-by-any-tag.ts <tag1> [tag2] [tag3] ...
 */

import { runSearchCommand } from '../commands/search';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npx ts-node src/scripts/search-by-any-tag.ts <tag1> [tag2] [tag3] ...');
    console.error('');
    console.error('Examples:');
    console.error('  npx ts-node src/scripts/search-by-any-tag.ts ai');
    console.error('  npx ts-node src/scripts/search-by-any-tag.ts ai agents');
    console.error('  npx ts-node src/scripts/search-by-any-tag.ts coding ide cli');
    console.error('');
    console.error('Multiple tags are treated as a union (OR) query.');
    process.exit(1);
  }

  const tags = args;
  
  await runSearchCommand({
    anyTags: tags,
    limit: 50,
    showEmptyFields: false,
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
