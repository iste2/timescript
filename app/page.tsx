import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/server/appwrite';
import HomePage from './home-client';

export default async function Home() {
  const user = await getLoggedInUser();
  
  if (!user) {
    redirect('/login');
  }

  // User is authenticated, render the client component
  return <HomePage />;
}