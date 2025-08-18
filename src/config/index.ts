import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  notion: {
    apiKey: string;
    databaseId: string;
  };
  openai: {
    apiKey: string;
  };
}

const config: Config = {
  notion: {
    apiKey: process.env['NOTION_API_KEY'] || '',
    databaseId: process.env['NOTION_DATABASE_ID'] || '',
  },
  openai: {
    apiKey: process.env['OPENAI_API_KEY'] || '',
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

// Validate configuration including OpenAI API key for AI features
const validateConfigWithAI = (): void => {
  validateConfig();
  if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for AI features');
  }
};

export { config, validateConfig, validateConfigWithAI };
