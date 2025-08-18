import { logger, LogLevel } from './utils/logger';
import { runListRecentCommand } from './commands/list-recent';
import { runAnalyzeCommand } from './commands/analyze';

/**
 * Main entry point - routes to different commands based on arguments
 */

type Command = 'list-recent' | 'analyze' | 'help';

function printHelp(): void {
  console.log(`
Notion Links Database Manager

Usage: npm run dev [command] [options]

Commands:
  list-recent    List the most recent bookmarks (default: 20)
  analyze        Analyze database structure and sample content  
  help           Show this help message

Examples:
  npm run dev list-recent
  npm run dev analyze
  npm run dev help
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

      case 'analyze':
        await runAnalyzeCommand();
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
