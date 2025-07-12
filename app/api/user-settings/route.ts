import { NextResponse } from 'next/server';
import { getLoggedInUser, createSessionClient } from '@/lib/server/appwrite';
import { Query } from 'node-appwrite';
import { initializeUserSettings } from '@/lib/server/user-onboarding';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';
const COLLECTIONS = {
  USER_SETTINGS: process.env.NEXT_PUBLIC_COLLECTION_USER_SETTINGS || 'userSettings',
  COLUMN_DEFINITIONS: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_DEFINITIONS || 'columnDefinitions',
  COLUMN_VALUES: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_VALUES || 'columnValues',
  SLASH_COMMANDS: process.env.NEXT_PUBLIC_COLLECTION_SLASH_COMMANDS || 'slashCommands',
};

export async function GET() {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { databases } = await createSessionClient();
    
    // Try to get user settings
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      [Query.equal('userId', user.$id)]
    );

    if (response.documents.length === 0) {
      // Settings don't exist, create them
      console.log('User settings not found, initializing...');
      try {
        await initializeUserSettings(user.$id);
        
        // Fetch the newly created settings
        const newResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USER_SETTINGS,
          [Query.equal('userId', user.$id)]
        );
        
        if (newResponse.documents.length > 0) {
          const settings = newResponse.documents[0];
          return NextResponse.json({
            id: settings.$id,
            elementDelimiter: settings.elementDelimiter,
            rowEndDelimiter: settings.rowEndDelimiter,
            globalContext: settings.globalContext,
            createdAt: settings.$createdAt,
            updatedAt: settings.$updatedAt,
          });
        }
      } catch (initError) {
        console.error('Failed to initialize user settings:', initError);
        return NextResponse.json({ error: 'Failed to initialize user settings' }, { status: 500 });
      }
    }

    const settings = response.documents[0];
    return NextResponse.json({
      id: settings.$id,
      elementDelimiter: settings.elementDelimiter,
      rowEndDelimiter: settings.rowEndDelimiter,
      globalContext: settings.globalContext,
      createdAt: settings.$createdAt,
      updatedAt: settings.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to get user settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { elementDelimiter, rowEndDelimiter, globalContext } = body;

    const { databases } = await createSessionClient();
    
    // Get the user's settings document
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      [Query.equal('userId', user.$id)]
    );

    if (response.documents.length === 0) {
      return NextResponse.json({ error: 'User settings not found' }, { status: 404 });
    }

    const settingsId = response.documents[0].$id;
    
    // Update the settings
    const updatedSettings = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_SETTINGS,
      settingsId,
      {
        elementDelimiter,
        rowEndDelimiter,
        globalContext,
      }
    );

    return NextResponse.json({
      id: updatedSettings.$id,
      elementDelimiter: updatedSettings.elementDelimiter,
      rowEndDelimiter: updatedSettings.rowEndDelimiter,
      globalContext: updatedSettings.globalContext,
      createdAt: updatedSettings.$createdAt,
      updatedAt: updatedSettings.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user settings' }, { status: 500 });
  }
}