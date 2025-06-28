import { SignupForm } from '@/components/signup-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { getSignupStatus } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function SignupPage() {
  const { signupEnabled } = await getSignupStatus();

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {signupEnabled ? "Enter your information to create an account" : "Registration Status"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupEnabled ? (
            <>
              <SignupForm />
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <ShieldX className="h-4 w-4" />
                <AlertTitle>Registration Disabled</AlertTitle>
                <AlertDescription>
                  We are not accepting new signups at this time. Please check back later or contact an administrator.
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <Link href="/login">
                  <Button variant="outline">Login Instead</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
