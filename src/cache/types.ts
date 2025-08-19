/**
 * Types for AI suggestion caching system
 */

export interface BookmarkFingerprint {
  id: string;
  title: string;
  url: string;
  notes: string;
  currentTags: string[];
  what: string;
  quotes: string;
  why: string;
  lastEditedTime: string; // ISO string for comparison
}

export interface TagSuggestionCacheEntry {
  fingerprint: BookmarkFingerprint;
  suggestions: {
    suggestedTags: string[];
    reasoning: string;
  };
  cacheType: 'untagged' | 'tag-specific';
  targetTag?: string; // For tag-specific suggestions
  cachedAt: string; // ISO timestamp
}

export interface TagApplicationCacheEntry {
  fingerprint: BookmarkFingerprint;
  targetTag: string;
  result: {
    shouldHaveTag: boolean;
    reasoning: string;
  };
  cachedAt: string; // ISO timestamp
}

export interface CacheStats {
  tagSuggestions: {
    total: number;
    untagged: number;
    tagSpecific: number;
    oldestEntry?: string;
    newestEntry?: string;
  };
  tagApplications: {
    total: number;
    oldestEntry?: string;
    newestEntry?: string;
  };
}

/**
 * Create a fingerprint for a bookmark to detect changes
 */
export function createBookmarkFingerprint(bookmark: {
  id: string;
  properties: {
    name: string;
    url: string;
    notes: string;
    tags: string[];
    what: string;
    quotes: string;
    why: string;
  };
  lastEditedTime: Date;
}): BookmarkFingerprint {
  return {
    id: bookmark.id,
    title: bookmark.properties.name,
    url: bookmark.properties.url,
    notes: bookmark.properties.notes,
    currentTags: [...bookmark.properties.tags].sort(), // Sort for consistent comparison
    what: bookmark.properties.what,
    quotes: bookmark.properties.quotes,
    why: bookmark.properties.why,
    lastEditedTime: bookmark.lastEditedTime.toISOString(),
  };
}

/**
 * Check if a bookmark matches a cached fingerprint
 */
export function fingerprintMatches(
  current: BookmarkFingerprint,
  cached: BookmarkFingerprint
): boolean {
  return (
    current.id === cached.id &&
    current.title === cached.title &&
    current.url === cached.url &&
    current.notes === cached.notes &&
    current.what === cached.what &&
    current.quotes === cached.quotes &&
    current.why === cached.why &&
    current.lastEditedTime === cached.lastEditedTime &&
    JSON.stringify(current.currentTags) === JSON.stringify(cached.currentTags)
  );
}
