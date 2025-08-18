#!/usr/bin/env ts-node

/**
 * Standalone script to find bookmarks that might need a specific tag
 * Usage: npx ts-node src/scripts/suggest-for-tag.ts [tag-name]
 */

import { NotionClient } from '../notion/client';
import { findBookmarksForTagCommand } from '../commands/suggest-tags';
import { validateConfigWithAI } from '../config';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  // Get tag name from command line arguments
  const targetTag = process.argv[2];

  if (!targetTag) {
    console.log('Usage: npm run suggest-for-tag [tag-name]');
    console.log('\nExample: npm run suggest-for-tag ai');
    console.log('Example: npm run suggest-for-tag content-creation');
    console.log('\nTo see available tags, use: npm run show-tag-definitions');
    process.exit(1);
  }

  try {
    // Validate configuration including OpenAI API key
    validateConfigWithAI();

    // Initialize Notion client
    const notionClient = new NotionClient();

    // Run the command
    await findBookmarksForTagCommand(notionClient, targetTag);

  } catch (error) {
    console.error('Suggest for tag command failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
