import fs from 'fs';
import path from 'path';
import {
  UserSettings,
  ColumnDefinition,
  ColumnValue,
  SlashCommand,
  SettingsFormData
} from './types';

const DATA_PATH = path.join(process.cwd(), 'data', 'settings.json');

interface DatabaseData {
  userSettings: UserSettings;
  columnDefinitions: ColumnDefinition[];
  columnValues: ColumnValue[];
  slashCommands: SlashCommand[];
}

// Default data structure
const getDefaultData = (): DatabaseData => ({
  userSettings: {
    id: 1,
    elementDelimiter: ',',
    rowEndDelimiter: ';',
    globalContext: 'Default work day is 9:00-17:00 unless specified. Breaks are unpaid and should not be tracked.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  columnDefinitions: [
    {
      id: 1,
      name: 'Start Time',
      description: 'When the time entry begins',
      format: 'YYYYMMDDTHHMM',
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'End Time',
      description: 'When the time entry ends',
      format: 'YYYYMMDDTHHMM',
      sortOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Project Code',
      description: 'Project identifier or code',
      format: 'text',
      sortOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Description',
      description: 'Description of work performed',
      format: 'text',
      sortOrder: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  columnValues: [
    {
      id: 1,
      columnId: 3,
      value: 'ADMIN',
      description: 'Administrative tasks',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      columnId: 3,
      value: 'MEET',
      description: 'Meetings and calls',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      columnId: 3,
      value: 'DEV',
      description: 'Development work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      columnId: 3,
      value: 'UNKNOWN',
      description: 'Unspecified project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  slashCommands: [
    {
      id: 1,
      command: '/break',
      expansion: 'Break from 12:00 to 12:30',
      description: 'Standard lunch break',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      command: '/lunch',
      expansion: 'Lunch break from 12:00 to 13:00',
      description: 'Extended lunch break',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      command: '/meeting',
      expansion: 'Team meeting',
      description: 'Generic team meeting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
});

// Initialize database file
function initializeDB(): DatabaseData {
  // Ensure data directory exists
  const dataDir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // If file doesn't exist, create with default data
  if (!fs.existsSync(DATA_PATH)) {
    const defaultData = getDefaultData();
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  // Read existing data
  try {
    const fileContent = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(fileContent) as DatabaseData;
  } catch (error) {
    console.error('Failed to read database file, recreating with defaults:', error);
    const defaultData = getDefaultData();
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

// Database operations
let dbCache: DatabaseData | null = null;

function getData(): DatabaseData {
  if (!dbCache) {
    dbCache = initializeDB();
  }
  return dbCache;
}

function saveData(data: DatabaseData): void {
  dbCache = data;
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Settings operations
export function getUserSettings(): UserSettings {
  const data = getData();
  return data.userSettings;
}

export function updateUserSettings(settings: Partial<UserSettings>): void {
  const data = getData();
  data.userSettings = {
    ...data.userSettings,
    ...settings,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
}

// Column operations
export function getColumnDefinitions(): ColumnDefinition[] {
  const data = getData();
  return data.columnDefinitions.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createColumnDefinition(column: Omit<ColumnDefinition, 'id' | 'createdAt' | 'updatedAt'>): number {
  const data = getData();
  const newId = Math.max(...data.columnDefinitions.map(c => c.id), 0) + 1;
  const newColumn: ColumnDefinition = {
    ...column,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.columnDefinitions.push(newColumn);
  saveData(data);
  return newId;
}

export function updateColumnDefinition(id: number, column: Partial<ColumnDefinition>): void {
  const data = getData();
  const index = data.columnDefinitions.findIndex(c => c.id === id);
  if (index !== -1) {
    data.columnDefinitions[index] = {
      ...data.columnDefinitions[index],
      ...column,
      updatedAt: new Date().toISOString()
    };
    saveData(data);
  }
}

export function deleteColumnDefinition(id: number): void {
  const data = getData();
  data.columnDefinitions = data.columnDefinitions.filter(c => c.id !== id);
  // Also delete related column values
  data.columnValues = data.columnValues.filter(v => v.columnId !== id);
  saveData(data);
}

// Column values operations
export function getColumnValues(columnId?: number): ColumnValue[] {
  const data = getData();
  let values = data.columnValues;
  if (columnId) {
    values = values.filter(v => v.columnId === columnId);
  }
  return values.sort((a, b) => a.value.localeCompare(b.value));
}

export function createColumnValue(value: Omit<ColumnValue, 'id' | 'createdAt' | 'updatedAt'>): number {
  const data = getData();
  const newId = Math.max(...data.columnValues.map(v => v.id), 0) + 1;
  const newValue: ColumnValue = {
    ...value,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.columnValues.push(newValue);
  saveData(data);
  return newId;
}

export function updateColumnValue(id: number, value: Partial<ColumnValue>): void {
  const data = getData();
  const index = data.columnValues.findIndex(v => v.id === id);
  if (index !== -1) {
    data.columnValues[index] = {
      ...data.columnValues[index],
      ...value,
      updatedAt: new Date().toISOString()
    };
    saveData(data);
  }
}

export function deleteColumnValue(id: number): void {
  const data = getData();
  data.columnValues = data.columnValues.filter(v => v.id !== id);
  saveData(data);
}

// Slash commands operations
export function getSlashCommands(): SlashCommand[] {
  const data = getData();
  return data.slashCommands.sort((a, b) => a.command.localeCompare(b.command));
}

export function createSlashCommand(command: Omit<SlashCommand, 'id' | 'createdAt' | 'updatedAt'>): number {
  const data = getData();
  const newId = Math.max(...data.slashCommands.map(c => c.id), 0) + 1;
  const newCommand: SlashCommand = {
    ...command,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.slashCommands.push(newCommand);
  saveData(data);
  return newId;
}

export function updateSlashCommand(id: number, command: Partial<SlashCommand>): void {
  const data = getData();
  const index = data.slashCommands.findIndex(c => c.id === id);
  if (index !== -1) {
    data.slashCommands[index] = {
      ...data.slashCommands[index],
      ...command,
      updatedAt: new Date().toISOString()
    };
    saveData(data);
  }
}

export function deleteSlashCommand(id: number): void {
  const data = getData();
  data.slashCommands = data.slashCommands.filter(c => c.id !== id);
  saveData(data);
}

// Bulk operations for settings export/import
export function exportAllSettings(): SettingsFormData {
  const settings = getUserSettings();
  const columns = getColumnDefinitions();
  const allColumnValues = getColumnValues();
  const commands = getSlashCommands();

  // Group column values by column ID
  const columnValues: Record<number, Omit<ColumnValue, 'id' | 'columnId' | 'createdAt' | 'updatedAt'>[]> = {};
  allColumnValues.forEach(val => {
    if (!columnValues[val.columnId]) {
      columnValues[val.columnId] = [];
    }
    columnValues[val.columnId].push({
      value: val.value,
      description: val.description
    });
  });

  return {
    elementDelimiter: settings.elementDelimiter,
    rowEndDelimiter: settings.rowEndDelimiter,
    globalContext: settings.globalContext,
    columns: columns.map(col => ({
      name: col.name,
      description: col.description,
      format: col.format,
      sortOrder: col.sortOrder
    })),
    columnValues,
    slashCommands: commands.map(cmd => ({
      command: cmd.command,
      expansion: cmd.expansion,
      description: cmd.description
    }))
  };
}

export function importAllSettings(data: SettingsFormData): void {
  const dbData = getData();
  
  // Clear existing data
  dbData.columnValues = [];
  dbData.columnDefinitions = [];
  dbData.slashCommands = [];
  
  // Update settings
  updateUserSettings({
    elementDelimiter: data.elementDelimiter,
    rowEndDelimiter: data.rowEndDelimiter,
    globalContext: data.globalContext
  });

  // Insert columns and their values
  data.columns.forEach(col => {
    const columnId = createColumnDefinition(col);
    
    if (data.columnValues[col.sortOrder]) {
      data.columnValues[col.sortOrder].forEach(val => {
        createColumnValue({
          columnId,
          value: val.value,
          description: val.description
        });
      });
    }
  });

  // Insert slash commands
  data.slashCommands.forEach(cmd => {
    createSlashCommand(cmd);
  });
}

// Utility function for cleanup (no-op for JSON storage)
export function closeDB(): void {
  // No-op for JSON file storage
}