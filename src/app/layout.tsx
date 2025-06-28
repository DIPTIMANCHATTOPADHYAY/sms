import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/auth-context';
import './globals.css';
import { getPublicSettings } from './actions';
import { SettingsProvider } from '@/contexts/settings-provider';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  return {
    title: settings.siteName,
    description: `Inspect and analyze SMS data with AI on ${settings.siteName}`,
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteName, primaryColor } = await getPublicSettings();
  
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        {primaryColor && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root { --primary: ${primaryColor}; }`,
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <SettingsProvider value={{ siteName, primaryColor }}>
            <AuthProvider>
            {children}
            </AuthProvider>
        </SettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
