import { Client, Account, Databases, ID } from 'node-appwrite';
import { cookies } from 'next/headers';

// Session cookie name
export const SESSION_COOKIE = 'appwrite-session';

// Environment variables
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;

// Validate environment variables
if (!endpoint) {
  throw new Error('NEXT_PUBLIC_APPWRITE_ENDPOINT is required');
}
if (!projectId) {
  throw new Error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is required');
}
if (!apiKey) {
  throw new Error('APPWRITE_API_KEY is required');
}

// Create admin client for server-side operations that don't require user session
export function createAdminClient() {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}

// Create session client for user-specific operations
export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  
  if (!session) {
    throw new Error('No session found');
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}

// Get the logged-in user
export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}