import { databases, DATABASE_ID, COLLECTIONS, getCurrentUserId } from './appwrite';
import { Query, Permission, Role, ID } from 'appwrite';
import type {
  UserSettings,
  ColumnDefinition,
  ColumnValue,
  SlashCommand,
  ProcessingResult,
} from './types';
import type {
  UserSettingsDocument,
  ColumnDefinitionDocument,
  ColumnValueDocument,
  SlashCommandDocument,
  TimeEntryDocument,
} from './appwrite';

// Utility function to convert Appwrite document to app types
function convertUserSettings(doc: UserSettingsDocument): UserSettings {
  return {
    id: parseInt(doc.$id, 36), // Convert string ID to number for compatibility
    elementDelimiter: doc.elementDelimiter,
    rowEndDelimiter: doc.rowEndDelimiter,
    globalContext: doc.globalContext,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

function convertColumnDefinition(doc: ColumnDefinitionDocument): ColumnDefinition {
  return {
    id: parseInt(doc.$id, 36),
    name: doc.name,
    description: doc.description,
    format: doc.format,
    sortOrder: doc.sortOrder,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

function convertColumnValue(doc: ColumnValueDocument): ColumnValue {
  return {
    id: parseInt(doc.$id, 36),
    columnId: parseInt(doc.columnDefinitionId, 36),
    value: doc.value,
    description: doc.description,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

function convertSlashCommand(doc: SlashCommandDocument): SlashCommand {
  return {
    id: parseInt(doc.$id, 36),
    command: doc.command,
    expansion: doc.expansion,
    description: doc.description,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// User Settings Operations
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const userId = await getCurrentUserId();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      [Query.equal('userId', userId)]
    );

    if (response.documents.length === 0) {
      throw new Error('User settings not found');
    }

    return convertUserSettings(response.documents[0] as UserSettingsDocument);
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const userId = await getCurrentUserId();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      [Query.equal('userId', userId)]
    );

    if (response.documents.length === 0) {
      throw new Error('User settings not found');
    }

    const doc = response.documents[0];
    const updateData: any = {};
    
    if (settings.elementDelimiter !== undefined) updateData.elementDelimiter = settings.elementDelimiter;
    if (settings.rowEndDelimiter !== undefined) updateData.rowEndDelimiter = settings.rowEndDelimiter;
    if (settings.globalContext !== undefined) updateData.globalContext = settings.globalContext;

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      doc.$id,
      updateData
    );

    return convertUserSettings(updatedDoc as UserSettingsDocument);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

// Column Definitions Operations
export async function getColumnDefinitions(): Promise<ColumnDefinition[]> {
  try {
    const userId = await getCurrentUserId();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      [
        Query.equal('userId', userId),
        Query.orderAsc('sortOrder')
      ]
    );

    return response.documents.map(doc => convertColumnDefinition(doc as ColumnDefinitionDocument));
  } catch (error) {
    console.error('Error getting column definitions:', error);
    throw error;
  }
}

export async function createColumnDefinition(column: Omit<ColumnDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<ColumnDefinition> {
  try {
    const userId = await getCurrentUserId();
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      ID.unique(),
      {
        userId,
        name: column.name,
        description: column.description,
        format: column.format,
        sortOrder: column.sortOrder,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    return convertColumnDefinition(doc as ColumnDefinitionDocument);
  } catch (error) {
    console.error('Error creating column definition:', error);
    throw error;
  }
}

export async function updateColumnDefinition(id: number, updates: Partial<ColumnDefinition>): Promise<ColumnDefinition> {
  try {
    const userId = await getCurrentUserId();
    const docId = id.toString(36);
    
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.format !== undefined) updateData.format = updates.format;
    if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;

    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      docId,
      updateData
    );

    return convertColumnDefinition(doc as ColumnDefinitionDocument);
  } catch (error) {
    console.error('Error updating column definition:', error);
    throw error;
  }
}

export async function deleteColumnDefinition(id: number): Promise<void> {
  try {
    const docId = id.toString(36);
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      docId
    );
  } catch (error) {
    console.error('Error deleting column definition:', error);
    throw error;
  }
}

// Column Values Operations
export async function getColumnValues(): Promise<ColumnValue[]> {
  try {
    const userId = await getCurrentUserId();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      [Query.equal('userId', userId)]
    );

    return response.documents.map(doc => convertColumnValue(doc as ColumnValueDocument));
  } catch (error) {
    console.error('Error getting column values:', error);
    throw error;
  }
}

export async function createColumnValue(value: Omit<ColumnValue, 'id' | 'createdAt' | 'updatedAt'>): Promise<ColumnValue> {
  try {
    const userId = await getCurrentUserId();
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      ID.unique(),
      {
        userId,
        columnDefinitionId: value.columnId.toString(36),
        value: value.value,
        description: value.description,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    return convertColumnValue(doc as ColumnValueDocument);
  } catch (error) {
    console.error('Error creating column value:', error);
    throw error;
  }
}

export async function updateColumnValue(id: number, updates: Partial<ColumnValue>): Promise<ColumnValue> {
  try {
    const docId = id.toString(36);
    
    const updateData: any = {};
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.description !== undefined) updateData.description = updates.description;

    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      docId,
      updateData
    );

    return convertColumnValue(doc as ColumnValueDocument);
  } catch (error) {
    console.error('Error updating column value:', error);
    throw error;
  }
}

export async function deleteColumnValue(id: number): Promise<void> {
  try {
    const docId = id.toString(36);
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      docId
    );
  } catch (error) {
    console.error('Error deleting column value:', error);
    throw error;
  }
}

