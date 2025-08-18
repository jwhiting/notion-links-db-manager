/**
 * Utility functions to extract values from Notion property objects
 * These functions handle the complex nested structures returned by the Notion API
 */

// Helper type for any Notion property value
type NotionProperty = any;

/**
 * Extract plain text from a rich_text property
 */
export function extractRichText(property: NotionProperty): string {
  if (!property || property.type !== 'rich_text' || !Array.isArray(property.rich_text)) {
    return '';
  }
  
  return property.rich_text
    .map((textObj: any) => textObj.plain_text || '')
    .join('')
    .trim();
}

/**
 * Extract title text from a title property
 */
export function extractTitle(property: NotionProperty): string {
  if (!property || property.type !== 'title' || !Array.isArray(property.title)) {
    return '';
  }
  
  return property.title
    .map((textObj: any) => textObj.plain_text || '')
    .join('')
    .trim();
}

/**
 * Extract URL from a url property
 */
export function extractUrl(property: NotionProperty): string {
  if (!property || property.type !== 'url') {
    return '';
  }
  
  return property.url || '';
}

/**
 * Extract selected options from a multi_select property
 */
export function extractMultiSelect(property: NotionProperty): string[] {
  if (!property || property.type !== 'multi_select' || !Array.isArray(property.multi_select)) {
    return [];
  }
  
  return property.multi_select.map((option: any) => option.name || '').filter(Boolean);
}

/**
 * Extract boolean value from a checkbox property
 */
export function extractCheckbox(property: NotionProperty): boolean {
  if (!property || property.type !== 'checkbox') {
    return false;
  }
  
  return Boolean(property.checkbox);
}

/**
 * Extract date from a created_time property
 */
export function extractCreatedTime(property: NotionProperty): Date | null {
  if (!property || property.type !== 'created_time' || !property.created_time) {
    return null;
  }
  
  return new Date(property.created_time);
}

/**
 * Extract date from a last_edited_time property
 */
export function extractLastEditedTime(property: NotionProperty): Date | null {
  if (!property || property.type !== 'last_edited_time' || !property.last_edited_time) {
    return null;
  }
  
  return new Date(property.last_edited_time);
}

/**
 * Extract selected option from a select property
 */
export function extractSelect(property: NotionProperty): string {
  if (!property || property.type !== 'select' || !property.select) {
    return '';
  }
  
  return property.select.name || '';
}

/**
 * Extract number from a number property
 */
export function extractNumber(property: NotionProperty): number | null {
  if (!property || property.type !== 'number') {
    return null;
  }
  
  return property.number;
}

/**
 * Generic property extractor that automatically detects the property type
 */
export function extractProperty(property: NotionProperty): any {
  if (!property || !property.type) {
    return null;
  }
  
  switch (property.type) {
    case 'rich_text':
      return extractRichText(property);
    case 'title':
      return extractTitle(property);
    case 'url':
      return extractUrl(property);
    case 'multi_select':
      return extractMultiSelect(property);
    case 'select':
      return extractSelect(property);
    case 'checkbox':
      return extractCheckbox(property);
    case 'number':
      return extractNumber(property);
    case 'created_time':
      return extractCreatedTime(property);
    case 'last_edited_time':
      return extractLastEditedTime(property);
    default:
      // For unknown types, return the raw value
      return property[property.type];
  }
}
