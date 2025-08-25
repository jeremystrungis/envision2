
'use client';

import React, { useState, useRef } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import WorkloadHeatmap from '@/components/dashboard/workload-heatmap';
import GanttChart from '@/components/dashboard/gantt-chart';
import ResourceAllocationChart from '@/components/dashboard/resource-allocation-chart';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Team, User, Project, Task } from '@/lib/firebase-types';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: Task[];
}

export default function Dashboard2() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('File content is not valid.');
        }
        const data = JSON.parse(content);
        
        // Basic validation
        if (!data.teams || !data.members || !data.projects || !data.tasks) {
          throw new Error('Invalid JSON structure. Missing required fields.');
        }

        // Convert date strings back to Date objects
        const hydratedTasks = data.tasks.map((task: any) => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate)
        }));

        setWorkspaceData({ ...data, tasks: hydratedTasks });

        toast({
          title: 'Import Successful',
          description: 'Workspace data has been loaded into the dashboard.',
        });

      } catch (error: any) {
        console.error('Import failed:', error);
        toast({
          title: 'Import Failed',
          description: error.message || 'Could not import data from the file.',
          variant: 'destructive',
        });
      } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  if (loading || !user) {
    // This will be handled by the useAuth hook redirecting to /login
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Imported Data Dashboard</CardTitle>
                <CardDescription>Load a workspace from a JSON file to visualize its data here. This is a read-only view and will not affect your live data.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Workspace from JSON
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
              </CardContent>
            </Card>

            {!workspaceData ? (
                <Alert>
                    <AlertTitle>No Data Loaded</AlertTitle>
                    <AlertDescription>Please import a workspace JSON file to view the dashboard.</AlertDescription>
                </Alert>
            ) : (
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
            )}
          </main>
        </div>
      </div>
    </>
  );
}
