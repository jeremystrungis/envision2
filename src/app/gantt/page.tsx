
'use client';

import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import GanttChart from '@/components/dashboard/gantt-chart';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function GanttPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-6 flex flex-col gap-6">
           <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>A real-time overview of the status of all active projects.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectStatusChart />
              </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle>Project Gantt Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
