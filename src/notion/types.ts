import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

// Union type for database query results
export type NotionPage =
  | PageObjectResponse
  | PartialPageObjectResponse
  | DatabaseObjectResponse
  | PartialDatabaseObjectResponse;

// Type guard to check if a page is a full PageObjectResponse
export function isFullPage(page: NotionPage): page is PageObjectResponse {
  return 'url' in page && 'created_time' in page && 'last_edited_time' in page;
}

// Interface for your actual bookmark properties based on the database schema
export interface BookmarkProperties {
  name: string;           // Title of the bookmark
  url: string;            // The actual URL
  notes: string;          // Rich text notes
  attn: boolean;          // Attention/priority checkbox
  tags: string[];         // Multi-select tags
  what: string;           // Rich text description of what it's about
  quotes: string;         // Rich text notable quotes
  why: string;            // Rich text why you saved it
  created: Date | null;   // When it was created
}

// Interface for a clean, parsed bookmark
export interface Bookmark {
  id: string;
  properties: BookmarkProperties;
  notionUrl: string;      // The Notion page URL
  createdTime: Date;
  lastEditedTime: Date;
}

// Query options for database queries
export interface QueryOptions {
  startCursor?: string;
  pageSize?: number;
  filter?: Record<string, unknown>;
  sorts?: Array<{
    property: string;
    direction: 'ascending' | 'descending';
  }>;
}
