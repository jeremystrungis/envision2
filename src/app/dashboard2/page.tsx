
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
import { Button } from '@/components/ui/button';
import { Upload, PlusCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/context/workspace-context';
import type { Team, User, Project, Task } from '@/lib/firebase-types';

interface RawWorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: any[];
}


export default function Dashboard2() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { workspaceData, setWorkspaceData } = useWorkspace();

  const handleImportReplaceClick = () => {
    replaceFileInputRef.current?.click();
  };

  const handleAddDataClick = () => {
    addFileInputRef.current?.click();
  };

  const processFile = (file: File, mode: 'replace' | 'add') => {
     if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('File content is not valid.');
        }
        const newData: RawWorkspaceData = JSON.parse(content);
        
        if (!newData.teams || !newData.members || !newData.projects || !newData.tasks) {
          throw new Error('Invalid JSON structure. Missing required fields.');
        }
        
        const hydratedNewData = {
            ...newData,
            tasks: newData.tasks.map((task: any) => ({
                ...task,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            }))
        };

        if (mode === 'add' && workspaceData) {
            // Merge logic
            const mergedData = {
                teams: [...workspaceData.teams],
                members: [...workspaceData.members, ...hydratedNewData.members],
                projects: [...workspaceData.projects, ...hydratedNewData.projects],
                tasks: [...workspaceData.tasks, ...hydratedNewData.tasks],
            };
            
            // Add new teams, avoiding duplicates by name
            hydratedNewData.teams.forEach(newTeam => {
                if (!mergedData.teams.some(existingTeam => existingTeam.name === newTeam.name)) {
                    mergedData.teams.push(newTeam);
                }
            });

            setWorkspaceData(mergedData);
            toast({
              title: 'Data Added',
              description: 'New workspace data has been added to the dashboard.',
            });

        } else {
            // Replace logic
            setWorkspaceData(hydratedNewData);
            toast({
              title: 'Import Successful',
              description: 'Workspace data has been loaded into the dashboard.',
            });
        }

      } catch (error: any) {
        console.error('Import failed:', error);
        toast({
          title: 'Import Failed',
          description: error.message || 'Could not import data from the file.',
          variant: 'destructive',
        });
      } finally {
        if(replaceFileInputRef.current) {
            replaceFileInputRef.current.value = '';
        }
        if(addFileInputRef.current) {
            addFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  }

  const handleReplaceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file, 'replace');
  };
  
  const handleAddFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file, 'add');
  };


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
            <Card>
              <CardHeader>
                <CardTitle>Imported Data Dashboard</CardTitle>
                <CardDescription>Load a workspace from a JSON file to visualize its data here. This is a read-only view and will not affect your live data.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={handleImportReplaceClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import & Replace
                </Button>
                <Button onClick={handleAddDataClick} variant="outline" disabled={!workspaceData}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Data from File
                </Button>
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  onChange={handleReplaceFileChange}
                  accept=".json"
                  className="hidden"
                />
                 <input
                  type="file"
                  ref={addFileInputRef}
                  onChange={handleAddFileChange}
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
