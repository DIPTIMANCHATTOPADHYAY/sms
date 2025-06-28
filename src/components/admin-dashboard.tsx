'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, ShieldBan, ShieldCheck, LogOut } from 'lucide-react';
import { getAdminSettings, updateAdminSettings, getAllUsers, toggleUserStatus, adminLogout } from '@/app/actions';
import type { UserProfile, ProxySettings } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';


function UserManagementTab() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        const result = await getAllUsers();
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: result.error });
        } else {
            setUsers(result.users || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (user: UserProfile) => {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        const result = await toggleUserStatus(user.id, newStatus);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Update failed', description: result.error });
        } else {
            toast({ title: 'User status updated successfully!' });
            fetchUsers();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.photoURL || ''} alt={user.name || 'User'}/>
                                            <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name || 'N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)}>
                                        {user.status === 'active' ? <ShieldBan className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-green-600" />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
    );
}

function SettingsTab() {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [proxySettings, setProxySettings] = useState<ProxySettings>({ ip: '', port: '', username: '', password: '' });
    const [signupEnabled, setSignupEnabled] = useState(true);
    const [siteName, setSiteName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('');
    const [emailChangeEnabled, setEmailChangeEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);
            const result = await getAdminSettings();
            if (result.error) {
                 toast({ variant: 'destructive', title: 'Error fetching settings', description: result.error });
            } else {
                setApiKey(result.apiKey || '');
                setProxySettings(result.proxySettings || { ip: '', port: '', username: '', password: '' });
                setSignupEnabled(result.signupEnabled);
                setSiteName(result.siteName || '');
                setPrimaryColor(result.primaryColor || '');
                setEmailChangeEnabled(result.emailChangeEnabled);
            }
            setIsLoading(false);
        }
        loadSettings();
    }, [toast]);

    const handleSave = async () => {
        setIsLoading(true);
        const result = await updateAdminSettings({ 
            apiKey, 
            proxySettings, 
            signupEnabled,
            siteName,
            primaryColor,
            emailChangeEnabled,
        });
        if (result.error) {
            toast({ variant: 'destructive', title: 'Failed to save settings', description: result.error });
        } else {
            toast({ title: 'Settings Saved', description: 'Your changes have been saved successfully.' });
            // Optionally, refresh the page to see color/name changes immediately
            window.location.reload();
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Appearance & Branding</CardTitle>
                    <CardDescription>Customize the look and feel of your application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="site-name">Site Name</Label>
                        <Input
                            id="site-name"
                            placeholder="Your App Name"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color (HSL)</Label>
                        <Input
                            id="primary-color"
                            placeholder="e.g., 217.2 91.2% 59.8%"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            disabled={isLoading}
                        />
                        <p className="text-sm text-muted-foreground">
                            Set the primary theme color using HSL format (e.g., `217.2 91.2% 59.8%`).
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>User & Access Policies</CardTitle>
                    <CardDescription>Manage how users sign up and what they can change.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="signup-enabled" className="cursor-pointer">Allow User Signups</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable or disable new user registration.
                            </p>
                        </div>
                        <Switch
                            id="signup-enabled"
                            checked={signupEnabled}
                            onCheckedChange={setSignupEnabled}
                            disabled={isLoading}
                            aria-label="Toggle user signups"
                        />
                    </div>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-change-enabled" className="cursor-pointer">Allow Users to Change Email</Label>
                            <p className="text-sm text-muted-foreground">
                               If disabled, users cannot update their email address from settings.
                            </p>
                        </div>
                        <Switch
                            id="email-change-enabled"
                            checked={emailChangeEnabled}
                            onCheckedChange={setEmailChangeEnabled}
                            disabled={isLoading}
                            aria-label="Toggle email change ability"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>API & Proxy Settings</CardTitle>
                    <CardDescription>Configure outbound requests. The proxy connection will be tested on save.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="api-key">Premiumy API Key</Label>
                        <Input
                            id="api-key"
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="proxy-ip">Proxy IP Address</Label>
                            <Input
                                id="proxy-ip"
                                placeholder="e.g., 40.81.241.64"
                                value={proxySettings.ip || ''}
                                onChange={(e) => setProxySettings(prev => ({ ...prev, ip: e.target.value }))}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proxy-port">Proxy Port</Label>
                            <Input
                                id="proxy-port"
                                placeholder="e.g., 3128"
                                value={proxySettings.port || ''}
                                onChange={(e) => setProxySettings(prev => ({ ...prev, port: e.target.value }))}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="proxy-username">Proxy Username (Optional)</Label>
                            <Input
                                id="proxy-username"
                                placeholder="Username"
                                value={proxySettings.username || ''}
                                onChange={(e) => setProxySettings(prev => ({ ...prev, username: e.target.value }))}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proxy-password">Proxy Password (Optional)</Label>
                            <Input
                                id="proxy-password"
                                type="password"
                                placeholder="Password"
                                value={proxySettings.password || ''}
                                onChange={(e) => setProxySettings(prev => ({ ...prev, password: e.target.value }))}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading} size="lg">
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save All Settings
                </Button>
            </div>
        </div>
    );
}


export function AdminDashboard() {
    return (
        <main className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Welcome to the control center.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <form action={adminLogout}>
                            <Button variant="outline" type="submit">
                                <LogOut className="mr-2 h-4 w-4" />
                                Admin Logout
                            </Button>
                        </form>
                        <Link href="/dashboard">
                            <Button variant="outline">Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users" className="mt-4">
                        <UserManagementTab />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-4">
                        <SettingsTab />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
