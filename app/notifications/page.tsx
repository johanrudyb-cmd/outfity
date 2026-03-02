export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Bell, CheckCircle2, Info, AlertCircle, X, Trash2 } from 'lucide-react';
import { NotificationsList } from '@/components/notifications/NotificationsList';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-modern">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground font-medium text-lg mt-1">
                GÃ©rez vos notifications et alertes
              </p>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <NotificationsList />
      </div>
    </DashboardLayout>
  );
}

