/**
 * Utilities for parsing Notion block content
 * Blocks represent the actual content inside pages (paragraphs, headings, etc.)
 */

// Helper type for any Notion block
type NotionBlock = any;

/**
 * Extract plain text from a rich text array (used in many block types)
 */
function extractRichTextArray(richTextArray: any[]): string {
  if (!Array.isArray(richTextArray)) {
    return '';
  }
  
  return richTextArray
    .map((textObj: any) => textObj.plain_text || '')
    .join('')
    .trim();
}

/**
 * Extract text content from a single block based on its type
 */
export function extractBlockText(block: NotionBlock): string {
  if (!block || !block.type) {
    return '';
  }

  const blockData = block[block.type];
  if (!blockData) {
    return '';
  }

  switch (block.type) {
    case 'paragraph':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'bulleted_list_item':
    case 'numbered_list_item':
    case 'to_do':
    case 'toggle':
    case 'quote':
    case 'callout':
      return extractRichTextArray(blockData.rich_text || []);
    
    case 'code':
      return extractRichTextArray(blockData.rich_text || []);
    
    case 'divider':
      return '---';
    
    case 'bookmark':
      return blockData.url || '';
    
    case 'link_preview':
      return blockData.url || '';
    
    case 'image':
    case 'video':
    case 'file':
      // For media files, we might want to include the caption
      if (blockData.caption && Array.isArray(blockData.caption)) {
        return extractRichTextArray(blockData.caption);
      }
      return blockData.url || '';
    
    case 'table_row':
      // Extract text from all cells in the table row
      if (Array.isArray(blockData.cells)) {
        return blockData.cells
          .map((cell: any[]) => extractRichTextArray(cell))
          .join(' | ');
      }
      return '';
    
    default:
      // For unknown block types, try to extract any rich_text content
      if (blockData.rich_text && Array.isArray(blockData.rich_text)) {
        return extractRichTextArray(blockData.rich_text);
      }
      return '';
  }
}

/**
 * Extract all text content from an array of blocks
 */
export function extractAllBlocksText(blocks: NotionBlock[]): string {
  return blocks
    .map(extractBlockText)
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * Get a summary of block types in a page
 */
export function getBlocksSummary(blocks: NotionBlock[]): { [blockType: string]: number } {
  const summary: { [blockType: string]: number } = {};
  
  blocks.forEach(block => {
    if (block && block.type) {
      summary[block.type] = (summary[block.type] || 0) + 1;
    }
  });
  
  return summary;
}

/**
 * Check if a page has any meaningful content (not just empty blocks)
 */
export function hasPageContent(blocks: NotionBlock[]): boolean {
  const textContent = extractAllBlocksText(blocks);
  return textContent.length > 0;
}

/**
 * Get structured content from blocks (preserving some formatting info)
 */
export interface StructuredBlock {
  type: string;
  content: string;
  level?: number; // For headings
}

export function getStructuredContent(blocks: NotionBlock[]): StructuredBlock[] {
  return blocks
    .map(block => {
      if (!block || !block.type) {
        return null;
      }

      const content = extractBlockText(block);
      if (!content) {
        return null;
      }

      const structured: StructuredBlock = {
        type: block.type,
        content: content,
      };

      // Add level for headings
      if (block.type.startsWith('heading_')) {
        structured.level = parseInt(block.type.split('_')[1]);
      }

      return structured;
    })
    .filter((block): block is StructuredBlock => block !== null);
}
