import { NotionClient } from '../notion/client';
import {
  findBookmarksByTag,
  findBookmarksByAnyTag,
  findBookmarksByAllTags,
  findAttentionBookmarks,
  findBookmarksWithContent,
  findBookmarksByUrl,
  complexSearch,
} from '../utils/bookmark/search';
import { formatBookmarks } from '../utils/bookmark/formatter';
import { logger } from '../utils/logger';

/**
 * Search command with various search capabilities
 */

export interface SearchCommandOptions {
  tag?: string;
  anyTags?: string[];
  allTags?: string[];
  attention?: boolean;
  hasContent?: ('notes' | 'what' | 'why' | 'quotes')[];
  url?: string;
  limit?: number;
  showEmptyFields?: boolean;
}

export async function searchBookmarks(
  client: NotionClient,
  options: SearchCommandOptions
): Promise<void> {
  try {
    let bookmarks;
    let searchDescription = '';

    if (options.tag) {
      bookmarks = await findBookmarksByTag(client, options.tag, {
        limit: options.limit || 50,
      });
      searchDescription = `with tag "${options.tag}"`;
    } else if (options.anyTags && options.anyTags.length > 0) {
      bookmarks = await findBookmarksByAnyTag(client, options.anyTags, {
        limit: options.limit || 50,
      });
      searchDescription = `with any of these tags: ${options.anyTags.join(', ')}`;
    } else if (options.allTags && options.allTags.length > 0) {
      bookmarks = await findBookmarksByAllTags(client, options.allTags, {
        limit: options.limit || 50,
      });
      searchDescription = `with all of these tags: ${options.allTags.join(', ')}`;
    } else if (options.attention === true) {
      bookmarks = await findAttentionBookmarks(client, {
        limit: options.limit || 50,
      });
      searchDescription = 'marked for attention';
    } else if (options.hasContent && options.hasContent.length > 0) {
      // For simplicity, search for the first content type specified
      bookmarks = await findBookmarksWithContent(client, options.hasContent[0]!, {
        limit: options.limit || 50,
      });
      searchDescription = `with content in "${options.hasContent[0]}" field`;
    } else if (options.url) {
      bookmarks = await findBookmarksByUrl(client, options.url, {
        limit: options.limit || 50,
      });
      searchDescription = `with URL containing "${options.url}"`;
    } else {
      // Complex search combining all criteria
      const searchCriteria: any = {};
      
      if (options.anyTags || options.allTags) {
        searchCriteria.tags = {};
        if (options.anyTags) searchCriteria.tags.any = options.anyTags;
        if (options.allTags) searchCriteria.tags.all = options.allTags;
      }
      
      if (options.attention !== undefined) {
        searchCriteria.attention = options.attention;
      }
      
      if (options.hasContent) {
        searchCriteria.hasContent = options.hasContent;
      }
      
      if (options.url) {
        searchCriteria.urlContains = options.url;
      }
      
      bookmarks = await complexSearch(client, searchCriteria, {
        limit: options.limit || 50,
      });
      searchDescription = 'matching complex criteria';
    }

    if (bookmarks.length === 0) {
      logger.info(`No bookmarks found ${searchDescription}`);
      return;
    }

    logger.info(`\n=== ${bookmarks.length} BOOKMARKS FOUND ${searchDescription.toUpperCase()} ===\n`);

    // Format and display results
    const formattedOutput = formatBookmarks(bookmarks, {
      showEmptyFields: options.showEmptyFields || false,
      dateFormat: 'short',
      maxFieldLength: 150,
    });

    console.log(formattedOutput);

    // Show search summary
    const withTags = bookmarks.filter(b => b.properties.tags.length > 0);
    const withAttention = bookmarks.filter(b => b.properties.attn);
    const withContent = bookmarks.filter(b => 
      b.properties.notes || b.properties.what || b.properties.why || b.properties.quotes
    );

    logger.info(`\n=== SEARCH SUMMARY ===`);
    logger.info(`Found: ${bookmarks.length} bookmarks ${searchDescription}`);
    logger.info(`With tags: ${withTags.length}`);
    logger.info(`With attention: ${withAttention.length}`);
    logger.info(`With content: ${withContent.length}`);

  } catch (error) {
    logger.error('Search failed:', error);
    throw error;
  }
}

/**
 * Run search command (for use as standalone script)
 */
export async function runSearchCommand(options: SearchCommandOptions): Promise<void> {
  const { validateConfig } = await import('../config');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Notion client
    const notionClient = new NotionClient();
    
    // Run the search
    await searchBookmarks(notionClient, options);
    
  } catch (error) {
    logger.error('Search command failed:', error);
    process.exit(1);
  }
}
