import { NextRequest, NextResponse } from 'next/server';
import { processTimeEntry } from '@/lib/ai';
import { getLoggedInUser, createSessionClient } from '@/lib/server/appwrite';
import { Query, ID, Permission, Role } from 'node-appwrite';
import { AIProcessingRequest, ProcessingResult } from '@/lib/types';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';
const COLLECTIONS = {
  USER_SETTINGS: process.env.NEXT_PUBLIC_COLLECTION_USER_SETTINGS || 'userSettings',
  COLUMN_DEFINITIONS: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_DEFINITIONS || 'columnDefinitions',
  COLUMN_VALUES: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_VALUES || 'columnValues',
  SLASH_COMMANDS: process.env.NEXT_PUBLIC_COLLECTION_SLASH_COMMANDS || 'slashCommands',
  TIME_ENTRIES: process.env.NEXT_PUBLIC_COLLECTION_TIME_ENTRIES || 'timeEntries',
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in to continue.' },
        { status: 401 }
      );
    }

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

    // Get database client
    const { databases } = await createSessionClient();

    // Get user settings and configuration from database
    let settings, columns, columnValues, slashCommands;
    
    try {
      // Get user settings
      const settingsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_SETTINGS,
        [Query.equal('userId', user.$id)]
      );

      if (settingsResponse.documents.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User settings not found. Please configure your settings first.' },
          { status: 400 }
        );
      }

      const settingsDoc = settingsResponse.documents[0];
      settings = {
        id: parseInt(settingsDoc.$id, 36),
        elementDelimiter: settingsDoc.elementDelimiter,
        rowEndDelimiter: settingsDoc.rowEndDelimiter,
        globalContext: settingsDoc.globalContext,
        createdAt: settingsDoc.$createdAt,
        updatedAt: settingsDoc.$updatedAt,
      };

      // Get column definitions
      const columnsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COLUMN_DEFINITIONS,
        [
          Query.equal('userId', user.$id),
          Query.orderAsc('sortOrder')
        ]
      );

      columns = columnsResponse.documents.map(doc => ({
        id: parseInt(doc.$id, 36),
        name: doc.name,
        description: doc.description,
        format: doc.format,
        sortOrder: doc.sortOrder,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      }));

      // Get column values
      const columnValuesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COLUMN_VALUES,
        [Query.equal('userId', user.$id)]
      );

      columnValues = columnValuesResponse.documents.map(doc => ({
        id: parseInt(doc.$id, 36),
        columnId: parseInt(doc.columnDefinitionId, 36),
        value: doc.value,
        description: doc.description,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      }));

      // Get slash commands
      const slashCommandsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SLASH_COMMANDS,
        [Query.equal('userId', user.$id)]
      );

      slashCommands = slashCommandsResponse.documents.map(doc => ({
        id: parseInt(doc.$id, 36),
        command: doc.command,
        expansion: doc.expansion,
        description: doc.description,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      }));

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to load user settings' },
        { status: 500 }
      );
    }

    // Validate that we have minimum required configuration
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
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.TIME_ENTRIES,
          ID.unique(),
          {
            userId: user.$id,
            originalInput: input.trim(),
            formattedOutput: result.formattedOutput || '',
            explanation: result.explanation || '',
            entryDate: new Date().toISOString(),
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.write(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
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