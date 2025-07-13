import { NextResponse } from 'next/server';
import { getLoggedInUser, createSessionClient } from '@/lib/server/appwrite';
import { Query, ID, Permission, Role } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';
const COLLECTIONS = {
  COLUMN_VALUES: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_VALUES || 'columnValues',
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
      COLLECTIONS.COLUMN_VALUES,
      [Query.equal('userId', user.$id)]
    );

    const values = response.documents.map(doc => ({
      $id: doc.$id,
      columnDefinitionId: doc.columnDefinitionId,
      value: doc.value,
      description: doc.description,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }));

    return NextResponse.json({ values });
  } catch (error: any) {
    console.error('Error getting column values:', error);
    return NextResponse.json({ error: error.message || 'Failed to get column values' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { columnDefinitionId, value, description } = body;

    if (!columnDefinitionId || !value || !description) {
      return NextResponse.json({ error: 'Column definition ID, value, and description are required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    const newValue = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      ID.unique(),
      {
        userId: user.$id,
        columnDefinitionId,
        value,
        description,
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id))
      ]
    );

    return NextResponse.json({
      $id: newValue.$id,
      columnDefinitionId: newValue.columnDefinitionId,
      value: newValue.value,
      description: newValue.description,
      createdAt: newValue.$createdAt,
      updatedAt: newValue.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error creating column value:', error);
    return NextResponse.json({ error: error.message || 'Failed to create column value' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, columnDefinitionId, value, description } = body;

    if (!id || !columnDefinitionId || !value || !description) {
      return NextResponse.json({ error: 'ID, column definition ID, value, and description are required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    // Verify the value belongs to the user before updating
    const columnValue = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      id
    );

    if (columnValue.userId !== user.$id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedValue = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      id,
      {
        columnDefinitionId,
        value,
        description,
      }
    );

    return NextResponse.json({
      $id: updatedValue.$id,
      columnDefinitionId: updatedValue.columnDefinitionId,
      value: updatedValue.value,
      description: updatedValue.description,
      createdAt: updatedValue.$createdAt,
      updatedAt: updatedValue.$updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating column value:', error);
    return NextResponse.json({ error: error.message || 'Failed to update column value' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const valueId = url.searchParams.get('id');

    if (!valueId) {
      return NextResponse.json({ error: 'Value ID is required' }, { status: 400 });
    }

    const { databases } = await createSessionClient();
    
    // Verify the value belongs to the user before deleting
    const columnValue = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      valueId
    );

    if (columnValue.userId !== user.$id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.COLUMN_VALUES,
      valueId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting column value:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete column value' }, { status: 500 });
  }
}