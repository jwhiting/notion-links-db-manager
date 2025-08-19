import * as fs from 'fs';
import * as path from 'path';

/**
 * Utilities for working with tag definitions from tag-definitions.txt
 * Format: tag-name Description of what this tag means
 */

export interface TagDefinition {
  tag: string;
  description: string;
}

/**
 * Load tag definitions from tag-definitions.txt
 */
export function loadTagDefinitions(): Map<string, string> {
  const definitions = new Map<string, string>();
  
  try {
    // Find project root (where package.json is)
    let currentDir = __dirname;
    while (currentDir !== '/' && !fs.existsSync(path.join(currentDir, 'package.json'))) {
      currentDir = path.dirname(currentDir);
    }
    
    const tagDefsFile = path.join(currentDir, 'tag-definitions.txt');
    
    if (!fs.existsSync(tagDefsFile)) {
      return definitions; // Return empty map if file doesn't exist
    }
    
    const content = fs.readFileSync(tagDefsFile, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.length > 0) {
        const spaceIndex = trimmed.indexOf(' ');
        if (spaceIndex > 0) {
          const tag = trimmed.substring(0, spaceIndex).trim();
          const description = trimmed.substring(spaceIndex + 1).trim();
          if (tag && description) {
            definitions.set(tag, description);
          }
        }
      }
    }
  } catch (error) {
    // If anything fails, return empty map
  }
  
  return definitions;
}

/**
 * Get all defined tags as an array
 */
export function getDefinedTags(): string[] {
  const definitions = loadTagDefinitions();
  return Array.from(definitions.keys()).sort();
}

/**
 * Get description for a specific tag
 */
export function getTagDescription(tag: string): string | undefined {
  const definitions = loadTagDefinitions();
  return definitions.get(tag);
}

/**
 * Check if a tag is defined
 */
export function isTagDefined(tag: string): boolean {
  const definitions = loadTagDefinitions();
  return definitions.has(tag);
}

/**
 * Find tags that are used but not defined
 */
export function findUndefinedTags(usedTags: string[]): string[] {
  const definitions = loadTagDefinitions();
  const undefinedTags = usedTags.filter(tag => !definitions.has(tag));
  return [...new Set(undefinedTags)].sort(); // Remove duplicates and sort
}

/**
 * Get all tag definitions as an array of objects
 */
export function getAllTagDefinitions(): TagDefinition[] {
  const definitions = loadTagDefinitions();
  return Array.from(definitions.entries())
    .map(([tag, description]) => ({ tag, description }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}
