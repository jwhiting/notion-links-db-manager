import { Client } from '@notionhq/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { NotionPage, QueryOptions } from './types';

export class NotionClient {
  private client: Client;
  private databaseId: string;

  constructor() {
    this.client = new Client({
      auth: config.notion.apiKey,
    });
    this.databaseId = config.notion.databaseId;
    logger.info('Notion client initialized');
  }

  /**
   * Query the bookmarks database
   */
  async queryDatabase(options: QueryOptions = {}): Promise<NotionPage[]> {
    try {
      logger.debug('Querying database with options:', options);
      
      const queryParams: any = {
        database_id: this.databaseId,
      };
      
      if (options.startCursor) {
        queryParams.start_cursor = options.startCursor;
      }
      
      if (options.pageSize) {
        queryParams.page_size = options.pageSize;
      } else {
        queryParams.page_size = 100;
      }
      
      if (options.filter) {
        queryParams.filter = options.filter;
      }
      
      if (options.sorts) {
        queryParams.sorts = options.sorts;
      }
      
      const response = await this.client.databases.query(queryParams);

      logger.info(`Retrieved ${response.results.length} pages from database`);
      return response.results;
    } catch (error) {
      logger.error('Failed to query database:', error);
      throw error;
    }
  }

  /**
   * Get all pages from the database (handles pagination)
   */
  async getAllPages(): Promise<NotionPage[]> {
    const allPages: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    try {
      while (hasMore) {
        const queryParams: any = {
          database_id: this.databaseId,
          page_size: 100,
        };
        
        if (startCursor) {
          queryParams.start_cursor = startCursor;
        }
        
        const response = await this.client.databases.query(queryParams);

        allPages.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;

        logger.debug(`Retrieved ${response.results.length} pages, total: ${allPages.length}`);
      }

      logger.info(`Retrieved all ${allPages.length} pages from database`);
      return allPages;
    } catch (error) {
      logger.error('Failed to get all pages:', error);
      throw error;
    }
  }

  /**
   * Get database metadata
   */
  async getDatabaseInfo(): Promise<unknown> {
    try {
      const response = await this.client.databases.retrieve({
        database_id: this.databaseId,
      });
      
      logger.info('Retrieved database information');
      return response;
    } catch (error) {
      logger.error('Failed to get database info:', error);
      throw error;
    }
  }

  /**
   * Retrieve the content blocks of a specific page
   */
  async getPageContent(pageId: string): Promise<any[]> {
    try {
      const response = await this.client.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      logger.debug(`Retrieved ${response.results.length} blocks for page ${pageId}`);
      return response.results;
    } catch (error) {
      logger.error(`Failed to get page content for ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve all content blocks from a page (handles pagination)
   */
  async getAllPageContent(pageId: string): Promise<any[]> {
    const allBlocks: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    try {
      while (hasMore) {
        const queryParams: any = {
          block_id: pageId,
          page_size: 100,
        };
        
        if (startCursor) {
          queryParams.start_cursor = startCursor;
        }
        
        const response = await this.client.blocks.children.list(queryParams);

        allBlocks.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;

        logger.debug(`Retrieved ${response.results.length} blocks, total: ${allBlocks.length}`);
      }

      logger.info(`Retrieved all ${allBlocks.length} content blocks for page ${pageId}`);
      return allBlocks;
    } catch (error) {
      logger.error(`Failed to get all page content for ${pageId}:`, error);
      throw error;
    }
  }
}
