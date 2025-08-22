
'use client';

import { useEffect } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import WorkloadHeatmap from '@/components/dashboard/workload-heatmap';
import GanttChart from '@/components/dashboard/gantt-chart';
import ResourceAllocationChart from '@/components/dashboard/resource-allocation-chart';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6 flex flex-col gap-6">
            <WorkloadHeatmap />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourceAllocationChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectStatusChart />
                </CardContent>
              </Card>
            </div>
            
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
    </>
  );
}
