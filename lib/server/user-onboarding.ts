import { ID, Permission, Role } from 'node-appwrite';
import { createAdminClient } from './appwrite';

// Database and collection IDs matching appwrite.json
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';

const COLLECTIONS = {
  USER_SETTINGS: process.env.NEXT_PUBLIC_COLLECTION_USER_SETTINGS || 'userSettings',
  COLUMN_DEFINITIONS: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_DEFINITIONS || 'columnDefinitions',
  COLUMN_VALUES: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_VALUES || 'columnValues',
  SLASH_COMMANDS: process.env.NEXT_PUBLIC_COLLECTION_SLASH_COMMANDS || 'slashCommands',
};

// Initialize default user settings when a new user registers
export async function initializeUserSettings(userId: string): Promise<void> {
  const { databases } = createAdminClient();

  try {
    // Create default user settings
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      ID.unique(),
      {
        userId,
        elementDelimiter: ',',
        rowEndDelimiter: ';',
        globalContext: 'Default work day is 9:00-17:00 unless specified. Breaks are unpaid and should not be tracked.'
      },
      [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    // Create default column definitions
    const defaultColumns = [
      {
        name: 'Start Time',
        description: 'When the time entry begins',
        format: 'YYYYMMDDTHHMM',
        sortOrder: 1
      },
      {
        name: 'End Time',
        description: 'When the time entry ends',
        format: 'YYYYMMDDTHHMM',
        sortOrder: 2
      },
      {
        name: 'Project Code',
        description: 'Project identifier or code',
        format: 'text',
        sortOrder: 3
      },
      {
        name: 'Description',
        description: 'Description of work performed',
        format: 'text',
        sortOrder: 4
      }
    ];

    const columnDocs = [];
    for (const column of defaultColumns) {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.COLUMN_DEFINITIONS,
        ID.unique(),
        {
          userId,
          ...column
        },
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );
      columnDocs.push(doc);
    }

    // Create default column values for Project Code
    const projectCodeColumn = columnDocs.find(col => col.name === 'Project Code');
    if (projectCodeColumn) {
      const defaultValues = [
        { value: 'ADMIN', description: 'Administrative tasks' },
        { value: 'MEET', description: 'Meetings and calls' },
        { value: 'DEV', description: 'Development work' },
        { value: 'UNKNOWN', description: 'Unspecified project' }
      ];

      for (const valueData of defaultValues) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.COLUMN_VALUES,
          ID.unique(),
          {
            userId,
            columnDefinitionId: projectCodeColumn.$id,
            ...valueData
          },
          [
            Permission.read(Role.user(userId)),
            Permission.write(Role.user(userId)),
            Permission.delete(Role.user(userId))
          ]
        );
      }
    }

    // Create default slash commands
    const defaultCommands = [
      {
        command: '/break',
        expansion: 'Break from 12:00 to 12:30',
        description: 'Standard lunch break'
      },
      {
        command: '/lunch',
        expansion: 'Lunch break from 12:00 to 13:00',
        description: 'Extended lunch break'
      },
      {
        command: '/meeting',
        expansion: 'Team meeting',
        description: 'Generic team meeting'
      }
    ];

    for (const command of defaultCommands) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SLASH_COMMANDS,
        ID.unique(),
        {
          userId,
          ...command
        },
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );
    }

    console.log(`Successfully initialized settings for user ${userId}`);
  } catch (error) {
    console.error('Failed to initialize user settings:', error);
    throw error;
  }
}