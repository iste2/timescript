'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InputAreaProps, SlashCommand } from '@/lib/types';
import { getDefaultCommandsInfo, DefaultCommandInfo } from '@/lib/default-commands';

export function InputArea({ 
  value, 
  onChange, 
  onSubmit, 
  isProcessing, 
  slashCommands 
}: InputAreaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<(SlashCommand | DefaultCommandInfo)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Find slash commands in text and show suggestions
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const position = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, position);
    
    // Find the last word before cursor that starts with /
    const match = textBeforeCursor.match(/\/(\w*)$/);
    
    if (match) {
      const query = match[1].toLowerCase();
      
      // Get default commands
      const defaultCommands = getDefaultCommandsInfo();
      
      // Filter both user commands and default commands
      const filteredUserCommands = slashCommands.filter(cmd => 
        cmd.command.toLowerCase().includes(query.toLowerCase())
      );
      
      const filteredDefaultCommands = defaultCommands.filter(cmd => 
        cmd.command.toLowerCase().includes(query.toLowerCase())
      );
      
      // Combine commands (default commands first)
      const allFilteredCommands = [...filteredDefaultCommands, ...filteredUserCommands];
      
      if (allFilteredCommands.length > 0) {
        setFilteredCommands(allFilteredCommands);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, cursorPosition, slashCommands]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) {
      // Handle Enter to submit (Ctrl+Enter or Cmd+Enter)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    // Handle suggestions navigation
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        insertCommand(filteredCommands[selectedIndex]);
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  const insertCommand = (command: SlashCommand | DefaultCommandInfo) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const position = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, position);
    const textAfterCursor = value.substring(position);
    
    // Find the start of the current slash command
    const match = textBeforeCursor.match(/\/\w*$/);
    if (!match) return;

    const commandStart = position - match[0].length;
    const newText = 
      value.substring(0, commandStart) +
      command.expansion +
      textAfterCursor;
    
    onChange(newText);
    setShowSuggestions(false);
    
    // Set cursor position after the expansion
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = commandStart + command.expansion.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSuggestionClick = (command: SlashCommand | DefaultCommandInfo) => {
    insertCommand(command);
  };

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-sm border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Describe Your Work Day</h2>
          <div className="text-sm text-muted-foreground">
            Type / for slash commands • Ctrl+Enter to process
          </div>
        </div>
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Today I worked on the Smith project from 9-11am, then had a client call with ABC Corp until noon, followed by internal meetings and code review until 5pm..."
            className="min-h-[120px] resize-y text-base"
            disabled={isProcessing}
          />
          
          {/* Slash command suggestions */}
          {showSuggestions && (
            <Card className="absolute top-full mt-1 w-full max-w-md z-10 p-2">
              <div className="space-y-1">
                {filteredCommands.map((command, index) => {
                  // Check if this is a default command (no $id) or user command
                  const isDefaultCommand = !('$id' in command);
                  const commandKey = isDefaultCommand ? command.command : command.$id;
                  
                  return (
                    <div
                      key={commandKey}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? 'bg-accent text-accent-foreground' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSuggestionClick(command)}
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center">
                          {command.command}
                          {isDefaultCommand && (
                            <span className="ml-2 text-xs bg-blue-100 px-1 rounded">built-in</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {command.expansion}
                        </div>
                      </div>
                      {command.description && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {command.description}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Show a mix of default and user commands */}
            {getDefaultCommandsInfo().map(command => (
              <Badge 
                key={command.command}
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => insertCommand(command)}
              >
                {command.command}
              </Badge>
            ))}
            {slashCommands.map(command => (
              <Badge 
                key={command.$id}
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => insertCommand(command)}
              >
                {command.command}
              </Badge>
            ))}
          </div>
          
          <Button
            onClick={onSubmit}
            disabled={isProcessing || !value.trim()}
            size="lg"
            className="min-w-[120px]"
          >
            {isProcessing ? 'Processing...' : 'Generate'}
          </Button>
        </div>
      </div>
    </div>
  );
}