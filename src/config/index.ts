import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  notion: {
    apiKey: string;
    databaseId: string;
  };
}

const config: Config = {
  notion: {
    apiKey: process.env['NOTION_API_KEY'] || '',
    databaseId: process.env['NOTION_DATABASE_ID'] || '',
  },
};

// Validate required environment variables
const validateConfig = (): void => {
  if (!config.notion.apiKey) {
    throw new Error('NOTION_API_KEY environment variable is required');
  }
  if (!config.notion.databaseId) {
    throw new Error('NOTION_DATABASE_ID environment variable is required');
  }
};

export { config, validateConfig };
