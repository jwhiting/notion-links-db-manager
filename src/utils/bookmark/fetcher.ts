import { NotionClient } from '../../notion/client';
import { isFullPage } from '../../notion/types';
import { parseBookmarks } from '../../notion/bookmark-parser';
import type { Bookmark } from '../../notion/types';
import { logger } from '../logger';

/**
 * Shared utilities for fetching and processing bookmarks
 */

export interface FetchOptions {
  limit?: number;
  sortBy?: 'created' | 'lastEdited';
  sortDirection?: 'ascending' | 'descending';
}

/**
 * Fetch bookmarks with sorting and filtering options
 */
export async function fetchBookmarks(
  client: NotionClient,
  options: FetchOptions = {}
): Promise<Bookmark[]> {
  const {
    limit = 100,
    sortBy = 'created',
    sortDirection = 'descending',
  } = options;

  try {
    logger.info(`Fetching up to ${limit} bookmarks, sorted by ${sortBy} (${sortDirection})`);

    // Build sort configuration
    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      pageSize: limit,
      sorts: sorts,
    });

    // Filter to full pages and parse them
    const fullPages = rawBookmarks.filter(isFullPage);
    const parsedBookmarks = parseBookmarks(fullPages);

    logger.info(`Successfully fetched and parsed ${parsedBookmarks.length} bookmarks`);
    return parsedBookmarks;
  } catch (error) {
    logger.error('Failed to fetch bookmarks:', error);
    throw error;
  }
}

/**
 * Get the most recent bookmarks (shorthand for common use case)
 */
export async function getRecentBookmarks(
  client: NotionClient,
  count: number = 20
): Promise<Bookmark[]> {
  return fetchBookmarks(client, {
    limit: count,
    sortBy: 'created',
    sortDirection: 'descending',
  });
}

/**
 * Get bookmarks with attention flag
 */
export async function getAttentionBookmarks(
  client: NotionClient,
  limit: number = 50
): Promise<Bookmark[]> {
  const bookmarks = await fetchBookmarks(client, { limit });
  return bookmarks.filter(bookmark => bookmark.properties.attn);
}

/**
 * Get bookmarks with tags
 */
export async function getTaggedBookmarks(
  client: NotionClient,
  limit: number = 50
): Promise<Bookmark[]> {
  const bookmarks = await fetchBookmarks(client, { limit });
  return bookmarks.filter(bookmark => bookmark.properties.tags.length > 0);
}
