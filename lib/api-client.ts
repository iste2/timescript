// API client for settings page
export interface UserSettings {
  id: string;
  elementDelimiter: string;
  rowEndDelimiter: string;
  globalContext: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlashCommand {
  $id: string;
  command: string;
  expansion: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDefinition {
  $id: string;
  name: string;
  description: string;
  format: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnValue {
  $id: string;
  columnDefinitionId: string;
  value: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// User Settings API
export async function getUserSettings(): Promise<UserSettings> {
  const response = await fetch('/api/user-settings');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get user settings');
  }
  
  return response.json();
}

export async function updateUserSettings(settings: {
  elementDelimiter: string;
  rowEndDelimiter: string;
  globalContext: string;
}): Promise<UserSettings> {
  const response = await fetch('/api/user-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user settings');
  }
  
  return response.json();
}

// Slash Commands API
export async function getSlashCommands(): Promise<SlashCommand[]> {
  const response = await fetch('/api/slash-commands');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get slash commands');
  }
  
  const data = await response.json();
  return data.commands;
}

export async function createSlashCommand(command: {
  command: string;
  expansion: string;
  description: string;
}): Promise<SlashCommand> {
  const response = await fetch('/api/slash-commands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create slash command');
  }
  
  return response.json();
}

export async function deleteSlashCommand(commandId: string): Promise<void> {
  const response = await fetch(`/api/slash-commands?id=${commandId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete slash command');
  }
}

// Placeholder functions for column definitions and values
// These can be implemented similarly when needed
export async function getColumnDefinitions(): Promise<ColumnDefinition[]> {
  // For now, return empty array - implement when API is created
  return [];
}

export async function getColumnValues(): Promise<ColumnValue[]> {
  // For now, return empty array - implement when API is created
  return [];
}