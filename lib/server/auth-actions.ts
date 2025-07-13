'use server';

import { ID, Query } from 'node-appwrite';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient, createSessionClient, SESSION_COOKIE } from './appwrite';
import { initializeUserSettings } from './user-onboarding';

// Sign up with email and password
export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }

  try {
    const { account } = createAdminClient();
    
    // Create user account
    const user = await account.create(ID.unique(), email, password, name);
    
    // Create session for the new user
    const session = await account.createEmailPasswordSession(email, password);
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Initialize user settings in background (don't block on errors)
    try {
      await initializeUserSettings(user.$id);
    } catch (error) {
      console.error('Failed to initialize user settings:', error);
      // Don't throw - user is still successfully registered
    }

    return { success: true, user };
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
}

// Sign in with email and password
export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const { account } = createAdminClient();
    
    // Create session
    const session = await account.createEmailPasswordSession(email, password);
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
}

// Sign out
export async function signOut() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    
    if (sessionCookie) {
      // Try to delete the session from Appwrite
      try {
        const { Client, Account } = await import('node-appwrite');
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
          .setSession(sessionCookie.value);
        
        const sessionAccount = new Account(client);
        await sessionAccount.deleteSession('current');
      } catch (error) {
        // Ignore errors when deleting session from Appwrite
        console.error('Failed to delete session from Appwrite:', error);
      }
    }
    
    // Delete session cookie
    cookieStore.delete(SESSION_COOKIE);
    
  } catch (error) {
    // Always try to delete the cookie even if Appwrite deletion fails
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE);
    } catch {}
  }
  
  redirect('/login');
}

// Server action to handle form submissions with redirects
export async function handleSignUp(formData: FormData) {
  try {
    await signUpWithEmail(formData);
    const callbackUrl = (formData.get('callbackUrl') as string) || '/';
    redirect(callbackUrl);
  } catch (error: any) {
    // For form submission errors, we need to handle them differently
    // In a real app, you might want to use a state management solution
    throw error;
  }
}

export async function handleSignIn(formData: FormData) {
  try {
    await signInWithEmail(formData);
    const callbackUrl = (formData.get('callbackUrl') as string) || '/';
    redirect(callbackUrl);
  } catch (error: any) {
    throw error;
  }
}

// Delete user account and all associated data
export async function deleteAccount(confirmationEmail: string) {
  try {
    // Get current user
    const { account } = await createSessionClient();
    const user = await account.get();
    
    // Verify email confirmation
    if (user.email !== confirmationEmail) {
      throw new Error('Email confirmation does not match your account email');
    }

    // Use admin client to delete all user data
    const { databases, account: adminAccount } = createAdminClient();
    
    const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'main';
    const COLLECTIONS = {
      USER_SETTINGS: process.env.NEXT_PUBLIC_COLLECTION_USER_SETTINGS || 'userSettings',
      COLUMN_DEFINITIONS: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_DEFINITIONS || 'columnDefinitions',
      COLUMN_VALUES: process.env.NEXT_PUBLIC_COLLECTION_COLUMN_VALUES || 'columnValues',
      SLASH_COMMANDS: process.env.NEXT_PUBLIC_COLLECTION_SLASH_COMMANDS || 'slashCommands',
      TIME_ENTRIES: process.env.NEXT_PUBLIC_COLLECTION_TIME_ENTRIES || 'timeEntries',
    };

    // Delete all user data from collections
    const collections = [
      COLLECTIONS.USER_SETTINGS,
      COLLECTIONS.COLUMN_DEFINITIONS,
      COLLECTIONS.COLUMN_VALUES,
      COLLECTIONS.SLASH_COMMANDS,
      COLLECTIONS.TIME_ENTRIES
    ];

    for (const collectionId of collections) {
      try {
        // Get all documents for this user
        const response = await databases.listDocuments(
          DATABASE_ID,
          collectionId,
          [Query.equal('userId', user.$id)]
        );

        // Delete each document
        for (const doc of response.documents) {
          await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
        }
      } catch (error) {
        console.error(`Failed to delete data from collection ${collectionId}:`, error);
        // Continue with other collections even if one fails
      }
    }

    // Delete the user account itself using the Admin API
    // Note: In Appwrite, admin can delete user accounts using the Users service
    const { Client, Users } = await import('node-appwrite');
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
    
    const users = new Users(adminClient);
    await users.delete(user.$id);

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete account');
  }
  
  redirect('/login');
}