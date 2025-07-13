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

export async function updateSlashCommand(command: {
  id: string;
  command: string;
  expansion: string;
  description: string;
}): Promise<SlashCommand> {
  const response = await fetch('/api/slash-commands', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update slash command');
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

// Column Definitions API
export async function getColumnDefinitions(): Promise<ColumnDefinition[]> {
  const response = await fetch('/api/column-definitions');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get column definitions');
  }
  
  const data = await response.json();
  return data.definitions;
}

export async function createColumnDefinition(definition: {
  name: string;
  description: string;
  format: string;
  sortOrder: number;
}): Promise<ColumnDefinition> {
  const response = await fetch('/api/column-definitions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(definition),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create column definition');
  }
  
  return response.json();
}

export async function updateColumnDefinition(definition: {
  id: string;
  name: string;
  description: string;
  format: string;
  sortOrder: number;
}): Promise<ColumnDefinition> {
  const response = await fetch('/api/column-definitions', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(definition),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update column definition');
  }
  
  return response.json();
}

export async function deleteColumnDefinition(definitionId: string): Promise<void> {
  const response = await fetch(`/api/column-definitions?id=${definitionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete column definition');
  }
}

// Column Values API
export async function getColumnValues(): Promise<ColumnValue[]> {
  const response = await fetch('/api/column-values');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get column values');
  }
  
  const data = await response.json();
  return data.values;
}

export async function createColumnValue(value: {
  columnDefinitionId: string;
  value: string;
  description: string;
}): Promise<ColumnValue> {
  const response = await fetch('/api/column-values', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create column value');
  }
  
  return response.json();
}

export async function updateColumnValue(value: {
  id: string;
  columnDefinitionId: string;
  value: string;
  description: string;
}): Promise<ColumnValue> {
  const response = await fetch('/api/column-values', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update column value');
  }
  
  return response.json();
}

export async function deleteColumnValue(valueId: string): Promise<void> {
  const response = await fetch(`/api/column-values?id=${valueId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete column value');
  }
}