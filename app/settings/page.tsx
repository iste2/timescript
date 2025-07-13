'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Download, Upload, Edit, Check, X } from 'lucide-react';
import { Header } from '@/components/header';
import {
  getUserSettings,
  updateUserSettings,
  getColumnDefinitions,
  getColumnValues,
  getSlashCommands,
  createSlashCommand,
  updateSlashCommand,
  deleteSlashCommand,
  updateColumnDefinition,
  deleteColumnDefinition,
  createColumnValue,
  deleteColumnValue,
  type UserSettings,
  type SlashCommand,
  type ColumnDefinition,
  type ColumnValue,
  type ExportedSettings,
} from '@/lib/api-client';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, ColumnValue[]>>({});
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);

  const [newCommand, setNewCommand] = useState({ command: '', expansion: '', description: '' });
  const [newColumnValue, setNewColumnValue] = useState<Record<string, { value: string; description: string }>>({});

  // Edit mode states
  const [isEditingOutputFormat, setIsEditingOutputFormat] = useState(false);
  const [isEditingGlobalContext, setIsEditingGlobalContext] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);

  // Temporary edit values
  const [tempOutputFormat, setTempOutputFormat] = useState({ elementDelimiter: '', rowEndDelimiter: '' });
  const [tempGlobalContext, setTempGlobalContext] = useState('');
  const [tempColumn, setTempColumn] = useState({ name: '', description: '', format: '', sortOrder: 0 });
  const [tempCommand, setTempCommand] = useState({ command: '', expansion: '', description: '' });

  // Load data from Appwrite
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [settingsData, columnsData, columnValuesData, slashCommandsData] = await Promise.all([
        getUserSettings(),
        getColumnDefinitions(),
        getColumnValues(),
        getSlashCommands()
      ]);

      setSettings(settingsData);
      setColumns(columnsData);
      setSlashCommands(slashCommandsData);

      // Group column values by column ID
      const groupedValues: Record<string, ColumnValue[]> = {};
      columnValuesData.forEach(value => {
        if (!groupedValues[value.columnDefinitionId]) {
          groupedValues[value.columnDefinitionId] = [];
        }
        groupedValues[value.columnDefinitionId].push(value);
      });
      setColumnValues(groupedValues);

    } catch (error) {
      console.error('Failed to load settings:', error);
      // Show error to user
    } finally {
      setLoading(false);
    }
  };


  const handleExportSettings = () => {
    const exportData: ExportedSettings = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        elementDelimiter: settings.elementDelimiter,
        rowEndDelimiter: settings.rowEndDelimiter,
        globalContext: settings.globalContext,
        columns: columns.map(col => ({
          name: col.name,
          description: col.description,
          format: col.format,
          sortOrder: col.sortOrder
        })),
        columnValues: Object.fromEntries(
          Object.entries(columnValues).map(([columnId, values]) => [
            columnId,
            values.map(val => ({ value: val.value, description: val.description }))
          ])
        ),
        slashCommands: slashCommands.map(cmd => ({
          command: cmd.command,
          expansion: cmd.expansion,
          description: cmd.description
        }))
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timescript-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData: ExportedSettings = JSON.parse(e.target?.result as string);
        
        // Update state with imported data
        setSettings(prev => ({
          ...prev,
          elementDelimiter: importData.settings.elementDelimiter,
          rowEndDelimiter: importData.settings.rowEndDelimiter,
          globalContext: importData.settings.globalContext
        }));

        // Update columns (simplified for demo)
        const importedColumns = importData.settings.columns.map((col, index) => ({
          ...col,
          id: index + 1,
          createdAt: '',
          updatedAt: ''
        }));
        setColumns(importedColumns);

        alert('Settings imported successfully!');
      } catch (error) {
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const addSlashCommand = async () => {
    if (!newCommand.command || !newCommand.expansion) return;
    
    try {
      const command = await createSlashCommand({
        command: newCommand.command.startsWith('/') ? newCommand.command : '/' + newCommand.command,
        expansion: newCommand.expansion,
        description: newCommand.description,
      });
      
      setSlashCommands([...slashCommands, command]);
      setNewCommand({ command: '', expansion: '', description: '' });
    } catch (error) {
      console.error('Failed to add slash command:', error);
      alert('Failed to add slash command. Please try again.');
    }
  };

  const removeSlashCommand = async (id: string) => {
    try {
      await deleteSlashCommand(id);
      setSlashCommands(slashCommands.filter(cmd => cmd.$id !== id));
    } catch (error) {
      console.error('Failed to remove slash command:', error);
      alert('Failed to remove slash command. Please try again.');
    }
  };

  const addColumnValue = async (columnId: string) => {
    const newValue = newColumnValue[columnId];
    if (!newValue?.value) return;

    try {
      const value = await createColumnValue({
        columnDefinitionId: columnId,
        value: newValue.value,
        description: newValue.description,
      });

      setColumnValues(prev => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), value]
      }));

      setNewColumnValue(prev => ({
        ...prev,
        [columnId]: { value: '', description: '' }
      }));
    } catch (error) {
      console.error('Failed to add column value:', error);
      alert('Failed to add column value. Please try again.');
    }
  };

  const removeColumnValue = async (columnId: string, valueId: string) => {
    try {
      await deleteColumnValue(valueId);
      setColumnValues(prev => ({
        ...prev,
        [columnId]: (prev[columnId] || []).filter(val => val.$id !== valueId)
      }));
    } catch (error) {
      console.error('Failed to remove column value:', error);
      alert('Failed to remove column value. Please try again.');
    }
  };

  // Output Format Handlers
  const handleEditOutputFormat = () => {
    setTempOutputFormat({
      elementDelimiter: settings?.elementDelimiter || '',
      rowEndDelimiter: settings?.rowEndDelimiter || ''
    });
    setIsEditingOutputFormat(true);
  };

  const handleSaveOutputFormat = async () => {
    if (!settings) return;
    
    try {
      const updatedSettings = {
        ...settings,
        elementDelimiter: tempOutputFormat.elementDelimiter,
        rowEndDelimiter: tempOutputFormat.rowEndDelimiter
      };
      await updateUserSettings(updatedSettings);
      setSettings(updatedSettings);
      setIsEditingOutputFormat(false);
    } catch (error) {
      console.error('Failed to save output format:', error);
      alert('Failed to save output format. Please try again.');
    }
  };

  const handleCancelOutputFormat = () => {
    setIsEditingOutputFormat(false);
    setTempOutputFormat({ elementDelimiter: '', rowEndDelimiter: '' });
  };

  // Global Context Handlers
  const handleEditGlobalContext = () => {
    setTempGlobalContext(settings?.globalContext || '');
    setIsEditingGlobalContext(true);
  };

  const handleSaveGlobalContext = async () => {
    if (!settings) return;
    
    try {
      const updatedSettings = {
        ...settings,
        globalContext: tempGlobalContext
      };
      await updateUserSettings(updatedSettings);
      setSettings(updatedSettings);
      setIsEditingGlobalContext(false);
    } catch (error) {
      console.error('Failed to save global context:', error);
      alert('Failed to save global context. Please try again.');
    }
  };

  const handleCancelGlobalContext = () => {
    setIsEditingGlobalContext(false);
    setTempGlobalContext('');
  };

  // Column Handlers
  const handleEditColumn = (column: ColumnDefinition) => {
    setTempColumn({
      name: column.name,
      description: column.description,
      format: column.format,
      sortOrder: column.sortOrder
    });
    setEditingColumnId(column.$id);
  };

  const handleSaveColumn = async (columnId: string) => {
    try {
      await updateColumnDefinition({
        id: columnId,
        name: tempColumn.name,
        description: tempColumn.description,
        format: tempColumn.format,
        sortOrder: tempColumn.sortOrder
      });
      await loadData(); // Reload data to get updated columns
      setEditingColumnId(null);
    } catch (error) {
      console.error('Failed to save column:', error);
      alert('Failed to save column. Please try again.');
    }
  };

  const handleCancelColumnEdit = () => {
    setEditingColumnId(null);
    setTempColumn({ name: '', description: '', format: '', sortOrder: 0 });
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column? This will also delete all associated values.')) {
      return;
    }
    
    try {
      await deleteColumnDefinition(columnId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Failed to delete column:', error);
      alert('Failed to delete column. Please try again.');
    }
  };

  // Slash Command Handlers
  const handleEditCommand = (command: SlashCommand) => {
    setTempCommand({
      command: command.command,
      expansion: command.expansion,
      description: command.description
    });
    setEditingCommandId(command.$id);
  };

  const handleSaveCommand = async (commandId: string) => {
    try {
      await updateSlashCommand({
        id: commandId,
        command: tempCommand.command,
        expansion: tempCommand.expansion,
        description: tempCommand.description
      });
      await loadData(); // Reload data to get updated commands
      setEditingCommandId(null);
    } catch (error) {
      console.error('Failed to save command:', error);
      alert('Failed to save command. Please try again.');
    }
  };

  const handleCancelCommandEdit = () => {
    setEditingCommandId(null);
    setTempCommand({ command: '', expansion: '', description: '' });
  };



  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
        {/* Top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-[250px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0"></div>
        
        <div className="relative z-10">
          <Header 
            currentPage="Settings"
          />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Output Format */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Output Format</CardTitle>
                    <CardDescription>
                      Configure how your time entries will be formatted
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isEditingOutputFormat ? (
                      <Button variant="outline" size="sm" onClick={handleEditOutputFormat}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelOutputFormat}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveOutputFormat}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Element Delimiter</label>
                    <Input
                      value={isEditingOutputFormat ? tempOutputFormat.elementDelimiter : settings.elementDelimiter}
                      onChange={(e) => isEditingOutputFormat && setTempOutputFormat({...tempOutputFormat, elementDelimiter: e.target.value})}
                      placeholder=","
                      disabled={!isEditingOutputFormat}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Row End Delimiter</label>
                    <Input
                      value={isEditingOutputFormat ? tempOutputFormat.rowEndDelimiter : settings.rowEndDelimiter}
                      onChange={(e) => isEditingOutputFormat && setTempOutputFormat({...tempOutputFormat, rowEndDelimiter: e.target.value})}
                      placeholder=";"
                      disabled={!isEditingOutputFormat}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Context */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Global Context</CardTitle>
                    <CardDescription>
                      Instructions that apply to all time entry processing
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isEditingGlobalContext ? (
                      <Button variant="outline" size="sm" onClick={handleEditGlobalContext}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelGlobalContext}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveGlobalContext}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={isEditingGlobalContext ? tempGlobalContext : settings.globalContext}
                  onChange={(e) => isEditingGlobalContext && setTempGlobalContext(e.target.value)}
                  placeholder="Default work day is 9:00-17:00 unless specified..."
                  className="min-h-[100px]"
                  disabled={!isEditingGlobalContext}
                />
              </CardContent>
            </Card>

            {/* Columns */}
            <Card>
              <CardHeader>
                <CardTitle>Columns</CardTitle>
                <CardDescription>
                  Define the structure of your time entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {columns.map((column) => (
                    <div key={column.$id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">Column Definition</h4>
                        <div className="flex gap-2">
                          {editingColumnId !== column.$id ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEditColumn(column)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteColumn(column.$id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={handleCancelColumnEdit}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleSaveColumn(column.$id)}>
                                <Check className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input 
                            value={editingColumnId === column.$id ? tempColumn.name : column.name} 
                            onChange={(e) => editingColumnId === column.$id && setTempColumn({...tempColumn, name: e.target.value})}
                            disabled={editingColumnId !== column.$id}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Format</label>
                          <Input 
                            value={editingColumnId === column.$id ? tempColumn.format : column.format} 
                            onChange={(e) => editingColumnId === column.$id && setTempColumn({...tempColumn, format: e.target.value})}
                            disabled={editingColumnId !== column.$id}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Input 
                            value={editingColumnId === column.$id ? tempColumn.description : column.description} 
                            onChange={(e) => editingColumnId === column.$id && setTempColumn({...tempColumn, description: e.target.value})}
                            disabled={editingColumnId !== column.$id}
                          />
                        </div>
                      </div>
                      
                      {/* Column Values */}
                      {columnValues[column.$id] && (
                        <div className="mt-4">
                          <label className="text-sm font-medium mb-2 block">Possible Values</label>
                          <div className="space-y-2">
                            {columnValues[column.$id].map((value) => (
                              <div key={value.$id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div>
                                  <Badge variant="outline" className="mr-2">{value.value}</Badge>
                                  <span className="text-sm text-muted-foreground">{value.description}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeColumnValue(column.$id, value.$id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Value"
                                value={newColumnValue[column.$id]?.value || ''}
                                onChange={(e) => setNewColumnValue(prev => ({
                                  ...prev,
                                  [column.$id]: { ...prev[column.$id], value: e.target.value }
                                }))}
                              />
                              <Input
                                placeholder="Description"
                                value={newColumnValue[column.$id]?.description || ''}
                                onChange={(e) => setNewColumnValue(prev => ({
                                  ...prev,
                                  [column.$id]: { ...prev[column.$id], description: e.target.value }
                                }))}
                              />
                              <Button size="sm" onClick={() => addColumnValue(column.$id)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Slash Commands */}
            <Card>
              <CardHeader>
                <CardTitle>Slash Commands</CardTitle>
                <CardDescription>
                  Create shortcuts for common phrases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slashCommands.map((command) => (
                    <div key={command.$id} className="bg-gray-50 p-3 rounded">
                      {editingCommandId !== command.$id ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge>{command.command}</Badge>
                              <span className="text-sm">→ {command.expansion}</span>
                            </div>
                            {command.description && (
                              <div className="text-xs text-muted-foreground mt-1">{command.description}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCommand(command)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSlashCommand(command.$id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">Edit Command</h5>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleCancelCommandEdit}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleSaveCommand(command.$id)}>
                                <Check className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="/command"
                              value={tempCommand.command}
                              onChange={(e) => setTempCommand({...tempCommand, command: e.target.value})}
                            />
                            <Input
                              placeholder="Expansion"
                              value={tempCommand.expansion}
                              onChange={(e) => setTempCommand({...tempCommand, expansion: e.target.value})}
                            />
                            <Input
                              placeholder="Description"
                              value={tempCommand.description}
                              onChange={(e) => setTempCommand({...tempCommand, description: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="/command"
                      value={newCommand.command}
                      onChange={(e) => setNewCommand({...newCommand, command: e.target.value})}
                    />
                    <Input
                      placeholder="Expansion"
                      value={newCommand.expansion}
                      onChange={(e) => setNewCommand({...newCommand, expansion: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={newCommand.description}
                        onChange={(e) => setNewCommand({...newCommand, description: e.target.value})}
                      />
                      <Button onClick={addSlashCommand}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export/Import */}
            <Card>
              <CardHeader>
                <CardTitle>Settings Management</CardTitle>
                <CardDescription>
                  Export or import your settings configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleExportSettings}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Settings
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
    </div>
  );
}