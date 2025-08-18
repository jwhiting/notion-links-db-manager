import * as readline from 'readline';
import { Bookmark } from '../notion/types';

/**
 * Interactive CLI utilities for tag suggestion workflows
 */

export interface TagSuggestionPrompt {
  bookmark: Bookmark;
  suggestedTags: string[];
  reasoning: string;
  availableTags?: string[]; // All defined tags for reference
}

export interface TagApplicationPrompt {
  bookmark: Bookmark;
  targetTag: string;
  reasoning: string;
}

export type SuggestionResponse = 'accept-all' | 'reject-all' | 'selective' | 'quit';
export type ApplicationResponse = 'yes' | 'no' | 'quit';

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask user a question and get their response
 */
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Display bookmark details in a formatted way
 */
export function displayBookmark(bookmark: Bookmark): void {
  console.log('\n' + '='.repeat(60));
  console.log('📖 BOOKMARK DETAILS');
  console.log('='.repeat(60));
  console.log(`Title: ${bookmark.properties.name}`);
  console.log(`URL: ${bookmark.properties.url}`);
  console.log(`Created: ${bookmark.properties.created?.toLocaleDateString() || 'Unknown'}`);
  
  if (bookmark.properties.tags.length > 0) {
    console.log(`Current Tags: ${bookmark.properties.tags.map(tag => `#${tag}`).join(', ')}`);
  } else {
    console.log('Current Tags: None');
  }
  
  if (bookmark.properties.attn) {
    console.log('🔥 ATTENTION FLAG SET');
  }
  
  if (bookmark.properties.notes) {
    console.log(`Notes: ${bookmark.properties.notes.substring(0, 200)}${bookmark.properties.notes.length > 200 ? '...' : ''}`);
  }
  
  if (bookmark.properties.what) {
    console.log(`What: ${bookmark.properties.what.substring(0, 200)}${bookmark.properties.what.length > 200 ? '...' : ''}`);
  }
  
  if (bookmark.properties.why) {
    console.log(`Why: ${bookmark.properties.why.substring(0, 200)}${bookmark.properties.why.length > 200 ? '...' : ''}`);
  }
  
  if (bookmark.properties.quotes) {
    console.log(`Quotes: ${bookmark.properties.quotes.substring(0, 200)}${bookmark.properties.quotes.length > 200 ? '...' : ''}`);
  }
}

/**
 * Prompt user to accept/reject tag suggestions for a bookmark
 */
export async function promptTagSuggestions(prompt: TagSuggestionPrompt): Promise<{
  response: SuggestionResponse;
  selectedTags?: string[];
}> {
  const rl = createReadlineInterface();
  
  try {
    displayBookmark(prompt.bookmark);
    
    console.log('\n' + '🤖 AI TAG SUGGESTIONS'.padEnd(60, '='));
    console.log(`Reasoning: ${prompt.reasoning}\n`);
    
    if (prompt.suggestedTags.length === 0) {
      console.log('No additional tags suggested.');
      return { response: 'reject-all' };
    }
    
    console.log('Suggested Tags:');
    prompt.suggestedTags.forEach((tag, index) => {
      console.log(`  ${index + 1}. #${tag}`);
    });
    
    // Show all available tags for reference
    if (prompt.availableTags && prompt.availableTags.length > 0) {
      console.log('\nAll Available Tags:');
      const tagDisplay = prompt.availableTags.map(tag => `#${tag}`).join(' ');
      console.log(`${tagDisplay}`);
    }
    
    console.log('\nOptions:');
    console.log('  all = Accept all suggestions');
    console.log('  none = Reject all suggestions');
    console.log('  [numbers & tags] = Select by numbers and/or custom tags (e.g., "1 3 #foobar" or "2,4 #ai #coding")');
    console.log('  q = Quit');
    
    const response = await askQuestion(rl, '\nYour choice: ');
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse === 'q' || lowerResponse === 'quit') {
      return { response: 'quit' };
    }
    
    if (lowerResponse === 'all') {
      return { response: 'accept-all', selectedTags: prompt.suggestedTags };
    }
    
    if (lowerResponse === 'none') {
      return { response: 'reject-all', selectedTags: [] };
    }
    
    // Parse mixed input: numbers and custom tags (e.g., "1 3 #foobar #coding")
    const selectedTags: string[] = [];
    
    // Split by spaces and commas, filter out empty strings
    const tokens = response.split(/[\s,]+/).filter(n => n.length > 0);
    
    for (const token of tokens) {
      if (token.startsWith('#')) {
        // Custom tag - remove the # prefix
        const customTag = token.substring(1);
        if (customTag && !selectedTags.includes(customTag)) {
          selectedTags.push(customTag);
        }
      } else if (/^\d+$/.test(token)) {
        // Number - map to suggested tag
        const num = parseInt(token, 10);
        if (num >= 1 && num <= prompt.suggestedTags.length) {
          const tag = prompt.suggestedTags[num - 1]; // Convert to 0-based index
          if (tag && !selectedTags.includes(tag)) { // Avoid duplicates
            selectedTags.push(tag);
          }
        } else {
          console.log(`⚠️  Invalid tag number: ${num} (valid range: 1-${prompt.suggestedTags.length})`);
        }
      } else {
        console.log(`⚠️  Invalid token: "${token}" (use numbers or #tag format)`);
      }
    }
    
    if (selectedTags.length > 0) {
      console.log(`✅ Selected ${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'}: ${selectedTags.map(tag => `#${tag}`).join(', ')}`);
      return { response: 'selective', selectedTags };
    } else {
      console.log('No valid tags selected.');
      return { response: 'reject-all', selectedTags: [] };
    }
  } finally {
    rl.close();
  }
}

/**
 * Prompt user to apply a specific tag to a bookmark
 */
export async function promptTagApplication(prompt: TagApplicationPrompt): Promise<{
  response: ApplicationResponse;
}> {
  const rl = createReadlineInterface();
  
  try {
    displayBookmark(prompt.bookmark);
    
    console.log('\n' + `🏷️  TAG APPLICATION: #${prompt.targetTag}`.padEnd(60, '='));
    console.log(`Reasoning: ${prompt.reasoning}\n`);
    
    console.log('Options:');
    console.log('  y = Add this tag to the bookmark');
    console.log('  n = Skip this bookmark');
    console.log('  q = Quit');
    
    const response = await askQuestion(rl, `\nAdd tag #${prompt.targetTag} to this bookmark? (y/n/q): `);
    const lowerResponse = response.toLowerCase();
    
    switch (lowerResponse) {
      case 'y':
      case 'yes':
        return { response: 'yes' };
        
      case 'n':
      case 'no':
        return { response: 'no' };
        
      case 'q':
      case 'quit':
        return { response: 'quit' };
        
      default:
        console.log('Invalid choice. Skipping bookmark.');
        return { response: 'no' };
    }
  } finally {
    rl.close();
  }
}

/**
 * Show progress indicator
 */
export function showProgress(current: number, total: number, item: string): void {
  const percentage = Math.round((current / total) * 100);
  console.log(`\n[${current}/${total} - ${percentage}%] Processing: ${item}`);
}
