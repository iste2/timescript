import { NextResponse } from 'next/server';
import { getLoggedInUser, createSessionClient } from '@/lib/server/appwrite';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';
const COLLECTIONS = {
  SLASH_COMMANDS: process.env.NEXT_PUBLIC_COLLECTION_SLASH_COMMANDS || 'slashCommands',
};

export async function GET() {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { databases } = await createSessionClient();
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      [Query.equal('userId', user.$id)]
    );

    const commands = response.documents.map(doc => ({
      $id: doc.$id,
      command: doc.command,
      expansion: doc.expansion,
      description: doc.description,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    return NextResponse.json({ commands });
  } catch (error: any) {
    console.error('Error getting slash commands:', error);
    return NextResponse.json({ error: error.message || 'Failed to get slash commands' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { command, expansion, description } = body;

    if (!command || !expansion || !description) {
      return NextResponse.json({ error: 'Command, expansion, and description are required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    const newCommand = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      ID.unique(),
      {
        userId: user.$id,
        command,
        expansion,
        description,
      }
    );

    return NextResponse.json({
      $id: newCommand.$id,
      command: newCommand.command,
      expansion: newCommand.expansion,
      description: newCommand.description,
      createdAt: newCommand.$createdAt,
      updatedAt: newCommand.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error creating slash command:', error);
    return NextResponse.json({ error: error.message || 'Failed to create slash command' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commandId = url.searchParams.get('id');

    if (!commandId) {
      return NextResponse.json({ error: 'Command ID is required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    // Verify the command belongs to the user before deleting
    const command = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      commandId
    );

    if (command.userId !== user.$id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.SLASH_COMMANDS,
      commandId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting slash command:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete slash command' }, { status: 500 });
  }
}