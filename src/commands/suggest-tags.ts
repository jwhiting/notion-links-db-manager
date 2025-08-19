import { NotionClient } from '../notion/client';
import { NotionUpdater } from '../notion/updater';
import { suggestTagsForBookmark, shouldBookmarkHaveTag } from '../ai/client';
import { getAllTagDefinitions, getTagDescription } from '../utils/tag-definitions';
import { fetchBookmarks } from '../utils/bookmark/fetcher';
import { promptTagSuggestions, promptTagApplication, showProgress } from '../utils/interactive-cli';
import { logger } from '../utils/logger';


/**
 * AI-powered tag suggestion commands
 */

/**
 * Mode 1: Suggest additional tags for a specific bookmark
 */
export async function suggestTagsForBookmarkCommand(
  client: NotionClient,
  bookmarkId: string
): Promise<void> {
  const updater = new NotionUpdater();
  const availableTags = getAllTagDefinitions();

  try {
    logger.info(`Fetching bookmark ${bookmarkId}...`);

    // Fetch the specific bookmark
    const bookmarks = await fetchBookmarks(client, { limit: 1000 });
    const bookmark = bookmarks.find(b => b.id === bookmarkId);

    if (!bookmark) {
      console.log(`❌ Bookmark with ID ${bookmarkId} not found`);
      return;
    }

    console.log(`\n🤖 Getting AI tag suggestions for bookmark...`);

    // Get AI suggestions (with caching)
    const suggestions = await suggestTagsForBookmark(
      {
        title: bookmark.properties.name,
        url: bookmark.properties.url,
        notes: bookmark.properties.notes,
        currentTags: bookmark.properties.tags,
        what: bookmark.properties.what,
        quotes: bookmark.properties.quotes,
        why: bookmark.properties.why,
      },
      availableTags,
      {
        bookmarkId: bookmark.id,
        lastEditedTime: bookmark.lastEditedTime,
        useCache: true,
        cacheType: 'untagged',
      }
    );

    // Filter out tags that are already applied
    const newSuggestions = suggestions.suggestedTags.filter(
      tag => !bookmark.properties.tags.includes(tag)
    );

    // Prompt user for acceptance
    const result = await promptTagSuggestions({
      bookmark,
      suggestedTags: newSuggestions,
      reasoning: suggestions.reasoning,
      availableTags: availableTags.map(t => t.tag),
    });

    if (result.response === 'quit') {
      console.log('❌ Operation cancelled by user');
      return;
    }

    if (result.response === 'reject-all' || !result.selectedTags || result.selectedTags.length === 0) {
      console.log('✅ No tags added');
      return;
    }

    // Apply the selected tags
    console.log(`\n📝 Adding ${result.selectedTags.length} tags to bookmark...`);
    await updater.addTagsToBookmark(bookmark.id, result.selectedTags);
    
    console.log(`✅ Successfully added tags: ${result.selectedTags.join(', ')}`);

  } catch (error) {
    logger.error('Failed to suggest tags for bookmark:', error);
    throw error;
  }
}

/**
 * Mode 2: Find bookmarks that might need a specific tag
 */
