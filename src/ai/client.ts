import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * AI client for tag suggestions using OpenAI via Vercel AI SDK
 */

// Response schema for tag suggestions
export const TagSuggestionsSchema = z.object({
  suggestedTags: z.array(z.string()).describe('Array of tag names that should be applied to this bookmark (without # prefix)'),
  reasoning: z.string().describe('Brief explanation of why these tags are appropriate'),
});

export type TagSuggestions = z.infer<typeof TagSuggestionsSchema>;

/**
 * Generate tag suggestions for a bookmark using AI
 */
export async function suggestTagsForBookmark(
  bookmarkData: {
    title: string;
    url: string;
    notes: string;
    currentTags: string[];
    what: string;
    quotes: string;
    why: string;
  },
  availableTags: Array<{ tag: string; description: string }>
): Promise<TagSuggestions> {

  const availableTagsText = availableTags
    .map(({ tag, description }) => `#${tag}: ${description}`)
    .join('\n');

  const currentTagsText = bookmarkData.currentTags.length > 0 
    ? bookmarkData.currentTags.map(tag => `#${tag}`).join(', ')
    : 'None';

  const prompt = `You are a bookmark tagging assistant. Your job is to suggest additional relevant tags for bookmarks based on their content and context.

BOOKMARK TO ANALYZE:
Title: ${bookmarkData.title}
URL: ${bookmarkData.url}
Current Tags: ${currentTagsText}
Notes: ${bookmarkData.notes || 'None'}
What: ${bookmarkData.what || 'None'}  
Quotes: ${bookmarkData.quotes || 'None'}
Why: ${bookmarkData.why || 'None'}

AVAILABLE TAGS (you can ONLY suggest from these existing tags):
${availableTagsText}

INSTRUCTIONS:
1. Analyze the bookmark's content, purpose, and context
2. Suggest additional tags that would be relevant and helpful for organizing/finding this bookmark
3. Only suggest tags from the available tags list above
4. Do not suggest tags that are already applied to this bookmark
5. A tag applies to a bookmark if the bookmark's content, purpose, or context relates to the tag's meaning
6. Consider both obvious connections and subtle thematic relationships
7. Be generous with suggestions - it's better to suggest a tag that might be useful than to miss a good connection
8. Return tag names without the # prefix

Focus on tags that would help someone:
- Find this bookmark when searching for related topics
- Understand what category or domain this bookmark belongs to  
- Discover this bookmark when exploring a particular theme or technology`;

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: TagSuggestionsSchema,
    prompt,
    // note even with temp 0 and seed 42, the results are not deterministic.
    // this could be because:
    // - random tie breakers on equal probability tokens
    // - runtime/operational differences between execution contexts
    // - nondeterministic MoE routing?
    // - not really sure. general consensus online is that there is no way to make it deterministic.
    temperature: 0,
    seed: 42,
  } as any);

  return result.object as TagSuggestions;
}

/**
 * Check if a bookmark should have a specific tag
 */
export async function shouldBookmarkHaveTag(
  bookmarkData: {
    title: string;
    url: string;
    notes: string;
    currentTags: string[];
    what: string;
    quotes: string;
    why: string;
  },
  targetTag: { tag: string; description: string }
): Promise<{ shouldHaveTag: boolean; reasoning: string }> {

  const currentTagsText = bookmarkData.currentTags.length > 0 
    ? bookmarkData.currentTags.map(tag => `#${tag}`).join(', ')
    : 'None';

  const prompt = `You are a bookmark tagging assistant. Your job is to determine if a specific tag should be applied to a bookmark.

BOOKMARK TO ANALYZE:
Title: ${bookmarkData.title}
URL: ${bookmarkData.url}
Current Tags: ${currentTagsText}
Notes: ${bookmarkData.notes || 'None'}
What: ${bookmarkData.what || 'None'}
Quotes: ${bookmarkData.quotes || 'None'}
Why: ${bookmarkData.why || 'None'}

TARGET TAG TO EVALUATE:
#${targetTag.tag}: ${targetTag.description}

QUESTION: Should this bookmark have the tag "#${targetTag.tag}"?

INSTRUCTIONS:
1. Analyze if the bookmark's content, purpose, or context relates to the tag's meaning
2. Consider both direct connections and thematic relationships
3. A tag applies if the bookmark would be useful to someone searching for that tag's topic
4. Be reasonably generous - if there's a meaningful connection, suggest the tag
5. Respond with true/false and explain your reasoning

The tag should be applied if this bookmark would be valuable to someone exploring the "${targetTag.description}" topic.`;

  const ResponseSchema = z.object({
    reasoning: z.string().describe('Explanation of why the tag should or should not be applied'),
    shouldHaveTag: z.boolean().describe('Whether this bookmark should have the target tag'),
  });

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ResponseSchema,
    prompt,
    temperature: 0,
    seed: 42,
  } as any);

  return result.object as { shouldHaveTag: boolean; reasoning: string };
}
