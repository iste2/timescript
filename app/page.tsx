'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { InputArea } from '@/components/input-area';
import { ResultCard } from '@/components/result-card';
import { SlashCommand, ProcessingResult } from '@/lib/types';

export default function Home() {
  const [input, setInput] = useState('');
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load slash commands on component mount
  useEffect(() => {
    loadSlashCommands();
  }, []);

  const loadSlashCommands = async () => {
    try {
      // For now, we'll use some default commands since we haven't implemented the settings API yet
      const defaultCommands: SlashCommand[] = [
        {
          id: 1,
          command: '/break',
          expansion: 'Break from 12:00 to 12:30',
          description: 'Standard lunch break',
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 2,
          command: '/lunch',
          expansion: 'Lunch break from 12:00 to 13:00',
          description: 'Extended lunch break',
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 3,
          command: '/meeting',
          expansion: 'Team meeting',
          description: 'Generic team meeting',
          createdAt: '',
          updatedAt: ''
        }
      ];
      setSlashCommands(defaultCommands);
    } catch (error) {
      console.error('Failed to load slash commands:', error);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          formattedOutput: data.formattedOutput,
          explanation: data.explanation
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      setResult({
        success: false,
        error: 'Failed to connect to the processing service. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    handleGenerate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Timescript</h1>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Input Area */}
          <InputArea
            value={input}
            onChange={setInput}
            onSubmit={handleGenerate}
            isProcessing={isProcessing}
            slashCommands={slashCommands}
          />

          {/* Results */}
          {(isProcessing || result) && (
            <div className="space-y-4">
              {isProcessing && (
                <ResultCard 
                  state="loading"
                />
              )}
              
              {result && !isProcessing && (
                <ResultCard
                  state={result.success ? 'success' : 'error'}
                  formattedOutput={result.formattedOutput}
                  explanation={result.explanation}
                  error={result.error}
                  onRetry={handleRetry}
                />
              )}
            </div>
          )}

          {/* Instructions */}
          {!result && !isProcessing && (
            <div className="text-center text-muted-foreground py-12">
              <div className="space-y-4">
                <h2 className="text-xl font-medium">How it works</h2>
                <div className="max-w-2xl mx-auto space-y-2 text-left">
                  <p>1. Describe your work day in natural language</p>
                  <p>2. Use slash commands for common tasks (type / to see options)</p>
                  <p>3. Click Generate or press Ctrl+Enter to process</p>
                  <p>4. Copy the formatted output for your time tracking system</p>
                </div>
                <div className="pt-4">
                  <Link href="/settings">
                    <Button variant="outline">
                      Configure Output Format
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
