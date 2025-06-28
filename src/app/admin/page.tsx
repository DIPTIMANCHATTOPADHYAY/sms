'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        setIsLoading(true);
        // In a real application, this would save to a secure backend or environment manager.
        setTimeout(() => {
            console.log("Saving API Key:", apiKey);
            toast({
                title: 'Settings Saved',
                description: 'API Key has been updated (simulation).',
            });
            setIsLoading(false);
        }, 1500)
    };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage your application settings here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Premiumy API Key</Label>
            <Input 
                id="api-key" 
                type="password"
                placeholder="Enter your API key" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              For this prototype, saving is simulated. In a production environment, this key should be stored securely as an environment variable (`PREMIUMY_API_KEY`) on the server.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
            <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
            </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
