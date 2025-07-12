'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Plus, Trash2, Download, Upload } from 'lucide-react';
import { Header } from '@/components/header';
import {
  getUserSettings,
  updateUserSettings,
  getColumnDefinitions,
  getColumnValues,
  getSlashCommands,
  createSlashCommand,
  deleteSlashCommand,
  type UserSettings,
  type SlashCommand,
  type ColumnDefinition,
  type ColumnValue,
} from '@/lib/api-client';
import { generatePreviewOutput } from '@/lib/ai';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, ColumnValue[]>>({});
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);

  const [newCommand, setNewCommand] = useState({ command: '', expansion: '', description: '' });
  const [newColumnValue, setNewColumnValue] = useState<Record<string, { value: string; description: string }>>({});

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

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      await updateUserSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
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
        columnId,
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

  const previewOutput = settings ? generatePreviewOutput(settings, columns) : 'Loading...';

  const headerRightContent = (
    <>
      <Button variant="outline" onClick={handleExportSettings}>
        <Download className="w-4 h-4 mr-2" />
        Export
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
          Import
        </Button>
      </div>
      <Button onClick={handleSaveSettings}>
        <Save className="w-4 h-4 mr-2" />
        Save
      </Button>
    </>
  );

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
            rightContent={headerRightContent}
          />

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Output Format */}
            <Card>
              <CardHeader>
                <CardTitle>Output Format</CardTitle>
                <CardDescription>
                  Configure how your time entries will be formatted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Element Delimiter</label>
                    <Input
                      value={settings.elementDelimiter}
                      onChange={(e) => setSettings({...settings, elementDelimiter: e.target.value})}
                      placeholder=","
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Row End Delimiter</label>
                    <Input
                      value={settings.rowEndDelimiter}
                      onChange={(e) => setSettings({...settings, rowEndDelimiter: e.target.value})}
                      placeholder=";"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Context */}
            <Card>
              <CardHeader>
                <CardTitle>Global Context</CardTitle>
                <CardDescription>
                  Instructions that apply to all time entry processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.globalContext}
                  onChange={(e) => setSettings({...settings, globalContext: e.target.value})}
                  placeholder="Default work day is 9:00-17:00 unless specified..."
                  className="min-h-[100px]"
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input value={column.name} readOnly />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Format</label>
                          <Input value={column.format} readOnly />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Input value={column.description} readOnly />
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
                    <div key={command.$id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge>{command.command}</Badge>
                          <span className="text-sm">→ {command.expansion}</span>
                        </div>
                        {command.description && (
                          <div className="text-xs text-muted-foreground mt-1">{command.description}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlashCommand(command.$id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  Sample output with current settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded font-mono text-sm whitespace-pre-wrap">
                  {previewOutput}
                </div>
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Element delimiter: "{settings.elementDelimiter}"</div>
                  <div>Row end delimiter: "{settings.rowEndDelimiter}"</div>
                  <div>Columns: {columns.length}</div>
                  <div>Slash commands: {slashCommands.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
        </div>
    </div>
  );
}