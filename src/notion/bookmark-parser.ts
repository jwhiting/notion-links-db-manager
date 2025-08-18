import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Bookmark, BookmarkProperties } from './types';
import {
  extractTitle,
  extractUrl,
  extractRichText,
  extractCheckbox,
  extractMultiSelect,
  extractCreatedTime,
} from './property-extractors';

/**
 * Parse a raw Notion page into a clean Bookmark object
 */
export function parseBookmark(page: PageObjectResponse): Bookmark {
  const properties = page.properties;
  
  const bookmarkProperties: BookmarkProperties = {
    name: extractTitle(properties['Name']),
    url: extractUrl(properties['URL']),
    notes: extractRichText(properties['Notes']),
    attn: extractCheckbox(properties['attn']),
    tags: extractMultiSelect(properties['Tags']),
    what: extractRichText(properties['what']),
    quotes: extractRichText(properties['Quotes']),
    why: extractRichText(properties['why']),
    created: extractCreatedTime(properties['Created']),
  };
  
  return {
    id: page.id,
    properties: bookmarkProperties,
    notionUrl: page.url,
    createdTime: new Date(page.created_time),
    lastEditedTime: new Date(page.last_edited_time),
  };
}

/**
 * Parse multiple Notion pages into clean Bookmark objects
 */
export function parseBookmarks(pages: PageObjectResponse[]): Bookmark[] {
  return pages.map(parseBookmark);
}

/**
 * Get a summary string for a bookmark (useful for logging/display)
 */
export function getBookmarkSummary(bookmark: Bookmark): string {
  const tags = bookmark.properties.tags.length > 0 
    ? ` [${bookmark.properties.tags.join(', ')}]` 
    : '';
  
  return `"${bookmark.properties.name}"${tags} - ${bookmark.properties.url}`;
}

/**
 * Check if a bookmark has any content in the text fields
 */
export function hasContent(bookmark: Bookmark): boolean {
  const { notes, what, quotes, why } = bookmark.properties;
  return !!(notes || what || quotes || why);
}

/**
 * Get all text content from a bookmark (for search/analysis)
 */
export function getAllTextContent(bookmark: Bookmark): string {
  const { name, notes, what, quotes, why, tags } = bookmark.properties;
  
  return [
    name,
    notes,
    what,
    quotes,
    why,
    ...tags,
  ].filter(Boolean).join(' ');
}
