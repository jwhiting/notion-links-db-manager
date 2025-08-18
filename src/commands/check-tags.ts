import { NotionClient } from '../notion/client';
import { fetchBookmarks } from '../utils/bookmark/fetcher';
import { findUndefinedTags, getAllTagDefinitions, getTagDescription } from '../utils/tag-definitions';
import { logger } from '../utils/logger';

/**
 * Command to check for undefined tags and show tag definitions
 */

export async function checkUndefinedTags(client: NotionClient): Promise<void> {
  try {
    logger.info('Fetching all bookmarks to analyze tags...');

    // Get all bookmarks to extract tags
    const bookmarks = await fetchBookmarks(client, {
      limit: 1000,
      sortBy: 'created',
      sortDirection: 'descending',
    });

    if (bookmarks.length === 0) {
      logger.info('No bookmarks found');
      return;
    }

    // Extract all unique tags from bookmarks
    const allUsedTags = new Set<string>();
    bookmarks.forEach(bookmark => {
      bookmark.properties.tags.forEach(tag => {
        allUsedTags.add(tag);
      });
    });

    const usedTagsArray = Array.from(allUsedTags).sort();
    const undefinedTags = findUndefinedTags(usedTagsArray);

    // Show results
    logger.info(`\n=== TAG ANALYSIS ===`);
    logger.info(`Total bookmarks analyzed: ${bookmarks.length}`);
    logger.info(`Unique tags found: ${usedTagsArray.length}`);
    logger.info(`Undefined tags: ${undefinedTags.length}`);

    if (undefinedTags.length > 0) {
      console.log('\n=== UNDEFINED TAGS ===');
      console.log('These tags are used in your bookmarks but not defined in tag-definitions.txt:\n');
      
      undefinedTags.forEach(tag => {
        // Count usage of each undefined tag
        const usage = bookmarks.filter(b => b.properties.tags.includes(tag)).length;
        console.log(`${tag} (used in ${usage} bookmark${usage === 1 ? '' : 's'})`);
      });
      
      console.log(`\nTo define these tags, add lines to tag-definitions.txt like:`);
      console.log(`#${undefinedTags[0]} Description of what this tag means`);
    } else {
      console.log('\n✅ All tags are defined! No undefined tags found.');
    }

    // Show some defined tags for reference
    const definitions = getAllTagDefinitions();
    if (definitions.length > 0) {
      console.log('\n=== SAMPLE DEFINED TAGS ===');
      definitions.slice(0, 5).forEach(({ tag, description }) => {
        console.log(`#${tag} ${description}`);
      });
      
      if (definitions.length > 5) {
        console.log(`... and ${definitions.length - 5} more defined tags`);
      }
    }

  } catch (error) {
    logger.error('Failed to check tags:', error);
    throw error;
  }
}

/**
 * Show all tag definitions
 */
export async function showTagDefinitions(): Promise<void> {
  try {
    const definitions = getAllTagDefinitions();
    
    if (definitions.length === 0) {
      console.log('No tag definitions found. Create tag-definitions.txt to define your tags.');
      console.log('\nFormat: #tag-name Description of what this tag means');
      return;
    }

    console.log(`\n=== ALL TAG DEFINITIONS (${definitions.length} tags) ===\n`);
    
    definitions.forEach(({ tag, description }) => {
      console.log(`#${tag} ${description}`);
    });

  } catch (error) {
    logger.error('Failed to show tag definitions:', error);
    throw error;
  }
}

/**
 * Look up a specific tag definition
 */
export async function lookupTag(tag: string): Promise<void> {
  try {
    const description = getTagDescription(tag);
    
    if (description) {
      console.log(`\n#${tag} ${description}`);
    } else {
      console.log(`\nTag "${tag}" is not defined in tag-definitions.txt`);
      console.log(`\nTo define it, add a line like:`);
      console.log(`#${tag} Description of what this tag means`);
    }

  } catch (error) {
    logger.error('Failed to lookup tag:', error);
    throw error;
  }
}

/**
 * Run the check tags command (for use as standalone script)
 */
export async function runCheckTagsCommand(): Promise<void> {
  const { validateConfig } = await import('../config');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Notion client
    const notionClient = new NotionClient();
    
    // Run the command
    await checkUndefinedTags(notionClient);
    
  } catch (error) {
    logger.error('Check tags command failed:', error);
    process.exit(1);
  }
}

/**
 * Run the show definitions command (for use as standalone script)
 */
export async function runShowDefinitionsCommand(): Promise<void> {
  try {
    await showTagDefinitions();
  } catch (error) {
    logger.error('Show definitions command failed:', error);
    process.exit(1);
  }
}
