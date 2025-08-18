import { NotionClient } from '../notion/client';
import { isFullPage } from '../notion/types';
import { parseBookmarks, hasContent } from '../notion/bookmark-parser';
import { extractAllBlocksText, getBlocksSummary, getStructuredContent } from '../notion/block-parser';
import { logger } from '../utils/logger';

/**
 * Command to analyze database structure and sample content
 */

export async function analyzeDatabase(client: NotionClient): Promise<void> {
  try {
    logger.info('Starting database analysis...');

    // Get database information to understand the schema
    logger.info('Fetching database information...');
    const databaseInfo = await client.getDatabaseInfo();
    
    // Extract and display database schema
    if (databaseInfo && typeof databaseInfo === 'object' && 'properties' in databaseInfo) {
      const properties = (databaseInfo as any).properties;
      logger.info('Database schema:');
      Object.entries(properties).forEach(([key, value]: [string, any]) => {
        logger.info(`  - ${key}: ${value.type || 'unknown type'}`);
      });
    }

    // Query the database to get sample bookmarks
    logger.info('Fetching sample bookmarks...');
    const rawBookmarks = await client.queryDatabase({ pageSize: 10 });
    
    // Filter to full pages and parse them into clean objects
    const fullPages = rawBookmarks.filter(isFullPage);
    const parsedBookmarks = parseBookmarks(fullPages);
    
    logger.info(`Successfully retrieved ${parsedBookmarks.length} parsed bookmarks`);
    
    // Show clean, parsed bookmark data
    logger.info('\n=== PARSED BOOKMARKS ===');
    parsedBookmarks.forEach((bookmark, index) => {
      logger.info(`\n${index + 1}. "${bookmark.properties.name}"`);
      logger.info(`   URL: ${bookmark.properties.url}`);
      logger.info(`   Created: ${bookmark.createdTime.toISOString().split('T')[0]}`);
      logger.info(`   Attention: ${bookmark.properties.attn ? '⚠️ YES' : 'No'}`);
      
      if (bookmark.properties.tags.length > 0) {
        logger.info(`   Tags: ${bookmark.properties.tags.join(', ')}`);
      }
      
      if (bookmark.properties.what) {
        logger.info(`   What: ${bookmark.properties.what.substring(0, 100)}${bookmark.properties.what.length > 100 ? '...' : ''}`);
      }
      
      if (bookmark.properties.why) {
        logger.info(`   Why: ${bookmark.properties.why.substring(0, 100)}${bookmark.properties.why.length > 100 ? '...' : ''}`);
      }
      
      if (bookmark.properties.notes) {
        logger.info(`   Notes: ${bookmark.properties.notes.substring(0, 100)}${bookmark.properties.notes.length > 100 ? '...' : ''}`);
      }
      
      if (bookmark.properties.quotes) {
        logger.info(`   Quotes: ${bookmark.properties.quotes.substring(0, 100)}${bookmark.properties.quotes.length > 100 ? '...' : ''}`);
      }
    });
    
    // Show some statistics
    const withContent = parsedBookmarks.filter(hasContent);
    const withTags = parsedBookmarks.filter(b => b.properties.tags.length > 0);
    const withAttention = parsedBookmarks.filter(b => b.properties.attn);
    
    logger.info('\n=== STATISTICS ===');
    logger.info(`Total bookmarks: ${parsedBookmarks.length}`);
    logger.info(`With content (notes/what/why/quotes): ${withContent.length}`);
    logger.info(`With tags: ${withTags.length}`);
    logger.info(`Marked for attention: ${withAttention.length}`);

    // Let's examine the actual page content of the first bookmark
    if (parsedBookmarks.length > 0) {
      const firstBookmark = parsedBookmarks[0]!; // We know it exists from the length check
      logger.info(`\n=== PAGE CONTENT ANALYSIS ===`);
      logger.info(`Analyzing page content for: "${firstBookmark.properties.name}"`);
      
      try {
        const pageBlocks = await client.getAllPageContent(firstBookmark.id);
        logger.info(`Found ${pageBlocks.length} content blocks in this page`);
        
        if (pageBlocks.length > 0) {
          // Show block types summary
          const blocksSummary = getBlocksSummary(pageBlocks);
          logger.info('Block types found:');
          Object.entries(blocksSummary).forEach(([type, count]) => {
            logger.info(`  - ${type}: ${count}`);
          });
          
          // Extract and show the actual text content
          const pageText = extractAllBlocksText(pageBlocks);
          if (pageText) {
            logger.info(`\nPage content (${pageText.length} characters):`);
            logger.info('---');
            logger.info(pageText.substring(0, 500) + (pageText.length > 500 ? '...' : ''));
            logger.info('---');
          } else {
            logger.info('No text content found in blocks');
          }
          
          // Show structured content
          const structuredContent = getStructuredContent(pageBlocks);
          if (structuredContent.length > 0) {
            logger.info(`\nStructured content (${structuredContent.length} blocks):`);
            structuredContent.slice(0, 5).forEach((block, index) => {
              const prefix = block.type === 'heading_1' ? '# ' : 
                           block.type === 'heading_2' ? '## ' : 
                           block.type === 'heading_3' ? '### ' : '  ';
              logger.info(`${index + 1}. [${block.type}] ${prefix}${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}`);
            });
          }
        } else {
          logger.info('This page has no content blocks (empty page)');
        }
      } catch (error) {
        logger.error('Failed to retrieve page content:', error);
      }
    }

  } catch (error) {
    logger.error('Analysis failed:', error);
    throw error;
  }
}

/**
 * Run the analyze command (for use as standalone script)
 */
export async function runAnalyzeCommand(): Promise<void> {
  const { validateConfig } = await import('../config');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Notion client
    const notionClient = new NotionClient();
    
    // Run the command
    await analyzeDatabase(notionClient);
    
  } catch (error) {
    logger.error('Command failed:', error);
    process.exit(1);
  }
}
