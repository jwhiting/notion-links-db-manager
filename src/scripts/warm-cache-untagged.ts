#!/usr/bin/env ts-node

/**
 * Standalone script to warm cache for untagged bookmarks
 * Usage: npx ts-node src/scripts/warm-cache-untagged.ts
 */

import { NotionClient } from '../notion/client';
import { warmCacheUntagged } from '../commands/warm-cache';
import { validateConfigWithAI } from '../config';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  console.log('🔥 AI Cache Warming: Untagged Bookmarks');
  console.log('This will pre-compute AI tag suggestions for all untagged bookmarks.');
  console.log('Use this before interactive sessions for faster workflows.\n');

  try {
    // Validate configuration including OpenAI API key
    validateConfigWithAI();

    // Initialize Notion client
    const notionClient = new NotionClient();

    // Run the cache warming
    await warmCacheUntagged(notionClient);

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
