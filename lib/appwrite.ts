import { Client, Account, Databases, Teams } from 'appwrite';

// Client configuration
export const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

// Service instances
export const account = new Account(client);
export const databases = new Databases(client);
export const teams = new Teams(client);

// Database and collection IDs
export const DATABASE_ID = 'main';
export const COLLECTIONS = {
  USER_SETTINGS: 'userSettings',
  COLUMN_DEFINITIONS: 'columnDefinitions',
  COLUMN_VALUES: 'columnValues',
  SLASH_COMMANDS: 'slashCommands',
  TIME_ENTRIES: 'timeEntries',
} as const;

// Utility function to get current user ID
export const getCurrentUserId = async (): Promise<string> => {
  try {
    const user = await account.get();
    return user.$id;
  } catch (error) {
    throw new Error('User not authenticated');
  }
};

// Type definitions for Appwrite documents
export interface AppwriteDocument {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
}

export interface UserSettingsDocument extends AppwriteDocument {
  userId: string;
  elementDelimiter: string;
  rowEndDelimiter: string;
  globalContext: string;
}

export interface ColumnDefinitionDocument extends AppwriteDocument {
  userId: string;
  name: string;
  description: string;
  format: string;
  sortOrder: number;
}

export interface ColumnValueDocument extends AppwriteDocument {
  userId: string;
  columnDefinitionId: string;
  value: string;
  description: string;
}

export interface SlashCommandDocument extends AppwriteDocument {
  userId: string;
  command: string;
  expansion: string;
  description: string;
}

export interface TimeEntryDocument extends AppwriteDocument {
  userId: string;
  originalInput: string;
  formattedOutput: string;
  explanation?: string;
  entryDate: string;
}