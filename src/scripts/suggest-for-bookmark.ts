#!/usr/bin/env ts-node

/**
 * Standalone script to suggest additional tags for a specific bookmark
 * Usage: npx ts-node src/scripts/suggest-for-bookmark.ts [bookmark-id]
 */

import { NotionClient } from '../notion/client';
import { suggestTagsForBookmarkCommand } from '../commands/suggest-tags';
import { validateConfigWithAI } from '../config';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  // Get bookmark ID from command line arguments
  const bookmarkId = process.argv[2];

  if (!bookmarkId) {
    console.log('Usage: npm run suggest-for-bookmark [bookmark-id]');
    console.log('\nExample: npm run suggest-for-bookmark abc123def456');
    console.log('\nTo find bookmark IDs, use: npm run list-recent');
    process.exit(1);
  }

  try {
    // Validate configuration including OpenAI API key
    validateConfigWithAI();

    // Initialize Notion client
    const notionClient = new NotionClient();

    // Run the command
    await suggestTagsForBookmarkCommand(notionClient, bookmarkId);

  } catch (error) {
    console.error('Suggest tags command failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
