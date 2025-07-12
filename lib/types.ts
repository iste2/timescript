// Database Schema Types
export interface UserSettings {
  id: number;
  elementDelimiter: string;
  rowEndDelimiter: string;
  globalContext: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDefinition {
  id: number;
  name: string;
  description: string;
  format: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnValue {
  id: number;
  columnId: number;
  value: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlashCommand {
  id: number;
  command: string;
  expansion: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Application Types
export interface ProcessingResult {
  success: boolean;
  formattedOutput?: string;
  explanation?: string;
  error?: string;
}

export interface AIProcessingRequest {
  input: string;
  settings: UserSettings;
  columns: ColumnDefinition[];
  columnValues: ColumnValue[];
  slashCommands: SlashCommand[];
}

export interface HighlightCategory {
  icon: string;
  color: string;
  label: string;
}

export const HIGHLIGHT_CATEGORIES: Record<string, HighlightCategory> = {
  success: {
    icon: "✅",
    color: "text-green-600",
    label: "Successful parsing"
  },
  assumption: {
    icon: "⚠️",
    color: "text-yellow-600", 
    label: "Assumptions/defaults used"
  },
  conflict: {
    icon: "🔀",
    color: "text-blue-600",
    label: "Conflict resolutions"
  },
  unclear: {
    icon: "❓",
    color: "text-orange-600",
    label: "Unclear mappings"
  },
  mapping: {
    icon: "📝",
    color: "text-purple-600",
    label: "Project/code assignments"
  }
};

// UI Component Types
export interface ResultCardProps {
  state: 'loading' | 'success' | 'error';
  formattedOutput?: string;
  explanation?: string;
  error?: string;
  onRetry?: () => void;
}

export interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  slashCommands: SlashCommand[];
}

// Settings Form Types
export interface SettingsFormData {
  elementDelimiter: string;
  rowEndDelimiter: string;
  globalContext: string;
  columns: Omit<ColumnDefinition, 'id' | 'createdAt' | 'updatedAt'>[];
  columnValues: Record<number, Omit<ColumnValue, 'id' | 'columnId' | 'createdAt' | 'updatedAt'>[]>;
  slashCommands: Omit<SlashCommand, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface ExportedSettings {
  version: string;
  settings: SettingsFormData;
  exportedAt: string;
}

// AI Processing Types
export interface ProcessingContext {
  userSettings: UserSettings;
  columns: ColumnDefinition[];
  columnValues: ColumnValue[];
  globalInstructions: string;
}

export interface TimeEntry {
  startTime: string;
  endTime: string;
  projectCode: string;
  description: string;
  [key: string]: string;
}