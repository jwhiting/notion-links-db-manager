import { NotionClient } from '../notion/client';
import { suggestTagsForBookmark, shouldBookmarkHaveTag } from '../ai/client';
import { getAllTagDefinitions, getTagDescription } from '../utils/tag-definitions';
import { fetchBookmarks } from '../utils/bookmark/fetcher';
import { CacheManager } from '../cache/manager';
import { createBookmarkFingerprint } from '../cache/types';
import { logger } from '../utils/logger';
import { showProgress } from '../utils/interactive-cli';

/**
 * Commands for warming up the AI suggestion cache
 */

/**
 * Warm cache with tag suggestions for all untagged bookmarks
 */
export async function warmCacheUntagged(client: NotionClient): Promise<void> {
  const cacheManager = new CacheManager();
  const availableTags = getAllTagDefinitions();

  try {
    logger.info('Fetching all bookmarks to find untagged ones...');

    // Get all bookmarks with no tags
    const allBookmarks = await fetchBookmarks(client, { limit: 1000 });
    const untaggedBookmarks = allBookmarks.filter(
      bookmark => bookmark.properties.tags.length === 0
    );

    if (untaggedBookmarks.length === 0) {
      console.log('✅ No untagged bookmarks found!');
      return;
    }

    console.log(`\n🔥 Warming cache for ${untaggedBookmarks.length} untagged bookmarks...`);
    console.log('This will pre-compute AI suggestions for faster interactive sessions.\n');

    let processedCount = 0;
    let cachedCount = 0;
    let skippedCount = 0;

    for (const bookmark of untaggedBookmarks) {
      processedCount++;
      showProgress(processedCount, untaggedBookmarks.length, bookmark.properties.name);

      try {
        const fingerprint = createBookmarkFingerprint(bookmark);

        // Check if already cached
        const existingCache = cacheManager.getCachedTagSuggestions(fingerprint, 'untagged');
        if (existingCache) {
          skippedCount++;
          logger.debug(`Skipping ${bookmark.id} - already cached`);
          continue;
        }

        // Get AI suggestions
        const suggestions = await suggestTagsForBookmark(
          {
            title: bookmark.properties.name,
            url: bookmark.properties.url,
            notes: bookmark.properties.notes,
            currentTags: bookmark.properties.tags,
            what: bookmark.properties.what,
            quotes: bookmark.properties.quotes,
            why: bookmark.properties.why,
          },
          availableTags
        );

        // Cache the results
        cacheManager.cacheTagSuggestions(fingerprint, suggestions, 'untagged');
        cachedCount++;

        logger.debug(`Cached suggestions for ${bookmark.id}: ${suggestions.suggestedTags.join(', ')}`);

      } catch (error) {
        logger.error(`Error processing bookmark ${bookmark.id}:`, error);
        continue;
      }
    }

    console.log(`\n🎉 Cache warming completed!`);
    console.log(`📊 Processed: ${processedCount} bookmarks`);
    console.log(`💾 Cached: ${cachedCount} new entries`);
    console.log(`⏭️  Skipped: ${skippedCount} already cached`);

  } catch (error) {
    logger.error('Failed to warm cache for untagged bookmarks:', error);
    throw error;
  }
}

/**
 * Warm cache with tag application results for a specific tag
 */
