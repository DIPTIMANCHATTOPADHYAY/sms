'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Separator } from './ui/separator';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.2v2.6h5.3c-.2 1.3-1.2 3.2-5.3 3.2-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.8 0 3 .8 3.7 1.5l2.1-2.1C18.2 2.7 15.6 2 12.15 2c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.6-4 9.6-9.8 0-.8-.1-1.1-.4-1.1z"/></svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#1877F2" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.99 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.24 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.99 22 12z"/></svg>
);


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    const authProvider = provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
    try {
        const result = await signInWithPopup(auth, authProvider);
        const user = result.user;

        // Create user document in Firestore if it doesn't exist
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                status: 'active',
                isAdmin: false, // Default to not admin
            });
        }

        toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });
        router.push('/dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">OR CONTINUE WITH</span>
      </div>
       <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                <GoogleIcon />
                <span className="ml-2">Google</span>
            </Button>
            <Button variant="outline" onClick={() => handleSocialLogin('facebook')} disabled={isLoading}>
                <FacebookIcon />
                <span className="ml-2">Facebook</span>
            </Button>
        </div>
    </>
  );
}
