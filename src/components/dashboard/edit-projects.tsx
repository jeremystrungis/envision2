
'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Team, Project, Task } from '@/lib/firebase-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';

interface WorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: Task[];
}

interface EditProjectsProps {
    workspaceData: WorkspaceData;
    setWorkspaceData: (data: WorkspaceData) => void;
}

const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['On Track', 'At Risk', 'Off Track']),
});

const formSchema = z.object({
  projects: z.array(projectSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProjects({ workspaceData, setWorkspaceData }: EditProjectsProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projects: workspaceData.projects,
    },
  });

  useEffect(() => {
    form.reset({ projects: workspaceData.projects });
  }, [workspaceData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'projects',
  });
  
  const onSubmit = (data: FormValues) => {
    setWorkspaceData({
        ...workspaceData,
        projects: data.projects
    });
    toast({
        title: "Success",
        description: "Local project data has been updated."
    })
  };

  const handleAddNewProject = () => {
    append({
        id: uuidv4(),
        name: 'New Project',
        status: 'On Track',
    })
  }

  const handleRemoveProject = (index: number) => {
    const projectToRemove = fields[index];
    const isAssigned = workspaceData.tasks.some(task => task.projectId === projectToRemove.id);

    if (isAssigned) {
        toast({
            title: "Cannot Delete Project",
            description: `"${projectToRemove.name}" has one or more tasks assigned to it. Please remove or reassign the tasks before deleting.`,
            variant: 'destructive',
        });
        return;
    }
    remove(index);
  }

  return (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                             <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`projects.${index}.name`}
                                        render={({ field }) => (
                                            <Input {...field} />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`projects.${index}.status`}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="On Track">On Track</SelectItem>
                                                    <SelectItem value="At Risk">At Risk</SelectItem>
                                                    <SelectItem value="Off Track">Off Track</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveProject(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div className="flex justify-between items-center">
                 <Button type="button" variant="outline" size="sm" onClick={handleAddNewProject}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Project
                </Button>
                <Button type="submit">Save Project Changes</Button>
            </div>
        </form>
    </Form>
  )
}

    