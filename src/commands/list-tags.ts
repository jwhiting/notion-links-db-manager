import { NotionClient } from '../notion/client';
import { fetchBookmarks } from '../utils/bookmark/fetcher';
import { logger } from '../utils/logger';

/**
 * Command to list all unique tags across all bookmarks
 */

export interface ListTagsOptions {
  showCounts?: boolean;
  sortBy?: 'name' | 'count';
  sortDirection?: 'asc' | 'desc';
}

export async function listAllTags(
  client: NotionClient,
  options: ListTagsOptions = {}
): Promise<void> {
  const {
    showCounts = true,
    sortBy = 'count',
    sortDirection = 'desc',
  } = options;

  try {
    logger.info('Fetching all bookmarks to extract tags...');

    // Fetch all bookmarks (we need to do this to get all tags)
    const bookmarks = await fetchBookmarks(client, {
      limit: 1000, // Get a large number to capture most bookmarks
      sortBy: 'created',
      sortDirection: 'descending',
    });

    if (bookmarks.length === 0) {
      logger.info('No bookmarks found');
      return;
    }

    logger.info(`Analyzing tags from ${bookmarks.length} bookmarks...`);

    // Extract and count all tags
    const tagCounts = new Map<string, number>();
    let totalTaggedBookmarks = 0;

    bookmarks.forEach(bookmark => {
      if (bookmark.properties.tags.length > 0) {
        totalTaggedBookmarks++;
        bookmark.properties.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Convert to array and sort
    const tagEntries = Array.from(tagCounts.entries());
    
    if (sortBy === 'name') {
      tagEntries.sort((a, b) => {
        const comparison = a[0].localeCompare(b[0]);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // Sort by count
      tagEntries.sort((a, b) => {
        const comparison = a[1] - b[1];
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    if (tagEntries.length === 0) {
      logger.info('No tags found in any bookmarks');
      return;
    }

    // Display results
    logger.info(`\n=== ALL TAGS (${tagEntries.length} unique tags) ===\n`);

    if (showCounts) {
      // Show tags with counts
      const maxTagLength = Math.max(...tagEntries.map(([tag]) => tag.length));
      const maxCountLength = Math.max(...tagEntries.map(([, count]) => count.toString().length));

      tagEntries.forEach(([tag, count]) => {
        const tagPadded = tag.padEnd(maxTagLength);
        const countPadded = count.toString().padStart(maxCountLength);
        console.log(`${tagPadded} : ${countPadded} bookmark${count === 1 ? '' : 's'}`);
      });
    } else {
      // Show just tag names
      tagEntries.forEach(([tag]) => {
        console.log(tag);
      });
    }

    // Show summary statistics
    const totalTags = tagEntries.reduce((sum, [, count]) => sum + count, 0);
    const avgTagsPerBookmark = (totalTags / totalTaggedBookmarks).toFixed(1);
    const untaggedBookmarks = bookmarks.length - totalTaggedBookmarks;

    logger.info(`\n=== TAG STATISTICS ===`);
    logger.info(`Total bookmarks: ${bookmarks.length}`);
    logger.info(`Tagged bookmarks: ${totalTaggedBookmarks}`);
    logger.info(`Untagged bookmarks: ${untaggedBookmarks}`);
    logger.info(`Unique tags: ${tagEntries.length}`);
    logger.info(`Total tag applications: ${totalTags}`);
    logger.info(`Average tags per tagged bookmark: ${avgTagsPerBookmark}`);

    // Show most and least used tags
    if (tagEntries.length > 0) {
      const mostUsed = tagEntries[0];
      const leastUsed = tagEntries[tagEntries.length - 1];
      
      logger.info(`\nMost used tag: "${mostUsed![0]}" (${mostUsed![1]} bookmarks)`);
      if (tagEntries.length > 1) {
        logger.info(`Least used tag: "${leastUsed![0]}" (${leastUsed![1]} bookmark${leastUsed![1] === 1 ? '' : 's'})`);
      }
    }

    // Show tags used only once (potential cleanup candidates)
    const singleUseTags = tagEntries.filter(([, count]) => count === 1);
    if (singleUseTags.length > 0) {
      logger.info(`\nTags used only once (${singleUseTags.length}): ${singleUseTags.map(([tag]) => tag).join(', ')}`);
    }

  } catch (error) {
    logger.error('Failed to list tags:', error);
    throw error;
  }
}

/**
 * Run the list tags command (for use as standalone script)
 */
export async function runListTagsCommand(options: ListTagsOptions = {}): Promise<void> {
  const { validateConfig } = await import('../config');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Notion client
    const notionClient = new NotionClient();
    
    // Run the command
    await listAllTags(notionClient, options);
    
  } catch (error) {
    logger.error('List tags command failed:', error);
    process.exit(1);
  }
}
