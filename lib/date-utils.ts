// Date utility functions for default slash commands

export function getToday(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

export function getLastWeekday(dayName: string): string {
  // Find most recent occurrence of specified weekday
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  
  if (targetDay === -1) {
    throw new Error(`Invalid day name: ${dayName}`);
  }
  
  const today = new Date();
  const currentDay = today.getDay();
  
  // Calculate days since the target day
  let daysSince = (currentDay - targetDay + 7) % 7;
  
  // If today is the target day, go back to last week's occurrence
  if (daysSince === 0) {
    daysSince = 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() - daysSince);
  
  return targetDate.toISOString().split('T')[0];
}