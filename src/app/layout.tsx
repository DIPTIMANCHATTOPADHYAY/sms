import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMS Inspector',
  description: 'Inspect and analyze SMS data with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('YOUR_');
  
  if (!isFirebaseConfigured) {
    return (
      <html lang="en">
        <body className="antialiased">
            <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-2xl p-8 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-4">Firebase Not Configured</h1>
                    <p className="text-muted-foreground mb-2">
                    Your application is missing Firebase credentials.
                    </p>
                    <p className="text-muted-foreground mb-6">
                    Please create a Firebase project, enable authentication, and add the web app configuration to your <strong>.env</strong> file.
                    </p>
                </div>
                <div className="text-left bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap"><code>
{`PREMIUMY_API_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...`}
                    </code></pre>
                </div>
                    <p className="text-center text-sm text-muted-foreground mt-6">
                    You can find these values in the Project Settings of your Firebase console.
                    </p>
                </div>
            </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
