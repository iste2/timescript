import { NextRequest, NextResponse } from 'next/server';
import { processTimeEntry } from '@/lib/ai';
import { 
  getUserSettings, 
  getColumnDefinitions, 
  getColumnValues, 
  getSlashCommands,
  saveTimeEntry
} from '@/lib/database';
import { AIProcessingRequest, ProcessingResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Input is required and must be a string' },
        { status: 400 }
      );
    }

    if (input.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Input cannot be empty' },
        { status: 400 }
      );
    }

    // Get user settings and configuration from database
    let settings, columns, columnValues, slashCommands;
    
    try {
      settings = await getUserSettings();
      columns = await getColumnDefinitions();
      columnValues = await getColumnValues();
      slashCommands = await getSlashCommands();
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Check if it's an authentication error
      if (dbError instanceof Error && dbError.message.includes('not authenticated')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required. Please log in to continue.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to load user settings' },
        { status: 500 }
      );
    }

    // Validate that we have minimum required configuration
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'User settings not found' },
        { status: 500 }
      );
    }

    if (columns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No column definitions found. Please configure your settings first.' },
        { status: 400 }
      );
    }

    // Build the AI processing request
    const aiRequest: AIProcessingRequest = {
      input: input.trim(),
      settings,
      columns,
      columnValues,
      slashCommands
    };

    // Process with AI
    const result: ProcessingResult = await processTimeEntry(aiRequest);

    // Save the time entry if processing was successful
    if (result.success) {
      try {
        await saveTimeEntry(input.trim(), result);
      } catch (saveError) {
        console.error('Failed to save time entry:', saveError);
        // Don't fail the request if saving fails, just log it
      }
    }

    // Return the result
    return NextResponse.json(result);

  } catch (error) {
    console.error('API error:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service configuration error. Please check your API key configuration.' 
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service rate limit exceeded. Please try again in a moment.' 
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service timeout. Please try again.' 
          },
          { status: 408 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred while processing your request. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}