export async function findBookmarksForTagCommand(
  client: NotionClient,
  targetTag: string
): Promise<void> {
  const updater = new NotionUpdater();
  const tagDescription = getTagDescription(targetTag);

  if (!tagDescription) {
    console.log(`❌ Tag "${targetTag}" is not defined in tag-definitions.txt`);
    return;
  }

  try {
    logger.info(`Fetching all bookmarks to analyze for tag #${targetTag}...`);

    // Get all bookmarks that don't already have this tag
    const allBookmarks = await fetchBookmarks(client, { limit: 1000 });
    const candidateBookmarks = allBookmarks.filter(
      bookmark => !bookmark.properties.tags.includes(targetTag)
    );

    if (candidateBookmarks.length === 0) {
      console.log(`✅ All bookmarks already have tag #${targetTag} or no bookmarks found`);
      return;
    }

    console.log(`\n🔍 Analyzing ${candidateBookmarks.length} bookmarks for tag #${targetTag}`);
    console.log(`Tag definition: ${tagDescription}\n`);

    let processedCount = 0;
    let addedCount = 0;

    for (const bookmark of candidateBookmarks) {
      processedCount++;
      showProgress(processedCount, candidateBookmarks.length, bookmark.properties.name);

      try {
        // Ask AI if this bookmark should have the tag (with caching)
        const aiResult = await shouldBookmarkHaveTag(
          {
            title: bookmark.properties.name,
            url: bookmark.properties.url,
            notes: bookmark.properties.notes,
            currentTags: bookmark.properties.tags,
            what: bookmark.properties.what,
            quotes: bookmark.properties.quotes,
            why: bookmark.properties.why,
          },
          { tag: targetTag, description: tagDescription },
          {
            bookmarkId: bookmark.id,
            lastEditedTime: bookmark.lastEditedTime,
            useCache: true,
          }
        );

        if (!aiResult.shouldHaveTag) {
          logger.debug(`Skipping bookmark: ${aiResult.reasoning}`);
          continue;
        }

        // Prompt user for confirmation
        const userResult = await promptTagApplication({
          bookmark,
          targetTag,
          reasoning: aiResult.reasoning,
        });

        if (userResult.response === 'quit') {
          console.log(`\n❌ Operation cancelled by user after processing ${processedCount} bookmarks`);
          break;
        }

        if (userResult.response === 'yes') {
          await updater.addTagToBookmark(bookmark.id, targetTag);
          addedCount++;
          console.log(`✅ Added tag ${targetTag} to bookmark`);
        }

      } catch (error) {
        logger.error(`Error processing bookmark ${bookmark.id}:`, error);
        continue;
      }
    }

    console.log(`\n🎉 Completed! Added tag ${targetTag} to ${addedCount} bookmarks out of ${processedCount} analyzed.`);

  } catch (error) {
    logger.error('Failed to find bookmarks for tag:', error);
    throw error;
  }
}

/**
 * Mode 3: Suggest tags for all untagged bookmarks
 */
export async function suggestTagsForUntaggedCommand(client: NotionClient): Promise<void> {
  const updater = new NotionUpdater();
  const availableTags = getAllTagDefinitions();

  try {
    logger.info('Fetching all bookmarks to find untagged ones...');

    // Get all bookmarks with no tags
    const allBookmarks = await fetchBookmarks(client, { limit: 1000 });
    const untaggedBookmarks = allBookmarks.filter(
      bookmark => bookmark.properties.tags.length === 0
    );

    if (untaggedBookmarks.length === 0) {
      console.log('✅ No untagged bookmarks found!');
      return;
    }

    console.log(`\n🏷️  Found ${untaggedBookmarks.length} untagged bookmarks`);
    console.log('Getting AI tag suggestions for each...\n');

    let processedCount = 0;
    let taggedCount = 0;

    for (const bookmark of untaggedBookmarks) {
      processedCount++;
      showProgress(processedCount, untaggedBookmarks.length, bookmark.properties.name);

      try {
        // Get AI suggestions for this bookmark (with caching)
        const suggestions = await suggestTagsForBookmark(
          {
            title: bookmark.properties.name,
            url: bookmark.properties.url,
            notes: bookmark.properties.notes,
            currentTags: bookmark.properties.tags,
            what: bookmark.properties.what,
            quotes: bookmark.properties.quotes,
            why: bookmark.properties.why,
          },
          availableTags,
          {
            bookmarkId: bookmark.id,
            lastEditedTime: bookmark.lastEditedTime,
            useCache: true,
            cacheType: 'untagged',
          }
        );

        if (suggestions.suggestedTags.length === 0) {
          logger.debug('No tags suggested for this bookmark');
          continue;
        }

        // Prompt user for acceptance
        const result = await promptTagSuggestions({
          bookmark,
          suggestedTags: suggestions.suggestedTags,
          reasoning: suggestions.reasoning,
          availableTags: availableTags.map(t => t.tag),
        });

        if (result.response === 'quit') {
          console.log(`\n❌ Operation cancelled by user after processing ${processedCount} bookmarks`);
          break;
        }

        if (result.response !== 'reject-all' && result.selectedTags && result.selectedTags.length > 0) {
          await updater.addTagsToBookmark(bookmark.id, result.selectedTags);
          taggedCount++;
          console.log(`✅ Added ${result.selectedTags.length} tags: ${result.selectedTags.join(', ')}`);
        }

      } catch (error) {
        logger.error(`Error processing bookmark ${bookmark.id}:`, error);
        continue;
      }
    }

    console.log(`\n🎉 Completed! Added tags to ${taggedCount} bookmarks out of ${processedCount} processed.`);

  } catch (error) {
    logger.error('Failed to suggest tags for untagged bookmarks:', error);
    throw error;
  }
}
