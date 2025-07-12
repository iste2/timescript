// Simple test to verify the JSON database works
const { getUserSettings, getColumnDefinitions, getSlashCommands } = require('./lib/db.ts');

console.log('Testing JSON database...');

try {
  const settings = getUserSettings();
  console.log('✅ Settings loaded:', settings.elementDelimiter, settings.rowEndDelimiter);
  
  const columns = getColumnDefinitions();
  console.log('✅ Columns loaded:', columns.length, 'columns');
  
  const commands = getSlashCommands();
  console.log('✅ Slash commands loaded:', commands.length, 'commands');
  
  console.log('🎉 Database is working correctly!');
} catch (error) {
  console.error('❌ Database error:', error.message);
}