export async function warmCacheForTag(client: NotionClient, targetTag: string): Promise<void> {
  const cacheManager = new CacheManager();
  const tagDescription = getTagDescription(targetTag);

  if (!tagDescription) {
    console.log(`❌ Tag "${targetTag}" is not defined in tag-definitions.txt`);
    return;
  }

  try {
    logger.info(`Fetching all bookmarks to analyze for tag ${targetTag}...`);

    // Get all bookmarks that don't already have this tag
    const allBookmarks = await fetchBookmarks(client, { limit: 1000 });
    const candidateBookmarks = allBookmarks.filter(
      bookmark => !bookmark.properties.tags.includes(targetTag)
    );

    if (candidateBookmarks.length === 0) {
      console.log(`✅ All bookmarks already have tag ${targetTag} or no candidates found`);
      return;
    }

    console.log(`\n🔥 Warming cache for tag ${targetTag} across ${candidateBookmarks.length} bookmarks...`);
    console.log(`Tag definition: ${tagDescription}`);
    console.log('This will pre-compute AI decisions for faster interactive sessions.\n');

    let processedCount = 0;
    let cachedCount = 0;
    let skippedCount = 0;

    for (const bookmark of candidateBookmarks) {
      processedCount++;
      showProgress(processedCount, candidateBookmarks.length, bookmark.properties.name);

      try {
        const fingerprint = createBookmarkFingerprint(bookmark);

        // Check if already cached
        const existingCache = cacheManager.getCachedTagApplication(fingerprint, targetTag);
        if (existingCache) {
          skippedCount++;
          logger.debug(`Skipping ${bookmark.id} - already cached`);
          continue;
        }

        // Get AI decision
        const aiResult = await shouldBookmarkHaveTag(
          {
            title: bookmark.properties.name,
            url: bookmark.properties.url,
            notes: bookmark.properties.notes,
            currentTags: bookmark.properties.tags,
            what: bookmark.properties.what,
            quotes: bookmark.properties.quotes,
            why: bookmark.properties.why,
          },
          { tag: targetTag, description: tagDescription }
        );

        // Cache the results
        cacheManager.cacheTagApplication(fingerprint, targetTag, aiResult);
        cachedCount++;

        logger.debug(`Cached decision for ${bookmark.id} + ${targetTag}: ${aiResult.shouldHaveTag}`);

      } catch (error) {
        logger.error(`Error processing bookmark ${bookmark.id}:`, error);
        continue;
      }
    }

    console.log(`\n🎉 Cache warming completed for tag ${targetTag}!`);
    console.log(`📊 Processed: ${processedCount} bookmarks`);
    console.log(`💾 Cached: ${cachedCount} new entries`);
    console.log(`⏭️  Skipped: ${skippedCount} already cached`);

  } catch (error) {
    logger.error(`Failed to warm cache for tag ${targetTag}:`, error);
    throw error;
  }
}

/**
 * Show cache statistics and status
 */
export async function showCacheStatus(): Promise<void> {
  const cacheManager = new CacheManager();

  try {
    const stats = cacheManager.getCacheStats();

    console.log('\n📊 AI SUGGESTION CACHE STATUS\n');

    console.log('🏷️  Tag Suggestions:');
    console.log(`   Total entries: ${stats.tagSuggestions.total}`);
    console.log(`   Untagged bookmarks: ${stats.tagSuggestions.untagged}`);
    console.log(`   Tag-specific: ${stats.tagSuggestions.tagSpecific}`);
    if (stats.tagSuggestions.oldestEntry) {
      console.log(`   Oldest entry: ${new Date(stats.tagSuggestions.oldestEntry).toLocaleString()}`);
    }
    if (stats.tagSuggestions.newestEntry) {
      console.log(`   Newest entry: ${new Date(stats.tagSuggestions.newestEntry).toLocaleString()}`);
    }

    console.log('\n🎯 Tag Applications:');
    console.log(`   Total entries: ${stats.tagApplications.total}`);
    if (stats.tagApplications.oldestEntry) {
      console.log(`   Oldest entry: ${new Date(stats.tagApplications.oldestEntry).toLocaleString()}`);
    }
    if (stats.tagApplications.newestEntry) {
      console.log(`   Newest entry: ${new Date(stats.tagApplications.newestEntry).toLocaleString()}`);
    }

    if (stats.tagSuggestions.total === 0 && stats.tagApplications.total === 0) {
      console.log('\n💡 Cache is empty. Use cache warming commands to pre-compute suggestions:');
      console.log('   npm run warm-cache-untagged');
      console.log('   npm run warm-cache-for-tag [tag-name]');
    } else {
      console.log('\n✅ Cache is ready for fast interactive sessions!');
    }

  } catch (error) {
    logger.error('Failed to show cache status:', error);
    throw error;
  }
}

/**
 * Clear the entire cache
 */
export async function clearCache(): Promise<void> {
  const cacheManager = new CacheManager();

  try {
    const stats = cacheManager.getCacheStats();
    const totalEntries = stats.tagSuggestions.total + stats.tagApplications.total;

    if (totalEntries === 0) {
      console.log('✅ Cache is already empty');
      return;
    }

    cacheManager.clearCache();
    console.log(`🗑️  Cleared cache (${totalEntries} entries removed)`);

  } catch (error) {
    logger.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Clean stale cache entries
 */
export async function cleanStaleCache(maxAgeDays: number = 30): Promise<void> {
  const cacheManager = new CacheManager();

  try {
    console.log(`🧹 Cleaning cache entries older than ${maxAgeDays} days...`);
    cacheManager.cleanStaleEntries(maxAgeDays);
    console.log('✅ Stale cache cleanup completed');

  } catch (error) {
    logger.error('Failed to clean stale cache entries:', error);
    throw error;
  }
}
