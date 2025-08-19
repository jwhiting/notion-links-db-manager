import { Client } from '@notionhq/client';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Notion database updater for modifying bookmark tags
 */

export class NotionUpdater {
  private client: Client;

  constructor() {
    this.client = new Client({
      auth: config.notion.apiKey,
    });
  }

  /**
   * Add tags to a bookmark (preserves existing tags)
   */
  async addTagsToBookmark(bookmarkId: string, newTags: string[]): Promise<void> {
    if (newTags.length === 0) {
      logger.info('No tags to add');
      return;
    }

    try {
      logger.info(`Adding tags to bookmark ${bookmarkId}: ${newTags.join(', ')}`);

      // First, get the current tags
      const page = await this.client.pages.retrieve({ page_id: bookmarkId });
      
      if (!('properties' in page)) {
        throw new Error('Invalid page response');
      }

      const currentTagsProperty = page.properties['Tags'];
      let currentTags: string[] = [];

      if (currentTagsProperty && currentTagsProperty.type === 'multi_select') {
        currentTags = currentTagsProperty.multi_select.map(option => option.name);
      }

      // Combine current tags with new tags (avoid duplicates)
      const allTags = [...new Set([...currentTags, ...newTags])];

      // Update the page with the combined tags
      await this.client.pages.update({
        page_id: bookmarkId,
        properties: {
          Tags: {
            multi_select: allTags.map(tag => ({ name: tag })),
          },
        },
      });

      logger.info(`Successfully added ${newTags.length} new tags. Total tags: ${allTags.length}`);

    } catch (error) {
      logger.error(`Failed to add tags to bookmark ${bookmarkId}:`, error);
      throw error;
    }
  }

  /**
   * Add a single tag to a bookmark (preserves existing tags)
   */
  async addTagToBookmark(bookmarkId: string, newTag: string): Promise<void> {
    await this.addTagsToBookmark(bookmarkId, [newTag]);
  }

  /**
   * Replace all tags on a bookmark (overwrites existing tags)
   */
  async replaceTagsOnBookmark(bookmarkId: string, tags: string[]): Promise<void> {
    try {
      logger.info(`Replacing all tags on bookmark ${bookmarkId} with: ${tags.join(', ')}`);

      await this.client.pages.update({
        page_id: bookmarkId,
        properties: {
          Tags: {
            multi_select: tags.map(tag => ({ name: tag })),
          },
        },
      });

      logger.info(`Successfully replaced tags. New tag count: ${tags.length}`);

    } catch (error) {
      logger.error(`Failed to replace tags on bookmark ${bookmarkId}:`, error);
      throw error;
    }
  }

  /**
   * Remove specific tags from a bookmark (preserves other existing tags)
   */
  async removeTagsFromBookmark(bookmarkId: string, tagsToRemove: string[]): Promise<void> {
    if (tagsToRemove.length === 0) {
      logger.info('No tags to remove');
      return;
    }

    try {
      logger.info(`Removing tags from bookmark ${bookmarkId}: ${tagsToRemove.join(', ')}`);

      // First, get the current tags
      const page = await this.client.pages.retrieve({ page_id: bookmarkId });
      
      if (!('properties' in page)) {
        throw new Error('Invalid page response');
      }

      const currentTagsProperty = page.properties['Tags'];
      let currentTags: string[] = [];

      if (currentTagsProperty && currentTagsProperty.type === 'multi_select') {
        currentTags = currentTagsProperty.multi_select.map(option => option.name);
      }

      // Remove the specified tags
      const remainingTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

      // Update the page with the remaining tags
      await this.client.pages.update({
        page_id: bookmarkId,
        properties: {
          Tags: {
            multi_select: remainingTags.map(tag => ({ name: tag })),
          },
        },
      });

      logger.info(`Successfully removed ${tagsToRemove.length} tags. Remaining tags: ${remainingTags.length}`);

    } catch (error) {
      logger.error(`Failed to remove tags from bookmark ${bookmarkId}:`, error);
      throw error;
    }
  }
}
