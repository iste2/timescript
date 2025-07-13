import { NextResponse } from 'next/server';
import { getLoggedInUser, createSessionClient } from '@/lib/server/appwrite';
import { Query, ID, Permission, Role } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';
const COLLECTIONS = {
  COLUMN_DEFINITIONS: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_DEFINITIONS || 'columnDefinitions',
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
      COLLECTIONS.COLUMN_DEFINITIONS,
      [
        Query.equal('userId', user.$id),
        Query.orderAsc('sortOrder')
      ]
    );

    const definitions = response.documents.map(doc => ({
      $id: doc.$id,
      name: doc.name,
      description: doc.description,
      format: doc.format,
      sortOrder: doc.sortOrder,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    return NextResponse.json({ definitions });
  } catch (error: any) {
    console.error('Error getting column definitions:', error);
    return NextResponse.json({ error: error.message || 'Failed to get column definitions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, format, sortOrder } = body;

    if (!name || !description || !format || sortOrder === undefined) {
      return NextResponse.json({ error: 'Name, description, format, and sortOrder are required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    const newDefinition = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      ID.unique(),
      {
        userId: user.$id,
        name,
        description,
        format,
        sortOrder,
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id))
      ]
    );

    return NextResponse.json({
      $id: newDefinition.$id,
      name: newDefinition.name,
      description: newDefinition.description,
      format: newDefinition.format,
      sortOrder: newDefinition.sortOrder,
      createdAt: newDefinition.$createdAt,
      updatedAt: newDefinition.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error creating column definition:', error);
    return NextResponse.json({ error: error.message || 'Failed to create column definition' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, format, sortOrder } = body;

    if (!id || !name || !description || !format || sortOrder === undefined) {
      return NextResponse.json({ error: 'ID, name, description, format, and sortOrder are required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    // Verify the definition belongs to the user before updating
    const definition = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      id
    );

    if (definition.userId !== user.$id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedDefinition = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      id,
      {
        name,
        description,
        format,
        sortOrder,
      }
    );

    return NextResponse.json({
      $id: updatedDefinition.$id,
      name: updatedDefinition.name,
      description: updatedDefinition.description,
      format: updatedDefinition.format,
      sortOrder: updatedDefinition.sortOrder,
      createdAt: updatedDefinition.$createdAt,
      updatedAt: updatedDefinition.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating column definition:', error);
    return NextResponse.json({ error: error.message || 'Failed to update column definition' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const definitionId = url.searchParams.get('id');

    if (!definitionId) {
      return NextResponse.json({ error: 'Definition ID is required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    // Verify the definition belongs to the user before deleting
    const definition = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      definitionId
    );

    if (definition.userId !== user.$id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_DEFINITIONS,
      definitionId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting column definition:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete column definition' }, { status: 500 });
  }
}