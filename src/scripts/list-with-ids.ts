#!/usr/bin/env ts-node

/**
 * Standalone script to list recent bookmarks with their IDs (for testing AI suggestions)
 * Usage: npx ts-node src/scripts/list-with-ids.ts [count]
 */

import { NotionClient } from '../notion/client';
import { fetchBookmarks } from '../utils/bookmark/fetcher';
import type { Bookmark } from '../notion/types';
import { validateConfig } from '../config';
import { configureLoggerFromEnv } from '../utils/logger';

async function main(): Promise<void> {
  // Configure logger from environment/dotfile
  configureLoggerFromEnv();

  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0], 10) : 10;

  if (isNaN(count) || count <= 0) {
    console.error('Error: Count must be a positive number');
    process.exit(1);
  }

  try {
    // Validate configuration
    validateConfig();

    // Initialize Notion client
    const notionClient = new NotionClient();

    // Fetch recent bookmarks
    const bookmarks = await fetchBookmarks(notionClient, {
      limit: count,
      sortBy: 'created',
      sortDirection: 'descending',
    });

    if (bookmarks.length === 0) {
      console.log('No bookmarks found');
      return;
    }

    console.log(`\n=== ${bookmarks.length} RECENT BOOKMARKS WITH IDS ===\n`);

    bookmarks.forEach((bookmark: Bookmark, index: number) => {
      console.log(`${index + 1}. ${bookmark.properties.name}`);
      console.log(`   ID: ${bookmark.id}`);
      console.log(`   URL: ${bookmark.properties.url}`);
      console.log(`   Tags: ${bookmark.properties.tags.length > 0 ? bookmark.properties.tags.map((tag: string) => `#${tag}`).join(', ') : 'None'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Failed to list bookmarks:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
