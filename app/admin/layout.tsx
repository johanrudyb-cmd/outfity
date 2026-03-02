export const dynamic = 'force-dynamic';
import { getIsAdmin } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const isAdmin = await getIsAdmin();

    if (!isAdmin) {
        redirect('/dashboard');
    }

    return (
        <AdminLayoutClient>
            <Toaster position="top-right" richColors />
            {children}
        </AdminLayoutClient>
    );
}
