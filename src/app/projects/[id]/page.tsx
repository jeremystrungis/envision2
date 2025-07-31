
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { projects as initialProjects, tasks as initialTasks, users, Project, Task } from '@/lib/data';
import AppHeader from '@/components/app-header';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, ArrowLeft, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EditTaskDialog from '@/components/projects/edit-task-dialog';
import EditProjectDialog from '@/components/projects/edit-project-dialog';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const foundProject = initialProjects.find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      const projectTasks = initialTasks.filter(t => t.projectId === projectId);
      setTasks(projectTasks);
    }
  }, [projectId]);

  const handleUpdateProject = (updatedProject: Omit<Project, 'id'>) => {
    if (project) {
        setProject({ ...project, ...updatedProject });
        // In a real app, you'd also update the main projects list
    }
    setIsEditProjectOpen(false);
  };
  
  const handleUpdateTask = (updatedTask: Omit<Task, 'id' | 'projectId' | 'dependencies'>) => {
    if(selectedTask) {
        setTasks(currentTasks => currentTasks.map(t => t.id === selectedTask.id ? {...t, ...updatedTask} : t))
    }
    setIsEditTaskOpen(false);
    setSelectedTask(null);
  };

  const handleEditTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditTaskOpen(true);
  }

  if (!project) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <AppSidebar />
            <div className="flex flex-1 flex-col items-center justify-center">
                <p>Project not found.</p>
                <Button onClick={() => router.push('/projects')} className="mt-4">Back to Projects</Button>
            </div>
      </div>
    );
  }

  const getAssignee = (assigneeId: string | null) => users.find(u => u.id === assigneeId);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6">
            <div className="mb-4">
                 <Button variant="outline" onClick={() => router.push('/projects')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Projects
                </Button>
            </div>
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <span>{project.name}</span> 
                           <Badge variant={project.status === 'On Track' ? 'default' : project.status === 'At Risk' ? 'secondary' : 'destructive'}
                                className={cn(
                                    project.status === 'On Track' && 'bg-green-600/80',
                                    project.status === 'At Risk' && 'bg-yellow-600/80',
                                    project.status === 'Off Track' && 'bg-red-600/80',
                                )}>
                                {project.status}
                            </Badge>
                        </CardTitle>
                        <CardDescription>Tasks and details for this project.</CardDescription>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditProjectOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Project
                        </Button>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Task
                        </Button>
                     </div>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const assignee = getAssignee(task.assigneeId);
                    return (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.name}</TableCell>
                            <TableCell>
                                {assignee ? (
                                     <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignee.avatar} />
                                            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{assignee.name}</span>
                                    </div>
                                ) : 'Unassigned'}
                            </TableCell>
                            <TableCell>{format(task.startDate, 'MMM d, yyyy')}</TableCell>
                            <TableCell>{format(task.endDate, 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditTaskClick(task)}>Edit Task</DropdownMenuItem>
                                    <DropdownMenuItem>Reassign</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">Delete Task</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
      {project && (
        <EditProjectDialog
            isOpen={isEditProjectOpen}
            onClose={() => setIsEditProjectOpen(false)}
            onUpdateProject={handleUpdateProject}
            project={project}
        />
      )}
      {selectedTask && (
        <EditTaskDialog
            isOpen={isEditTaskOpen}
            onClose={() => setIsEditTaskOpen(false)}
            onUpdateTask={handleUpdateTask}
            task={selectedTask}
        />
      )}
    </div>
  );
}
