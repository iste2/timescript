"use server";

import { ID } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, SESSION_COOKIE } from "./appwrite";
import { initializeUserSettings } from "./user-onboarding";

// Sign up with email and password
export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required");
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
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Initialize user settings in background (don't block on errors)
    try {
      await initializeUserSettings(user.$id);
    } catch (error) {
      console.error("Failed to initialize user settings:", error);
      // Don't throw - user is still successfully registered
    }

    return { success: true, user };
  } catch (error: any) {
    throw new Error(error.message || "Registration failed");
  }
}

// Sign in with email and password
export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    const { account } = createAdminClient();

    // Create session
    const session = await account.createEmailPasswordSession(email, password);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
}

// Sign out
export async function signOut() {
  try {
    const { account } = createAdminClient();

    // Get session from cookie to delete it from Appwrite
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);

    if (sessionCookie) {
      // Try to delete the session from Appwrite
      try {
        // Create a temporary client with the session to delete it
        const { Client, Account } = await import("node-appwrite");
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
          .setSession(sessionCookie.value);

        const sessionAccount = new Account(client);
        await sessionAccount.deleteSession("current");
      } catch (error) {
        // Ignore errors when deleting session from Appwrite
        console.error("Failed to delete session from Appwrite:", error);
      }
    }

    // Delete session cookie
    cookieStore.delete(SESSION_COOKIE);
  } catch (error) {
    // Always delete the cookie even if Appwrite deletion fails
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }

  redirect("/login");
}

// Server action to handle form submissions with redirects
export async function handleSignUp(formData: FormData) {
  try {
    await signUpWithEmail(formData);
    const callbackUrl = (formData.get("callbackUrl") as string) || "/";
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
    const callbackUrl = (formData.get("callbackUrl") as string) || "/";
    redirect(callbackUrl);
  } catch (error: any) {
    throw error;
  }
}
