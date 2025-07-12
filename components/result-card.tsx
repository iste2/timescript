'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Copy, RotateCcw, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ResultCardProps, HIGHLIGHT_CATEGORIES } from '@/lib/types';

export function ResultCard({ 
  state, 
  formattedOutput, 
  explanation, 
  error, 
  onRetry 
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!formattedOutput) return;
    
    try {
      await navigator.clipboard.writeText(formattedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (state === 'loading') {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4 py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="text-lg">Processing your work day...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span>Processing Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-700">{error}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'success' && formattedOutput) {
    return (
      <Card className="w-full border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-700">
            <CheckCircle className="h-5 w-5" />
            <span>Time Entries Generated</span>
          </CardTitle>
          <CardDescription>
            Copy the formatted output below or review the AI's processing explanation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formatted Output Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Formatted Output</h3>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-4">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {formattedOutput}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* AI Explanation Section */}
          {explanation && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">AI Processing Explanation</h3>
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-4">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          // Custom renderer for paragraphs to add highlight styling
                          p: ({ children }) => {
                            const text = children?.toString() || '';
                            
                            // Check if this paragraph contains highlight categories
                            const categoryMatch = Object.entries(HIGHLIGHT_CATEGORIES).find(
                              ([key, category]) => text.includes(category.icon)
                            );
                            
                            if (categoryMatch) {
                              const [key, category] = categoryMatch;
                              return (
                                <div className={`flex items-start space-x-2 p-3 rounded-lg bg-gray-50 border-l-4 border-l-gray-300 my-2`}>
                                  <span className="text-lg">{category.icon}</span>
                                  <div className="flex-1">
                                    <p className="m-0">{children}</p>
                                  </div>
                                </div>
                              );
                            }
                            
                            return <p className="mb-3">{children}</p>;
                          },
                          
                          // Style headings
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                              {children}
                            </h2>
                          ),
                          
                          // Style lists
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              {children}
                            </ul>
                          ),
                          
                          li: ({ children }) => (
                            <li className="text-sm">{children}</li>
                          ),
                          
                          // Style strong text
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-800">
                              {children}
                            </strong>
                          ),
                          
                          // Style code blocks
                          code: ({ children }) => (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                              {children}
                            </code>
                          )
                        }}
                      >
                        {explanation}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Legend for highlight categories */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Legend</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(HIGHLIGHT_CATEGORIES).map(([key, category]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}