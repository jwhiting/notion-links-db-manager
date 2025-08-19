#!/usr/bin/env ts-node

/**
 * Standalone script to warm cache for a specific tag
 * Usage: npx ts-node src/scripts/warm-cache-for-tag.ts [tag-name]
 */

import { NotionClient } from '../notion/client';
import { warmCacheForTag } from '../commands/warm-cache';
import { validateConfigWithAI } from '../config';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  // Get tag name from command line arguments
  const targetTag = process.argv[2];

  if (!targetTag) {
    console.log('Usage: npm run warm-cache-for-tag [tag-name]');
    console.log('\nExample: npm run warm-cache-for-tag ai');
    console.log('Example: npm run warm-cache-for-tag content-creation');
    console.log('\nThis will pre-compute AI decisions for all bookmarks that might need this tag.');
    console.log('Use this before interactive sessions for faster workflows.');
    process.exit(1);
  }

  console.log(`🔥 AI Cache Warming: Tag #${targetTag}`);
  console.log('This will pre-compute AI decisions for all candidate bookmarks.');
  console.log('Use this before interactive sessions for faster workflows.\n');

  try {
    // Validate configuration including OpenAI API key
    validateConfigWithAI();

    // Initialize Notion client
    const notionClient = new NotionClient();

    // Run the cache warming
    await warmCacheForTag(notionClient, targetTag);

  } catch (error) {
    console.error('Cache warming failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
