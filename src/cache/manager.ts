import * as fs from 'fs';
import * as path from 'path';
import {
  TagSuggestionCacheEntry,
  TagApplicationCacheEntry,
  BookmarkFingerprint,
  CacheStats,
  fingerprintMatches,
} from './types';
import { logger } from '../utils/logger';

/**
 * AI suggestion cache manager for faster interactive workflows
 */

export class CacheManager {
  private cacheDir: string;
  private tagSuggestionsFile: string;
  private tagApplicationsFile: string;

  constructor() {
    // Find project root
    let currentDir = __dirname;
    while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, 'package.json'))) {
      currentDir = path.dirname(currentDir);
    }

    this.cacheDir = path.join(currentDir, '.ai-cache');
    this.tagSuggestionsFile = path.join(this.cacheDir, 'tag-suggestions.json');
    this.tagApplicationsFile = path.join(this.cacheDir, 'tag-applications.json');

    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
        logger.debug(`Created cache directory: ${this.cacheDir}`);
      }
    } catch (error) {
      logger.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Load tag suggestion cache entries
   */
  private loadTagSuggestions(): TagSuggestionCacheEntry[] {
    try {
      if (!fs.existsSync(this.tagSuggestionsFile)) {
        return [];
      }
      const data = fs.readFileSync(this.tagSuggestionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load tag suggestions cache:', error);
      return [];
    }
  }

  /**
   * Save tag suggestion cache entries
   */
  private saveTagSuggestions(entries: TagSuggestionCacheEntry[]): void {
    try {
      fs.writeFileSync(this.tagSuggestionsFile, JSON.stringify(entries, null, 2));
      logger.debug(`Saved ${entries.length} tag suggestion cache entries`);
    } catch (error) {
      logger.error('Failed to save tag suggestions cache:', error);
    }
  }

  /**
   * Load tag application cache entries
   */
  private loadTagApplications(): TagApplicationCacheEntry[] {
    try {
      if (!fs.existsSync(this.tagApplicationsFile)) {
        return [];
      }
      const data = fs.readFileSync(this.tagApplicationsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load tag applications cache:', error);
      return [];
    }
  }

  /**
   * Save tag application cache entries
   */
  private saveTagApplications(entries: TagApplicationCacheEntry[]): void {
    try {
      fs.writeFileSync(this.tagApplicationsFile, JSON.stringify(entries, null, 2));
      logger.debug(`Saved ${entries.length} tag application cache entries`);
    } catch (error) {
      logger.error('Failed to save tag applications cache:', error);
    }
  }

  /**
   * Cache tag suggestions for a bookmark
   */
  cacheTagSuggestions(
    fingerprint: BookmarkFingerprint,
    suggestions: { suggestedTags: string[]; reasoning: string },
    cacheType: 'untagged' | 'tag-specific',
    targetTag?: string
  ): void {
    const entries = this.loadTagSuggestions();
    
    // Remove any existing entry for this bookmark and type
    const filteredEntries = entries.filter(entry => 
      !(entry.fingerprint.id === fingerprint.id && 
        entry.cacheType === cacheType &&
        entry.targetTag === targetTag)
    );

    // Add new entry
    const newEntry: TagSuggestionCacheEntry = {
      fingerprint,
      suggestions,
      cacheType,
      ...(targetTag ? { targetTag } : {}),
      cachedAt: new Date().toISOString(),
    };

    filteredEntries.push(newEntry);
    this.saveTagSuggestions(filteredEntries);
  }

  /**
   * Get cached tag suggestions for a bookmark
   */
  getCachedTagSuggestions(
    currentFingerprint: BookmarkFingerprint,
    cacheType: 'untagged' | 'tag-specific',
    targetTag?: string
  ): { suggestedTags: string[]; reasoning: string } | null {
    const entries = this.loadTagSuggestions();
    
    const matchingEntry = entries.find(entry =>
      entry.cacheType === cacheType &&
      entry.targetTag === targetTag &&
      entry.fingerprint.id === currentFingerprint.id &&
      fingerprintMatches(currentFingerprint, entry.fingerprint)
    );

    if (matchingEntry) {
      logger.debug(`Cache hit for bookmark ${currentFingerprint.id} (${cacheType})`);
      return matchingEntry.suggestions;
    }

    logger.debug(`Cache miss for bookmark ${currentFingerprint.id} (${cacheType})`);
    return null;
  }

  /**
   * Cache tag application result for a bookmark
   */
  cacheTagApplication(
    fingerprint: BookmarkFingerprint,
    targetTag: string,
    result: { shouldHaveTag: boolean; reasoning: string }
  ): void {
    const entries = this.loadTagApplications();
    
    // Remove any existing entry for this bookmark and tag
    const filteredEntries = entries.filter(entry => 
      !(entry.fingerprint.id === fingerprint.id && entry.targetTag === targetTag)
    );

    // Add new entry
    const newEntry: TagApplicationCacheEntry = {
      fingerprint,
      targetTag,
      result,
      cachedAt: new Date().toISOString(),
    };

    filteredEntries.push(newEntry);
    this.saveTagApplications(filteredEntries);
  }

  /**
   * Get cached tag application result for a bookmark
   */
  getCachedTagApplication(
    currentFingerprint: BookmarkFingerprint,
    targetTag: string
  ): { shouldHaveTag: boolean; reasoning: string } | null {
    const entries = this.loadTagApplications();
    
    const matchingEntry = entries.find(entry =>
      entry.targetTag === targetTag &&
      entry.fingerprint.id === currentFingerprint.id &&
      fingerprintMatches(currentFingerprint, entry.fingerprint)
    );

    if (matchingEntry) {
      logger.debug(`Cache hit for bookmark ${currentFingerprint.id} tag ${targetTag}`);
      return matchingEntry.result;
    }

    logger.debug(`Cache miss for bookmark ${currentFingerprint.id} tag ${targetTag}`);
    return null;
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    try {
      if (fs.existsSync(this.tagSuggestionsFile)) {
        fs.unlinkSync(this.tagSuggestionsFile);
      }
      if (fs.existsSync(this.tagApplicationsFile)) {
        fs.unlinkSync(this.tagApplicationsFile);
      }
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const tagSuggestions = this.loadTagSuggestions();
    const tagApplications = this.loadTagApplications();

    const tagSuggestionsUntagged = tagSuggestions.filter(e => e.cacheType === 'untagged');
    const tagSuggestionsTagSpecific = tagSuggestions.filter(e => e.cacheType === 'tag-specific');

    const tagSuggestionDates = tagSuggestions.map(e => e.cachedAt).sort();
    const tagApplicationDates = tagApplications.map(e => e.cachedAt).sort();

    return {
      tagSuggestions: {
        total: tagSuggestions.length,
        untagged: tagSuggestionsUntagged.length,
        tagSpecific: tagSuggestionsTagSpecific.length,
        ...(tagSuggestionDates[0] ? { oldestEntry: tagSuggestionDates[0] } : {}),
        ...(tagSuggestionDates[tagSuggestionDates.length - 1] ? { newestEntry: tagSuggestionDates[tagSuggestionDates.length - 1] } : {}),
      },
      tagApplications: {
        total: tagApplications.length,
        ...(tagApplicationDates[0] ? { oldestEntry: tagApplicationDates[0] } : {}),
        ...(tagApplicationDates[tagApplicationDates.length - 1] ? { newestEntry: tagApplicationDates[tagApplicationDates.length - 1] } : {}),
      },
    };
  }

  /**
   * Remove stale cache entries (older than specified days)
   */
  cleanStaleEntries(maxAgeDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    const cutoffISO = cutoffDate.toISOString();

    // Clean tag suggestions
    const tagSuggestions = this.loadTagSuggestions();
    const freshTagSuggestions = tagSuggestions.filter(entry => entry.cachedAt > cutoffISO);
    const removedTagSuggestions = tagSuggestions.length - freshTagSuggestions.length;

    if (removedTagSuggestions > 0) {
      this.saveTagSuggestions(freshTagSuggestions);
      logger.info(`Removed ${removedTagSuggestions} stale tag suggestion entries`);
    }

    // Clean tag applications
    const tagApplications = this.loadTagApplications();
    const freshTagApplications = tagApplications.filter(entry => entry.cachedAt > cutoffISO);
    const removedTagApplications = tagApplications.length - freshTagApplications.length;

    if (removedTagApplications > 0) {
      this.saveTagApplications(freshTagApplications);
      logger.info(`Removed ${removedTagApplications} stale tag application entries`);
    }
  }
}
