
'use client';

import React, { useRef, useState, useEffect } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import WorkloadHeatmap from '@/components/dashboard/workload-heatmap';
import GanttChart from '@/components/dashboard/gantt-chart';
import ResourceAllocationChart from '@/components/dashboard/resource-allocation-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useWorkspace } from '@/context/workspace-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Upload, Download, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Team, User, Project, Task, Assignment } from '@/lib/firebase-types';
import { importPrincipals } from '@/ai/flows/import-principals-flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import EditTeams from '@/components/dashboard/edit-teams';
import EditMembers from '@/components/dashboard/edit-members';
import EditProjects from '@/components/dashboard/edit-projects';
import EditTasks from '@/components/dashboard/edit-tasks';


// Define a more specific type for the data coming from the JSON file
interface JsonTask extends Omit<Task, 'startDate' | 'endDate' | 'id'> {
    id?: string; // ID from file is optional
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
  const [selectedAllocationDate, setSelectedAllocationDate] = useState<Date>(new Date());
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

  const workspaceLoading = authLoading || contextLoading;


  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }

  const syncPrincipalsToBackend = async (data: WorkspaceJsonData) => {
    try {
        const result = await importPrincipals({
            teams: data.teams,
            members: data.members,
        });

        if (result.teamsAdded > 0 || result.membersAdded > 0) {
             toast({
                title: 'Backend Sync Successful',
                description: `Added ${result.teamsAdded} new team(s) and ${result.membersAdded} new member(s) to the main workspace.`,
            });
        } else {
             toast({
                title: 'Backend Sync Complete',
                description: 'No new teams or members needed to be added.',
            });
        }

    } catch (e) {
        const error = e as Error;
        console.error("Failed to sync principals:", error);
         toast({
            title: 'Backend Sync Failed',
            description: `Could not sync teams/members to the main database. ${error.message}`,
            variant: 'destructive',
        });
    }
  };
  
  const parseAndSetData = (jsonString: string) => {
    try {
        const data: WorkspaceJsonData = JSON.parse(jsonString);
        
        if (!data.projects || !data.tasks || !data.members) {
             throw new Error("Invalid JSON format: missing projects, tasks, or members.");
        }
        
        const memberNameToIdMap = new Map(data.members.map(m => [(m as any).name, (m as any).id]));
        const projectNameToIdMap = new Map(data.projects.map(p => [(p as any).name, (p as any).id]));
        
        const rehydratedTasks = data.tasks.map(task => {
            const projectId = projectNameToIdMap.get(task.projectId as any) || task.projectId;
            
            const assignments = task.assignments.map(a => {
                const assigneeId = memberNameToIdMap.get(a.assigneeId as any) || a.assigneeId;
                return {...a, assigneeId };
            });

            return {
                ...task,
                projectId,
                assignments,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            };
        });

        const formattedData = {
            ...data,
            tasks: rehydratedTasks
        } as any;

        setWorkspaceData(formattedData);
        toast({
            title: 'Import Successful',
            description: 'Workspace data loaded into Main Dashboard.',
        });
        
        syncPrincipalsToBackend(data);

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
    event.target.value = '';
  };
  
  const handleFileAdd = (jsonString: string) => {
      if (!workspaceData) {
          parseAndSetData(jsonString);
          return;
      }
      
      try {
        const newData: WorkspaceJsonData = JSON.parse(jsonString);
        
        if (!newData.projects || !newData.tasks || !newData.members) {
             throw new Error("Invalid JSON format: missing projects, tasks, or members.");
        }
        
        const memberNameToIdMap = new Map(newData.members.map(m => [(m as any).name, (m as any).id]));
        const projectNameToIdMap = new Map(newData.projects.map(p => [(p as any).name, (p as any).id]));

        const rehydratedNewTasks = newData.tasks.map(task => {
            const projectId = projectNameToIdMap.get(task.projectId as any) || task.projectId;
            
            const assignments = task.assignments.map(a => {
                const assigneeId = memberNameToIdMap.get(a.assigneeId as any) || a.assigneeId;
                return {...a, assigneeId };
            });

            return {
                ...task,
                projectId,
                assignments,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            };
        });

        const mergedData = {
            teams: [
                ...workspaceData.teams,
                ...newData.teams.filter(newTeam => !workspaceData.teams.some(existing => existing.name === newTeam.name))
            ],
            members: [
                ...workspaceData.members, 
                ...newData.members.filter(newMember => !workspaceData.members.some(existing => existing.name === newMember.name))
            ],
            projects: [
                ...workspaceData.projects, 
                ...newData.projects.filter(newProject => !workspaceData.projects.some(existing => existing.name === newProject.name))
            ],
            tasks: [
                ...workspaceData.tasks,
                ...rehydratedNewTasks
            ]
        } as any;

        setWorkspaceData(mergedData);
        toast({
            title: 'Data Added Successfully',
            description: 'New data has been added to the dashboard.',
        });

        syncPrincipalsToBackend(newData);

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

  const handleExport = () => {
    if (!workspaceData) {
      toast({
        title: 'No Data to Export',
        description: 'Load data before exporting.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const memberMap = new Map(workspaceData.members.map(m => [m.id, m.name]));
      const projectMap = new Map(workspaceData.projects.map(p => [p.id, p.name]));

      const exportData = {
        teams: workspaceData.teams.map(({ id, ...rest }) => ({id, ...rest})),
        members: workspaceData.members.map(({ id, ...rest }) => ({ id, ...rest })),
        projects: workspaceData.projects.map(({ id, ...rest }) => ({ id, ...rest })),
        tasks: workspaceData.tasks.map(({ id, startDate, endDate, projectId, assignments, ...rest }) => ({
          id,
          ...rest,
          projectId: projectMap.get(projectId) || projectId,
          assignments: assignments.map(a => ({
              ...a,
              assigneeId: memberMap.get(a.assigneeId) || a.assigneeId,
          })),
          startDate: (startDate instanceof Date) ? startDate.toISOString() : startDate,
          endDate: (endDate instanceof Date) ? endDate.toISOString() : endDate,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pmvision_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Your workspace data has been downloaded.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export your workspace data. See console for details.',
        variant: 'destructive',
      });
    }
  };

  const toggleSection = (section: string) => {
    setOpenCollapsible(prev => prev === section ? null : section);
  }


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
                <AlertTitle>No Data Loaded</AlertTitle>
                <AlertDescription>
                  This dashboard reflects new additions from your main workspace in real-time. 
                  You can also manually load a `pmvision_export.json` file to view a complete dataset.
                </AlertDescription>
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

            <Card>
                <CardHeader>
                    <CardTitle>Edit Workspace Data</CardTitle>
                    <CardDescription>Make temporary edits to the local data shown in this dashboard. These changes will not be saved to the database.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Collapsible open={openCollapsible === 'teams'} onOpenChange={() => toggleSection('teams')}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-start"><Edit className="mr-2 h-4 w-4" /> Teams</Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                        <Collapsible open={openCollapsible === 'members'} onOpenChange={() => toggleSection('members')}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-start"><Edit className="mr-2 h-4 w-4" /> Members</Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                        <Collapsible open={openCollapsible === 'projects'} onOpenChange={() => toggleSection('projects')}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-start"><Edit className="mr-2 h-4 w-4" /> Projects</Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                        <Collapsible open={openCollapsible === 'tasks'} onOpenChange={() => toggleSection('tasks')}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-start"><Edit className="mr-2 h-4 w-4" /> Tasks</Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </div>
                     <CollapsibleContent className="pt-4 -mx-6 px-6">
                        {openCollapsible === 'teams' && workspaceData && <EditTeams workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />}
                        {openCollapsible === 'members' && workspaceData && <EditMembers workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />}
                        {openCollapsible === 'projects' && workspaceData && <EditProjects workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />}
                        {openCollapsible === 'tasks' && workspaceData && <EditTasks workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />}
                    </CollapsibleContent>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Resource Allocation</CardTitle>
                            <CardDescription>Daily workload vs. capacity for the selected date.</CardDescription>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !selectedAllocationDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedAllocationDate ? format(selectedAllocationDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={selectedAllocationDate}
                                onSelect={(date) => setSelectedAllocationDate(date || new Date())}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </CardHeader>
                    <CardContent>
                    <ResourceAllocationChart 
                        users={workspaceData.members}
                        tasks={workspaceData.tasks}
                        selectedDay={selectedAllocationDate}
                    />
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
                <CardTitle>Hybrid Data Dashboard</CardTitle>
                <CardDescription>This dashboard provides a hybrid view. It automatically syncs new data from the live workspace and allows manual import/export of JSON files.</CardDescription>
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
                  <Button onClick={handleExport} variant="secondary">
                    <Download className="mr-2 h-4 w-4" />
                    Export to JSON
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

    