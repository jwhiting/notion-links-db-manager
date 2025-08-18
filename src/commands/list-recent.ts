import { NotionClient } from '../notion/client';
import { getRecentBookmarks } from '../utils/bookmark/fetcher';
import { formatBookmarks } from '../utils/bookmark/formatter';
import { logger } from '../utils/logger';

/**
 * Command to list the most recent bookmarks
 */

export interface ListRecentOptions {
  count?: number;
  showEmptyFields?: boolean;
  dateFormat?: 'iso' | 'short' | 'relative';
}

export async function listRecentBookmarks(
  client: NotionClient,
  options: ListRecentOptions = {}
): Promise<void> {
  const {
    count = 20,
    showEmptyFields = false,
    dateFormat = 'short',
  } = options;

  try {
    logger.info(`Fetching ${count} most recent bookmarks...`);

    // Get recent bookmarks
    const bookmarks = await getRecentBookmarks(client, count);

    if (bookmarks.length === 0) {
      logger.info('No bookmarks found');
      return;
    }

    logger.info(`\n=== ${bookmarks.length} MOST RECENT BOOKMARKS ===\n`);

    // Format and print bookmarks
    const formattedOutput = formatBookmarks(bookmarks, {
      showEmptyFields,
      dateFormat,
      maxFieldLength: 150,
    });

    console.log(formattedOutput);

    // Show summary
    const withTags = bookmarks.filter(b => b.properties.tags.length > 0);
    const withAttention = bookmarks.filter(b => b.properties.attn);
    const withContent = bookmarks.filter(b => 
      b.properties.notes || b.properties.what || b.properties.why || b.properties.quotes
    );

    logger.info(`\n=== SUMMARY ===`);
    logger.info(`Total: ${bookmarks.length}`);
    logger.info(`With tags: ${withTags.length}`);
    logger.info(`With attention: ${withAttention.length}`);
    logger.info(`With content: ${withContent.length}`);

  } catch (error) {
    logger.error('Failed to list recent bookmarks:', error);
    throw error;
  }
}

/**
 * Run the list recent command (for use as standalone script)
 */
export async function runListRecentCommand(options: ListRecentOptions = {}): Promise<void> {
  const { validateConfig } = await import('../config');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Notion client
    const notionClient = new NotionClient();
    
    // Run the command
    await listRecentBookmarks(notionClient, options);
    
  } catch (error) {
    logger.error('Command failed:', error);
    process.exit(1);
  }
}
