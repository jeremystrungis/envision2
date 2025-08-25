
'use client';

import React from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import WorkloadHeatmap from '@/components/dashboard/workload-heatmap';
import GanttChart from '@/components/dashboard/gantt-chart';
import ResourceAllocationChart from '@/components/dashboard/resource-allocation-chart';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useWorkspace } from '@/context/workspace-context';
import { Skeleton } from '@/components/ui/skeleton';


export default function Dashboard2() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { workspaceData, loading: workspaceLoading } = useWorkspace();

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }

  const renderDashboardContent = () => {
    if (workspaceLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!workspaceData) {
        return (
            <Alert>
                <AlertTitle>No Data Loaded</AlertTitle>
                <AlertDescription>Your workspace data will appear here in real-time as you add it elsewhere in the app.</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <>
            <WorkloadHeatmap 
                users={workspaceData.members}
                tasks={workspaceData.tasks}
                teams={workspaceData.teams}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                <ResourceAllocationChart 
                    users={workspaceData.members}
                    tasks={workspaceData.tasks}
                />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Project Status</CardTitle>
                </CardHeader>
                <CardContent>
                <ProjectStatusChart projects={workspaceData.projects} />
                </CardContent>
            </Card>
            </div>
            
            <Card>
            <CardHeader>
                <CardTitle>Project Gantt Chart</CardTitle>
            </CardHeader>
            <CardContent>
                <GanttChart 
                    projects={workspaceData.projects}
                    tasks={workspaceData.tasks}
                    users={workspaceData.members}
                    isStatic={true}
                />
            </CardContent>
            </Card>
        </>
    );
  };
  

  return (
    <>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Data Dashboard (Read-Only)</CardTitle>
                <CardDescription>This dashboard provides a real-time, read-only view of your main workspace. Any data added on the Teams or Projects pages will automatically appear here.</CardDescription>
              </CardHeader>
            </Card>
            
            {renderDashboardContent()}

          </main>
        </div>
      </div>
    </>
  );
}

