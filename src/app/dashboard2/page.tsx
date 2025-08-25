
'use client';

import React, { useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Team, User, Project, Task, Assignment } from '@/lib/firebase-types';


// Define a more specific type for the data coming from the JSON file
interface JsonTask extends Omit<Task, 'startDate' | 'endDate'> {
    startDate: string; // ISO string
    endDate: string; // ISO string
}

interface WorkspaceJsonData {
    teams: Omit<Team, 'id'>[];
    members: Omit<User, 'id'>[];
    projects: Omit<Project, 'id'>[];
    tasks: JsonTask[];
}


export default function Dashboard2() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { workspaceData, setWorkspaceData, loading: contextLoading } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileAddRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const workspaceLoading = authLoading || contextLoading;


  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }
  
  const parseAndSetData = (jsonString: string) => {
    try {
        const data: WorkspaceJsonData = JSON.parse(jsonString);
        
        // Basic validation
        if (!data.projects || !data.tasks || !data.members) {
             throw new Error("Invalid JSON format: missing projects, tasks, or members.");
        }

        const formattedData = {
            ...data,
            // Convert date strings back to Date objects
            tasks: data.tasks.map(task => ({
                ...task,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            }))
        } as any; // Cast to any to align with context type

        setWorkspaceData(formattedData);
        toast({
            title: 'Import Successful',
            description: 'Workspace data loaded into Dashboard 2.',
        });
    } catch (e) {
        const error = e as Error;
        console.error("Failed to parse JSON:", error);
        toast({
            title: 'Import Failed',
            description: `Could not parse JSON file. ${error.message}`,
            variant: 'destructive',
        });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'add') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (mode === 'add') {
          handleFileAdd(text);
      } else {
          parseAndSetData(text);
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };
  
  const handleFileAdd = (jsonString: string) => {
      if (!workspaceData) {
          // If there's no data, an "add" is the same as a "replace"
          parseAndSetData(jsonString);
          return;
      }
      
      try {
        const newData: WorkspaceJsonData = JSON.parse(jsonString);
        
        // Basic validation
        if (!newData.projects || !newData.tasks || !newData.members) {
             throw new Error("Invalid JSON format: missing projects, tasks, or members.");
        }
        
        const mergedData = {
            // Add teams, ensuring no duplicates by name
            teams: [
                ...workspaceData.teams,
                ...newData.teams.filter(newTeam => !workspaceData.teams.some(existing => existing.name === newTeam.name))
            ],
            // Simply concatenate members, projects, and tasks
            members: [...workspaceData.members, ...newData.members],
            projects: [...workspaceData.projects, ...newData.projects],
            tasks: [
                ...workspaceData.tasks,
                ...newData.tasks.map(task => ({
                    ...task,
                    startDate: new Date(task.startDate),
                    endDate: new Date(task.endDate)
                }))
            ]
        } as any;

        setWorkspaceData(mergedData);
        toast({
            title: 'Data Added Successfully',
            description: 'New data has been added to Dashboard 2.',
        });

      } catch(e) {
        const error = e as Error;
        console.error("Failed to parse or merge JSON:", error);
        toast({
            title: 'Add Data Failed',
            description: `Could not process JSON file. ${error.message}`,
            variant: 'destructive',
        });
      }
  };


  const renderDashboardContent = () => {
    if (workspaceLoading && !workspaceData) {
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
                <AlertTitle>No Data Imported</AlertTitle>
                <AlertDescription>Use the button above to import a `pmvision_export.json` file to view the data here.</AlertDescription>
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
                <CardTitle>Imported Data Dashboard (Sandbox)</CardTitle>
                <CardDescription>This dashboard provides a sandboxed view of an imported JSON workspace file. Data here is session-only and does not affect the main database.</CardDescription>
              </CardHeader>
               <CardContent>
                <div className="flex gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={(e) => handleFileChange(e, 'replace')}
                  />
                  <input
                    type="file"
                    ref={fileAddRef}
                    className="hidden"
                    accept=".json"
                    onChange={(e) => handleFileChange(e, 'add')}
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import & Replace
                  </Button>
                   <Button onClick={() => fileAddRef.current?.click()} variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Add Data from File
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {renderDashboardContent()}

          </main>
        </div>
      </div>
    </>
  );
}
