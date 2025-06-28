import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions';
import { AdminDashboard } from '@/components/admin-dashboard';

export default async function AdminPage() {
    const user = await getCurrentUser();

    // 1. Must be a logged-in user and have the admin role
    if (!user?.isAdmin) {
        redirect('/dashboard');
    }

    // 2. Must have passed the secondary admin login
    const hasAdminSession = cookies().has('admin_session');
    if (!hasAdminSession) {
        redirect('/admin/login');
    }

    return <AdminDashboard />;
}
