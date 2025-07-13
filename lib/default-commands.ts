// Default slash commands that execute functions (not saved to database)

import { getToday, getYesterday, getLastWeekday } from './date-utils';

// Default commands mapping - command to function
export const DEFAULT_COMMANDS: Record<string, () => string> = {
  '/today': () => getToday(),
  '/yesterday': () => getYesterday(), 
  '/last_monday': () => getLastWeekday('monday'),
  '/last_tuesday': () => getLastWeekday('tuesday'),
  '/last_wednesday': () => getLastWeekday('wednesday'),
  '/last_thursday': () => getLastWeekday('thursday'),
  '/last_friday': () => getLastWeekday('friday'),
  '/last_saturday': () => getLastWeekday('saturday'),
  '/last_sunday': () => getLastWeekday('sunday')
};

// Get list of default command names for autocomplete
export function getDefaultCommandNames(): string[] {
  return Object.keys(DEFAULT_COMMANDS);
}

// Execute a default command if it exists
export function executeDefaultCommand(command: string): string | null {
  const commandFunc = DEFAULT_COMMANDS[command.toLowerCase()];
  if (commandFunc) {
    try {
      return commandFunc();
    } catch (error) {
      console.error(`Error executing default command ${command}:`, error);
      return null;
    }
  }
  return null;
}

// Check if a command is a default command
export function isDefaultCommand(command: string): boolean {
  return command.toLowerCase() in DEFAULT_COMMANDS;
}

// Get default commands for autocomplete display (with descriptions)
export interface DefaultCommandInfo {
  command: string;
  description: string;
  expansion: string; // For display purposes
}

export function getDefaultCommandsInfo(): DefaultCommandInfo[] {
  return [
    { command: '/today', description: 'Today\'s date', expansion: getToday() },
    { command: '/yesterday', description: 'Yesterday\'s date', expansion: getYesterday() },
    { command: '/last_monday', description: 'Last Monday\'s date', expansion: getLastWeekday('monday') },
    { command: '/last_tuesday', description: 'Last Tuesday\'s date', expansion: getLastWeekday('tuesday') },
    { command: '/last_wednesday', description: 'Last Wednesday\'s date', expansion: getLastWeekday('wednesday') },
    { command: '/last_thursday', description: 'Last Thursday\'s date', expansion: getLastWeekday('thursday') },
    { command: '/last_friday', description: 'Last Friday\'s date', expansion: getLastWeekday('friday') },
    { command: '/last_saturday', description: 'Last Saturday\'s date', expansion: getLastWeekday('saturday') },
    { command: '/last_sunday', description: 'Last Sunday\'s date', expansion: getLastWeekday('sunday') }
  ];
}