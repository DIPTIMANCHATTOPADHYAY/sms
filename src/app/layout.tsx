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
