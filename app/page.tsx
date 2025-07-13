import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/server/appwrite';
import HomePage from './home-client';

export default async function Home() {
  const user = await getLoggedInUser();
  console.log('User in Home:', user);
  if (!user) {
    redirect('/login?callbackUrl=%2F');
  }

  // User is authenticated, render the client component with user data
  return <HomePage user={user} />;
}