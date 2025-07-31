
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Project, Task } from '@/lib/data';
import { useStore, store } from '@/lib/store';
import AppHeader from '@/components/app-header';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, ArrowLeft, Edit, Trash2, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EditTaskDialog from '@/components/projects/edit-task-dialog';
import EditProjectDialog from '@/components/projects/edit-project-dialog';
import AddTaskDialog from '@/components/projects/add-task-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { projects, tasks: allTasks, users } = useStore();
  
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
  const tasks = useMemo(() => allTasks.filter(t => t.projectId === projectId), [allTasks, projectId]);

  const handleUpdateProject = (updatedProject: Omit<Project, 'id'>) => {
    if (project) {
        store.updateProject(project.id, updatedProject);
    }
    setIsEditProjectOpen(false);
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'projectId' | 'dependencies'>) => {
    store.addTask({ ...newTask, projectId });
    setIsAddTaskOpen(false);
  };
  
  const handleUpdateTask = (updatedTask: Omit<Task, 'id' | 'projectId' | 'dependencies'>) => {
    if(selectedTask) {
        store.updateTask(selectedTask.id, updatedTask);
    }
    setIsEditTaskOpen(false);
    setSelectedTask(null);
  };

  const handleEditTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditTaskOpen(true);
  }

  const handleDeleteTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteTask = () => {
    if (selectedTask) {
      store.deleteTask(selectedTask.id);
    }
    setIsDeleteAlertOpen(false);
    setSelectedTask(null);
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
                        <Button onClick={() => setIsAddTaskOpen(true)}>
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
                                    <DropdownMenuItem onClick={() => handleEditTaskClick(task)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditTaskClick(task)}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Reassign
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeleteTaskClick(task)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Task
                                    </DropdownMenuItem>
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
      <AddTaskDialog
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />
      {selectedTask && (
        <EditTaskDialog
            isOpen={isEditTaskOpen}
            onClose={() => {
                setIsEditTaskOpen(false);
                setSelectedTask(null);
            }}
            onUpdateTask={handleUpdateTask}
            task={selectedTask}
        />
      )}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task
                &quot;{selectedTask?.name}&quot;.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTask(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}
