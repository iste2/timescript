import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/server/appwrite';

export async function GET() {
  try {
    const user = await getLoggedInUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    return NextResponse.json({
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        prefs: user.prefs || {},
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}