'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Download, Upload, Edit, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
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
  createColumnDefinition,
  updateColumnDefinition,
  deleteColumnDefinition,
  createColumnValue,
  updateColumnValue,
  deleteColumnValue,
  type UserSettings,
  type SlashCommand,
  type ColumnDefinition,
  type ColumnValue,
} from '@/lib/api-client';
import { type ExportedSettings } from '@/lib/types';

interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
}

interface SettingsClientProps {
  user: User;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, ColumnValue[]>>({});
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);

  // State for new items
  const [newCommand, setNewCommand] = useState({ command: '', expansion: '', description: '' });
  const [newColumn, setNewColumn] = useState({ name: '', description: '', format: '' });
  const [newColumnValue, setNewColumnValue] = useState<Record<string, { value: string; description: string }>>({});
  const [showNewColumnForm, setShowNewColumnForm] = useState(false);

  // Edit mode states
  const [isEditingOutputFormat, setIsEditingOutputFormat] = useState(false);
  const [isEditingGlobalContext, setIsEditingGlobalContext] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);
  const [editingColumnValueId, setEditingColumnValueId] = useState<string | null>(null);

  // Temporary edit values
  const [tempOutputFormat, setTempOutputFormat] = useState({ elementDelimiter: '', rowEndDelimiter: '' });
  const [tempGlobalContext, setTempGlobalContext] = useState('');
  const [tempColumn, setTempColumn] = useState({ name: '', description: '', format: '', sortOrder: 0 });
  const [tempCommand, setTempCommand] = useState({ command: '', expansion: '', description: '' });
  const [tempColumnValue, setTempColumnValue] = useState({ value: '', description: '' });

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
    } finally {
      setLoading(false);
    }
  };

  // Export/Import Settings Handlers
  const handleExportSettings = () => {
    if (!settings) return;
    
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
        setSettings(prev => prev ? ({
          ...prev,
          elementDelimiter: importData.settings.elementDelimiter,
          rowEndDelimiter: importData.settings.rowEndDelimiter,
          globalContext: importData.settings.globalContext
        }) : null);

        // Update columns (simplified for demo)
        const importedColumns = importData.settings.columns.map((col, index) => ({
          ...col,
          $id: `imported-${index + 1}`,
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
        elementDelimiter: tempOutputFormat.elementDelimiter,
        rowEndDelimiter: tempOutputFormat.rowEndDelimiter,
        globalContext: settings.globalContext
      };
      await updateUserSettings(updatedSettings);
      setSettings({ ...settings, ...updatedSettings });
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
        elementDelimiter: settings.elementDelimiter,
        rowEndDelimiter: settings.rowEndDelimiter,
        globalContext: tempGlobalContext
      };
      await updateUserSettings(updatedSettings);
      setSettings({ ...settings, globalContext: tempGlobalContext });
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
  const addColumn = async () => {
    if (!newColumn.name.trim() || !newColumn.format.trim()) return;

    try {
      // Calculate next sort order
      const maxSortOrder = Math.max(...columns.map(col => col.sortOrder), 0);
      
      const newColumnData = await createColumnDefinition({
        name: newColumn.name,
        description: newColumn.description,
        format: newColumn.format,
        sortOrder: maxSortOrder + 1
      });

      setColumns([...columns, newColumnData]);
      setNewColumn({ name: '', description: '', format: '' });
      setShowNewColumnForm(false);
    } catch (error) {
      console.error('Failed to add column:', error);
      alert('Failed to add column. Please try again.');
    }
  };

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
      const updatedColumn = await updateColumnDefinition({
        id: columnId,
        name: tempColumn.name,
        description: tempColumn.description,
        format: tempColumn.format,
        sortOrder: tempColumn.sortOrder
      });
      
      setColumns(columns.map(col => col.$id === columnId ? updatedColumn : col));
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
      
      setColumns(columns.filter(col => col.$id !== columnId));
      setColumnValues(prev => {
        const newValues = { ...prev };
        delete newValues[columnId];
        return newValues;
      });
    } catch (error) {
      console.error('Failed to delete column:', error);
      alert('Failed to delete column. Please try again.');
    }
  };

  // Column Sort Order Handlers
  const handleMoveColumnUp = async (columnId: string) => {
    const currentIndex = columns.findIndex(col => col.$id === columnId);
    if (currentIndex <= 0) return;
    
    const currentColumn = columns[currentIndex];
    const aboveColumn = columns[currentIndex - 1];
    
    try {
      const tempSortOrder = currentColumn.sortOrder;
      const updatedCurrent = { ...currentColumn, sortOrder: aboveColumn.sortOrder };
      const updatedAbove = { ...aboveColumn, sortOrder: tempSortOrder };
      
      await Promise.all([
        updateColumnDefinition({
          id: currentColumn.$id,
          name: currentColumn.name,
          description: currentColumn.description,
          format: currentColumn.format,
          sortOrder: updatedCurrent.sortOrder
        }),
        updateColumnDefinition({
          id: aboveColumn.$id,
          name: aboveColumn.name,
          description: aboveColumn.description,
          format: aboveColumn.format,
          sortOrder: updatedAbove.sortOrder
        })
      ]);
      
      const newColumns = columns.map(col => {
        if (col.$id === currentColumn.$id) return updatedCurrent;
        if (col.$id === aboveColumn.$id) return updatedAbove;
        return col;
      }).sort((a, b) => a.sortOrder - b.sortOrder);
      
      setColumns(newColumns);
    } catch (error) {
      console.error('Failed to move column up:', error);
      alert('Failed to move column up. Please try again.');
    }
  };

  const handleMoveColumnDown = async (columnId: string) => {
    const currentIndex = columns.findIndex(col => col.$id === columnId);
    if (currentIndex < 0 || currentIndex >= columns.length - 1) return;
    
    const currentColumn = columns[currentIndex];
    const belowColumn = columns[currentIndex + 1];
    
    try {
      const tempSortOrder = currentColumn.sortOrder;
      const updatedCurrent = { ...currentColumn, sortOrder: belowColumn.sortOrder };
      const updatedBelow = { ...belowColumn, sortOrder: tempSortOrder };
      
      await Promise.all([
        updateColumnDefinition({
          id: currentColumn.$id,
          name: currentColumn.name,
          description: currentColumn.description,
          format: currentColumn.format,
          sortOrder: updatedCurrent.sortOrder
        }),
        updateColumnDefinition({
          id: belowColumn.$id,
          name: belowColumn.name,
          description: belowColumn.description,
          format: belowColumn.format,
          sortOrder: updatedBelow.sortOrder
        })
      ]);
      
      const newColumns = columns.map(col => {
        if (col.$id === currentColumn.$id) return updatedCurrent;
        if (col.$id === belowColumn.$id) return updatedBelow;
        return col;
      }).sort((a, b) => a.sortOrder - b.sortOrder);
      
      setColumns(newColumns);
    } catch (error) {
      console.error('Failed to move column down:', error);
      alert('Failed to move column down. Please try again.');
    }
  };

  // Column Value Handlers
  const addColumnValue = async (columnId: string) => {
    const valueData = newColumnValue[columnId];
    if (!valueData?.value.trim()) return;

    try {
      const newValue = await createColumnValue({
        columnDefinitionId: columnId,
        value: valueData.value,
        description: valueData.description
      });

      setColumnValues(prev => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), newValue]
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

  const removeColumnValue = async (valueId: string, columnId: string) => {
    if (!confirm('Are you sure you want to delete this column value?')) {
      return;
    }

    try {
      await deleteColumnValue(valueId);
      
      setColumnValues(prev => ({
        ...prev,
        [columnId]: prev[columnId]?.filter(val => val.$id !== valueId) || []
      }));
    } catch (error) {
      console.error('Failed to delete column value:', error);
      alert('Failed to delete column value. Please try again.');
    }
  };

  const handleEditColumnValue = (value: ColumnValue) => {
    setTempColumnValue({
      value: value.value,
      description: value.description
    });
    setEditingColumnValueId(value.$id);
  };

  const handleSaveColumnValue = async (valueId: string, columnId: string) => {
    try {
      const updatedValue = await updateColumnValue({
        id: valueId,
        columnDefinitionId: columnId,
        value: tempColumnValue.value,
        description: tempColumnValue.description
      });

      setColumnValues(prev => ({
        ...prev,
        [columnId]: prev[columnId]?.map(val => val.$id === valueId ? updatedValue : val) || []
      }));
      
      setEditingColumnValueId(null);
    } catch (error) {
      console.error('Failed to save column value:', error);
      alert('Failed to save column value. Please try again.');
    }
  };

  const handleCancelColumnValueEdit = () => {
    setEditingColumnValueId(null);
    setTempColumnValue({ value: '', description: '' });
  };

  // Slash Command Handlers
  const addSlashCommand = async () => {
    if (!newCommand.command.trim() || !newCommand.expansion.trim()) return;

    try {
      const newSlashCommand = await createSlashCommand(newCommand);
      setSlashCommands([...slashCommands, newSlashCommand]);
      setNewCommand({ command: '', expansion: '', description: '' });
    } catch (error) {
      console.error('Failed to add slash command:', error);
      alert('Failed to add slash command. Please try again.');
    }
  };

  const removeSlashCommand = async (commandId: string) => {
    if (!confirm('Are you sure you want to delete this slash command?')) {
      return;
    }

    try {
      await deleteSlashCommand(commandId);
      setSlashCommands(slashCommands.filter(cmd => cmd.$id !== commandId));
    } catch (error) {
      console.error('Failed to delete slash command:', error);
      alert('Failed to delete slash command. Please try again.');
    }
  };

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
      const updatedCommand = await updateSlashCommand({
        id: commandId,
        command: tempCommand.command,
        expansion: tempCommand.expansion,
        description: tempCommand.description
      });

      setSlashCommands(slashCommands.map(cmd => cmd.$id === commandId ? updatedCommand : cmd));
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
        <Header currentPage="Settings" user={user} />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Settings Export/Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Settings Management
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportSettings}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Settings
                    </Button>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSettings}
                        className="hidden"
                        id="import-settings"
                      />
                      <Button variant="outline" onClick={() => document.getElementById('import-settings')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>Export your configuration or import from a backup</CardDescription>
              </CardHeader>
            </Card>

            {/* Output Format Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Output Format
                  {!isEditingOutputFormat && (
                    <Button variant="outline" size="sm" onClick={handleEditOutputFormat}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>Configure how your output is formatted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Element Delimiter</label>
                    {isEditingOutputFormat ? (
                      <Input
                        value={tempOutputFormat.elementDelimiter}
                        onChange={(e) => setTempOutputFormat(prev => ({ ...prev, elementDelimiter: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{settings.elementDelimiter}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Row End Delimiter</label>
                    {isEditingOutputFormat ? (
                      <Input
                        value={tempOutputFormat.rowEndDelimiter}
                        onChange={(e) => setTempOutputFormat(prev => ({ ...prev, rowEndDelimiter: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{settings.rowEndDelimiter}</p>
                    )}
                  </div>
                  {isEditingOutputFormat && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveOutputFormat} size="sm">
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancelOutputFormat} size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Global Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Global Context
                  {!isEditingGlobalContext && (
                    <Button variant="outline" size="sm" onClick={handleEditGlobalContext}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>Global instructions for AI processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isEditingGlobalContext ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tempGlobalContext}
                        onChange={(e) => setTempGlobalContext(e.target.value)}
                        className="min-h-[100px]"
                        placeholder="Enter global context instructions..."
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveGlobalContext} size="sm">
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancelGlobalContext} size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{settings.globalContext || 'No global context set'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Columns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Columns ({columns.length})
                  <Button size="sm" onClick={() => setShowNewColumnForm(!showNewColumnForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                </CardTitle>
                <CardDescription>Configure your output columns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* New column form */}
                  {showNewColumnForm && (
                    <div className="border rounded p-4 bg-gray-50">
                      <h5 className="text-sm font-medium mb-3">Add New Column</h5>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <Input
                          placeholder="Column Name"
                          value={newColumn.name}
                          onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                          placeholder="Description"
                          value={newColumn.description}
                          onChange={(e) => setNewColumn(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <Input
                          placeholder="Format"
                          value={newColumn.format}
                          onChange={(e) => setNewColumn(prev => ({ ...prev, format: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={addColumn} 
                          size="sm"
                          disabled={!newColumn.name.trim() || !newColumn.format.trim()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Column
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setNewColumn({ name: '', description: '', format: '' });
                            setShowNewColumnForm(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {columns.map((column, index) => (
                    <div key={column.$id} className="border rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingColumnId === column.$id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                  value={tempColumn.name}
                                  onChange={(e) => setTempColumn(prev => ({ ...prev, name: e.target.value }))}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                  value={tempColumn.description}
                                  onChange={(e) => setTempColumn(prev => ({ ...prev, description: e.target.value }))}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Format</label>
                                <Input
                                  value={tempColumn.format}
                                  onChange={(e) => setTempColumn(prev => ({ ...prev, format: e.target.value }))}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleSaveColumn(column.$id)} size="sm">
                                  <Check className="w-4 h-4 mr-2" />
                                  Save
                                </Button>
                                <Button variant="outline" onClick={handleCancelColumnEdit} size="sm">
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{column.name}</h4>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMoveColumnUp(column.$id)}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMoveColumnDown(column.$id)}
                                    disabled={index === columns.length - 1}
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditColumn(column)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteColumn(column.$id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{column.description}</p>
                              <p className="text-xs text-muted-foreground">Format: {column.format}</p>
                              
                              {/* Column Values */}
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium">Values ({columnValues[column.$id]?.length || 0})</h5>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setNewColumnValue(prev => ({
                                        ...prev,
                                        [column.$id]: { value: '', description: '' }
                                      }));
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Value
                                  </Button>
                                </div>
                                
                                {/* New value input */}
                                {newColumnValue[column.$id] && (
                                  <div className="mb-2 p-2 bg-gray-50 rounded border">
                                    <div className="flex gap-2 mb-2">
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
                                    </div>
                                    <div className="flex gap-1">
                                      <Button 
                                        onClick={() => addColumnValue(column.$id)} 
                                        size="sm"
                                        disabled={!newColumnValue[column.$id]?.value.trim()}
                                      >
                                        Add
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setNewColumnValue(prev => {
                                          const newValues = { ...prev };
                                          delete newValues[column.$id];
                                          return newValues;
                                        })}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Existing values */}
                                <div className="space-y-1">
                                  {(columnValues[column.$id] || []).map((value) => (
                                    <div key={value.$id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                      {editingColumnValueId === value.$id ? (
                                        <div className="flex gap-2 w-full">
                                          <Input
                                            value={tempColumnValue.value}
                                            onChange={(e) => setTempColumnValue(prev => ({ ...prev, value: e.target.value }))}
                                          />
                                          <Input
                                            value={tempColumnValue.description}
                                            onChange={(e) => setTempColumnValue(prev => ({ ...prev, description: e.target.value }))}
                                          />
                                          <Button onClick={() => handleSaveColumnValue(value.$id, column.$id)} size="sm">
                                            <Check className="w-3 h-3" />
                                          </Button>
                                          <Button variant="outline" onClick={handleCancelColumnValueEdit} size="sm">
                                            <X className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex-1">
                                            <span className="font-medium">{value.value}</span>
                                            {value.description && (
                                              <span className="text-muted-foreground ml-2">- {value.description}</span>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditColumnValue(value)}>
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeColumnValue(value.$id, column.$id)}
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Slash Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Slash Commands ({slashCommands.length})
                </CardTitle>
                <CardDescription>Configure your slash command shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* New command input */}
                  <div className="border rounded p-4 bg-gray-50">
                    <h5 className="text-sm font-medium mb-3">Add New Command</h5>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <Input
                        placeholder="Command (e.g., /break)"
                        value={newCommand.command}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, command: e.target.value }))}
                      />
                      <Input
                        placeholder="Expansion"
                        value={newCommand.expansion}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, expansion: e.target.value }))}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newCommand.description}
                        onChange={(e) => setNewCommand(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={addSlashCommand} 
                        size="sm"
                        disabled={!newCommand.command.trim() || !newCommand.expansion.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Command
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setNewCommand({ command: '', expansion: '', description: '' })}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Existing commands */}
                  <div className="space-y-2">
                    {slashCommands.map((command) => (
                      <div key={command.$id} className="border rounded p-3">
                        {editingCommandId === command.$id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs font-medium">Command</label>
                                <Input
                                  value={tempCommand.command}
                                  onChange={(e) => setTempCommand(prev => ({ ...prev, command: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Expansion</label>
                                <Input
                                  value={tempCommand.expansion}
                                  onChange={(e) => setTempCommand(prev => ({ ...prev, expansion: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Description</label>
                                <Input
                                  value={tempCommand.description}
                                  onChange={(e) => setTempCommand(prev => ({ ...prev, description: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleSaveCommand(command.$id)} size="sm">
                                <Check className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                              <Button variant="outline" onClick={handleCancelCommandEdit} size="sm">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary">{command.command}</Badge>
                                <span className="text-sm">→ {command.expansion}</span>
                              </div>
                              {command.description && (
                                <div className="text-xs text-muted-foreground">{command.description}</div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditCommand(command)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSlashCommand(command.$id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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