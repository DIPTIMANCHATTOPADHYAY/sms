import { getCurrentUser } from "@/app/actions";
import { UserSettingsForm } from "@/components/user-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and personal information.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        This information will be used for your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <UserSettingsForm user={user} />
                </CardContent>
            </Card>
        </div>
    )
}
