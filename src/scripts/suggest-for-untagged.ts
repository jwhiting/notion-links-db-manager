#!/usr/bin/env ts-node

/**
 * Standalone script to suggest tags for all untagged bookmarks
 * Usage: npx ts-node src/scripts/suggest-for-untagged.ts
 */

import { NotionClient } from '../notion/client';
import { suggestTagsForUntaggedCommand } from '../commands/suggest-tags';
import { validateConfigWithAI } from '../config';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  console.log('🤖 AI Tag Suggestion for Untagged Bookmarks');
  console.log('This will analyze all bookmarks with no tags and suggest appropriate tags.');
  console.log('You\'ll be prompted to accept or reject each suggestion.\n');

  try {
    // Validate configuration including OpenAI API key
    validateConfigWithAI();

    // Initialize Notion client
    const notionClient = new NotionClient();

    // Run the command
    await suggestTagsForUntaggedCommand(notionClient);

  } catch (error) {
    console.error('Suggest for untagged command failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
