import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/server/appwrite';
import { handleSignUp } from '@/lib/server/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

interface RegisterPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  // Check if user is already logged in
  const user = await getLoggedInUser();
  const params = await searchParams;
  
  if (user) {
    const callbackUrl = (params.callbackUrl as string) || '/dashboard';
    redirect(callbackUrl);
  }

  const callbackUrl = (params.callbackUrl as string) || '/dashboard';

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
            <form action={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min. 8 characters)"
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href={`/login${callbackUrl !== '/dashboard' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
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