import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/server/appwrite';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
  const user = await getLoggedInUser();
  
  if (!user) {
    redirect('/login?callbackUrl=%2Fsettings');
  }

  // User is authenticated, render the client component with user data
  return <SettingsClient user={user} />;
}