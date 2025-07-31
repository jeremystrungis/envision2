
'use client';

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Project } from '@/lib/data';
import { useStore, store } from '@/lib/store';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AddProjectDialog from '@/components/projects/add-project-dialog';
import Link from 'next/link';

export default function ProjectsPage() {
  const { projects } = useStore();
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);

  const handleAddProject = (newProject: Omit<Project, 'id'>) => {
    store.addProject(newProject);
    setIsAddProjectDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>Manage your engineering projects.</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddProjectDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Project
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                            project.status === 'On Track' ? 'default' : project.status === 'At Risk' ? 'secondary' : 'destructive'
                        }
                        className={cn(
                            project.status === 'On Track' && 'bg-green-600/80',
                            project.status === 'At Risk' && 'bg-yellow-600/80',
                            project.status === 'Off Track' && 'bg-red-600/80',
                        )}
                        >
                            {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/projects/${project.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
      <AddProjectDialog
        isOpen={isAddProjectDialogOpen}
        onClose={() => setIsAddProjectDialogOpen(false)}
        onAddProject={handleAddProject}
      />
    </div>
  );
}
