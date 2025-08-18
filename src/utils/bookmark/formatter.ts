import type { Bookmark } from '../../notion/types';

/**
 * Utilities for formatting bookmark output
 */

export interface FormatOptions {
  showEmptyFields?: boolean;
  dateFormat?: 'iso' | 'short' | 'relative';
  maxFieldLength?: number;
}

/**
 * Format a single bookmark in the requested format:
 * {title}
 *     {url}
 *     {created} {attn ? ATTN : ''}
 *     {k: v}
 *     ...
 */
export function formatBookmark(bookmark: Bookmark, options: FormatOptions = {}): string {
  const {
    showEmptyFields = false,
    dateFormat = 'short',
    maxFieldLength = 100,
  } = options;

  const lines: string[] = [];
  const props = bookmark.properties;

  // Title (first line)
  lines.push(props.name || 'Untitled');

  // URL (indented)
  lines.push(`    ${props.url || 'No URL'}`);

  // Created date and attention flag
  const createdDate = formatDate(bookmark.createdTime, dateFormat);
  const attnFlag = props.attn ? ' ATTN' : '';
  lines.push(`    ${createdDate}${attnFlag}`);

  // Additional fields (k: v format)
  const additionalFields = getAdditionalFields(bookmark, showEmptyFields, maxFieldLength);
  additionalFields.forEach(field => {
    lines.push(`    ${field}`);
  });

  return lines.join('\n');
}

/**
 * Format multiple bookmarks
 */
export function formatBookmarks(bookmarks: Bookmark[], options: FormatOptions = {}): string {
  return bookmarks
    .map(bookmark => formatBookmark(bookmark, options))
    .join('\n\n');
}

/**
 * Get additional fields to display (excluding title, url, created, which are handled separately)
 */
function getAdditionalFields(
  bookmark: Bookmark,
  showEmptyFields: boolean,
  maxFieldLength: number
): string[] {
  const fields: string[] = [];
  const props = bookmark.properties;

  // Tags
  if (props.tags.length > 0) {
    fields.push(`tags: [${props.tags.join(', ')}]`);
  } else if (showEmptyFields) {
    fields.push('tags: []');
  }

  // Notes
  if (props.notes || showEmptyFields) {
    const notes = truncateText(props.notes, maxFieldLength);
    fields.push(`notes: ${notes || '(empty)'}`);
  }

  // What
  if (props.what || showEmptyFields) {
    const what = truncateText(props.what, maxFieldLength);
    fields.push(`what: ${what || '(empty)'}`);
  }

  // Why
  if (props.why || showEmptyFields) {
    const why = truncateText(props.why, maxFieldLength);
    fields.push(`why: ${why || '(empty)'}`);
  }

  // Quotes
  if (props.quotes || showEmptyFields) {
    const quotes = truncateText(props.quotes, maxFieldLength);
    fields.push(`quotes: ${quotes || '(empty)'}`);
  }

  // Last edited (if different from created)
  const daysDiff = Math.abs(bookmark.lastEditedTime.getTime() - bookmark.createdTime.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 1) { // Only show if edited more than 1 day after creation
    fields.push(`last_edited: ${formatDate(bookmark.lastEditedTime, 'short')}`);
  }

  return fields;
}

/**
 * Format a date according to the specified format
 */
function formatDate(date: Date, format: 'iso' | 'short' | 'relative'): string {
  switch (format) {
    case 'iso':
      return date.toISOString().split('T')[0]!;
    case 'short':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'relative':
      return getRelativeTime(date);
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Get relative time description (e.g., "2 days ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create a simple summary line for a bookmark
 */
export function getBookmarkSummaryLine(bookmark: Bookmark): string {
  const attn = bookmark.properties.attn ? ' [ATTN]' : '';
  const tags = bookmark.properties.tags.length > 0 ? ` (${bookmark.properties.tags.join(', ')})` : '';
  return `${bookmark.properties.name}${tags}${attn} - ${bookmark.properties.url}`;
}
