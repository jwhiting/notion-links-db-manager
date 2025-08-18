import { logger, LogLevel } from './utils/logger';
import { runListRecentCommand } from './commands/list-recent';
import { runAnalyzeCommand } from './commands/analyze';
import { runSearchCommand } from './commands/search';
import { runListTagsCommand } from './commands/list-tags';

/**
 * Main entry point - routes to different commands based on arguments
 */

type Command = 'list-recent' | 'analyze' | 'search' | 'list-tags' | 'help';

function printHelp(): void {
  console.log(`
Notion Links Database Manager

Usage: npm run dev [command] [options]

Commands:
  list-recent    List the most recent bookmarks (default: 20)
  list-tags      List all unique tags with usage counts
  analyze        Analyze database structure and sample content  
  search         Search bookmarks (use search --help for options)
  help           Show this help message

Examples:
  npm run dev list-recent
  npm run dev list-tags
  npm run dev analyze
  npm run dev search --tag ai
  npm run dev help

Standalone scripts:
  npm run list-tags
  npm run search-by-tag ai                    # Single tag
  npm run search-by-tag ai agents             # Multiple tags (AND)
  npm run search-by-any-tag coding ide cli    # Multiple tags (OR)
`);
}

async function main(): Promise<void> {
  try {
    // Set log level (can be configured via environment variable later)
    logger.setLevel(LogLevel.INFO);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command: Command = (args[0] as Command) || 'list-recent';

    logger.info('Starting Notion Links Database Manager...');

    switch (command) {
      case 'list-recent':
        await runListRecentCommand({
          count: 20,
          dateFormat: 'short',
          showEmptyFields: false,
        });
        break;

      case 'list-tags':
        await runListTagsCommand({
          showCounts: true,
          sortBy: 'count',
          sortDirection: 'desc',
        });
        break;

      case 'analyze':
        await runAnalyzeCommand();
        break;

      case 'search':
        // Simple search for attention bookmarks as demo
        await runSearchCommand({
          attention: true,
          limit: 20,
        });
        break;

      case 'help':
        printHelp();
        break;

      default:
        logger.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

  } catch (error) {
    logger.error('Application failed:', error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}
