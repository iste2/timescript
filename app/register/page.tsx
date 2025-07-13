import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/server/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

interface RegisterPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  // Check if user is already logged in
  const user = await getLoggedInUser();
  const params = await searchParams;
  
  if (user) {
    const callbackUrl = (params.callbackUrl as string) || '/';
    redirect(callbackUrl);
  }

  const callbackUrl = (params.callbackUrl as string) || '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">Get started with Timescript</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create an account to start tracking your time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm callbackUrl={callbackUrl} />

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href={`/login${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}