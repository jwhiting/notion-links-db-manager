import { NotionClient } from '../../notion/client';
import { isFullPage } from '../../notion/types';
import { parseBookmarks } from '../../notion/bookmark-parser';
import type { Bookmark } from '../../notion/types';
import { logger } from '../logger';

/**
 * Search and filter utilities for bookmarks using Notion's query API
 */

export interface SearchOptions {
  limit?: number;
  sortBy?: 'created' | 'lastEdited';
  sortDirection?: 'ascending' | 'descending';
}

/**
 * Find bookmarks by tag (uses Notion's multi_select contains filter)
 */
export async function findBookmarksByTag(
  client: NotionClient,
  tag: string,
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info(`Searching for bookmarks with tag: "${tag}"`);

    const filter = {
      property: 'Tags',
      multi_select: {
        contains: tag,
      },
    };

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Found ${bookmarks.length} bookmarks with tag "${tag}"`);
    return bookmarks;
  } catch (error) {
    logger.error(`Failed to search by tag "${tag}":`, error);
    throw error;
  }
}

/**
 * Find bookmarks with any of the specified tags
 */
export async function findBookmarksByAnyTag(
  client: NotionClient,
  tags: string[],
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info(`Searching for bookmarks with any of these tags: ${tags.join(', ')}`);

    const filter = {
      or: tags.map(tag => ({
        property: 'Tags',
        multi_select: {
          contains: tag,
        },
      })),
    };

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Found ${bookmarks.length} bookmarks with any of the specified tags`);
    return bookmarks;
  } catch (error) {
    logger.error(`Failed to search by tags:`, error);
    throw error;
  }
}

/**
 * Find bookmarks with ALL of the specified tags
 */
export async function findBookmarksByAllTags(
  client: NotionClient,
  tags: string[],
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info(`Searching for bookmarks with ALL of these tags: ${tags.join(', ')}`);

    const filter = {
      and: tags.map(tag => ({
        property: 'Tags',
        multi_select: {
          contains: tag,
        },
      })),
    };

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Found ${bookmarks.length} bookmarks with all specified tags`);
    return bookmarks;
  } catch (error) {
    logger.error(`Failed to search by all tags:`, error);
    throw error;
  }
}

/**
 * Find bookmarks marked for attention
 */
export async function findAttentionBookmarks(
  client: NotionClient,
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info('Searching for bookmarks marked for attention');

    const filter = {
      property: 'attn',
      checkbox: {
        equals: true,
      },
    };

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Found ${bookmarks.length} bookmarks marked for attention`);
    return bookmarks;
  } catch (error) {
    logger.error('Failed to search for attention bookmarks:', error);
    throw error;
  }
}

/**
 * Find bookmarks with content in specific fields
 */
export async function findBookmarksWithContent(
  client: NotionClient,
  field: 'notes' | 'what' | 'why' | 'quotes',
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info(`Searching for bookmarks with content in "${field}" field`);

    // Map field names to Notion property names
    const propertyMap = {
      notes: 'Notes',
      what: 'what',
      why: 'why', 
      quotes: 'Quotes',
    };

    const filter = {
      property: propertyMap[field],
      rich_text: {
        is_not_empty: true,
      },
    };

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Found ${bookmarks.length} bookmarks with content in "${field}"`);
    return bookmarks;
  } catch (error) {
    logger.error(`Failed to search for bookmarks with "${field}" content:`, error);
    throw error;
  }
}

/**
 * Find bookmarks by URL pattern (contains search)
 */
export async function findBookmarksByUrl(
  client: NotionClient,
  urlPattern: string,
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info(`Searching for bookmarks with URL containing: "${urlPattern}"`);

    const filter = {
      property: 'URL',
      url: {
        contains: urlPattern,
      },
    };

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Found ${bookmarks.length} bookmarks with URL containing "${urlPattern}"`);
    return bookmarks;
  } catch (error) {
    logger.error(`Failed to search by URL pattern:`, error);
    throw error;
  }
}

/**
 * Complex search combining multiple criteria
 */
export interface ComplexSearchCriteria {
  tags?: {
    any?: string[];
    all?: string[];
  };
  attention?: boolean;
  hasContent?: ('notes' | 'what' | 'why' | 'quotes')[];
  urlContains?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export async function complexSearch(
  client: NotionClient,
  criteria: ComplexSearchCriteria,
  options: SearchOptions = {}
): Promise<Bookmark[]> {
  const { limit = 100, sortBy = 'created', sortDirection = 'descending' } = options;

  try {
    logger.info('Performing complex search with criteria:', criteria);

    const filters: any[] = [];

    // Tag filters
    if (criteria.tags?.any && criteria.tags.any.length > 0) {
      filters.push({
        or: criteria.tags.any.map(tag => ({
          property: 'Tags',
          multi_select: { contains: tag },
        })),
      });
    }

    if (criteria.tags?.all && criteria.tags.all.length > 0) {
      filters.push(...criteria.tags.all.map(tag => ({
        property: 'Tags',
        multi_select: { contains: tag },
      })));
    }

    // Attention filter
    if (criteria.attention !== undefined) {
      filters.push({
        property: 'attn',
        checkbox: { equals: criteria.attention },
      });
    }

    // Content filters
    if (criteria.hasContent && criteria.hasContent.length > 0) {
      const propertyMap = {
        notes: 'Notes',
        what: 'what',
        why: 'why',
        quotes: 'Quotes',
      };

      filters.push({
        or: criteria.hasContent.map(field => ({
          property: propertyMap[field],
          rich_text: { is_not_empty: true },
        })),
      });
    }

    // URL filter
    if (criteria.urlContains) {
      filters.push({
        property: 'URL',
        url: { contains: criteria.urlContains },
      });
    }

    // Date filters
    if (criteria.createdAfter) {
      filters.push({
        property: 'Created',
        created_time: { after: criteria.createdAfter.toISOString() },
      });
    }

    if (criteria.createdBefore) {
      filters.push({
        property: 'Created',
        created_time: { before: criteria.createdBefore.toISOString() },
      });
    }

    // Combine all filters with AND
    const filter = filters.length > 1 ? { and: filters } : filters[0];

    const sorts = [{
      property: sortBy === 'created' ? 'Created' : 'Last edited',
      direction: sortDirection,
    }];

    const rawBookmarks = await client.queryDatabase({
      filter,
      sorts,
      pageSize: limit,
    });

    const fullPages = rawBookmarks.filter(isFullPage);
    const bookmarks = parseBookmarks(fullPages);

    logger.info(`Complex search returned ${bookmarks.length} bookmarks`);
    return bookmarks;
  } catch (error) {
    logger.error('Complex search failed:', error);
    throw error;
  }
}