// Slash Commands Operations
export async function getSlashCommands(): Promise<SlashCommand[]> {
  try {
    const userId = await getCurrentUserId();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      [Query.equal('userId', userId)]
    );

    return response.documents.map(doc => convertSlashCommand(doc as SlashCommandDocument));
  } catch (error) {
    console.error('Error getting slash commands:', error);
    throw error;
  }
}

export async function createSlashCommand(command: Omit<SlashCommand, 'id' | 'createdAt' | 'updatedAt'>): Promise<SlashCommand> {
  try {
    const userId = await getCurrentUserId();
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      ID.unique(),
      {
        userId,
        command: command.command,
        expansion: command.expansion,
        description: command.description,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    return convertSlashCommand(doc as SlashCommandDocument);
  } catch (error) {
    console.error('Error creating slash command:', error);
    throw error;
  }
}

export async function updateSlashCommand(id: number, updates: Partial<SlashCommand>): Promise<SlashCommand> {
  try {
    const docId = id.toString(36);
    
    const updateData: any = {};
    if (updates.command !== undefined) updateData.command = updates.command;
    if (updates.expansion !== undefined) updateData.expansion = updates.expansion;
    if (updates.description !== undefined) updateData.description = updates.description;

    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      docId,
      updateData
    );

    return convertSlashCommand(doc as SlashCommandDocument);
  } catch (error) {
    console.error('Error updating slash command:', error);
    throw error;
  }
}

export async function deleteSlashCommand(id: number): Promise<void> {
  try {
    const docId = id.toString(36);
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      docId
    );
  } catch (error) {
    console.error('Error deleting slash command:', error);
    throw error;
  }
}

// Time Entries Operations (for tracking processed entries)
export async function saveTimeEntry(
  originalInput: string,
  result: ProcessingResult
): Promise<TimeEntryDocument> {
  try {
    const userId = await getCurrentUserId();
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TIME_ENTRIES,
      ID.unique(),
      {
        userId,
        originalInput,
        formattedOutput: result.formattedOutput || '',
        explanation: result.explanation || '',
        entryDate: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    return doc as TimeEntryDocument;
  } catch (error) {
    console.error('Error saving time entry:', error);
    throw error;
  }
}

export async function getTimeEntries(limit: number = 50): Promise<TimeEntryDocument[]> {
  try {
    const userId = await getCurrentUserId();
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.TIME_ENTRIES,
      [
        Query.equal('userId', userId),
        Query.orderDesc('entryDate'),
        Query.limit(limit)
      ]
    );

    return response.documents as TimeEntryDocument[];
  } catch (error) {
    console.error('Error getting time entries:', error);
    throw error;
  }
}