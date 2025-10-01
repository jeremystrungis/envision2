
'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Team, Project, Task, Assignment } from '@/lib/firebase-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

interface WorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: Task[];
}

interface EditTasksProps {
    workspaceData: WorkspaceData;
    setWorkspaceData: (data: WorkspaceData) => void;
}

const assignmentSchema = z.object({
  assigneeId: z.string(),
  workingDays: z.array(z.number()),
  effort: z.coerce.number(),
});

const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  projectId: z.string().min(1, 'Project is required'),
  assignments: z.array(assignmentSchema),
  startDate: z.date(),
  endDate: z.date(),
  hours: z.coerce.number().min(0),
});

const formSchema = z.object({
  tasks: z.array(taskSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditTasks({ workspaceData, setWorkspaceData }: EditTasksProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tasks: workspaceData.tasks.map(t => ({
          ...t,
          startDate: t.startDate instanceof Date ? t.startDate : new Date(t.startDate),
          endDate: t.endDate instanceof Date ? t.endDate : new Date(t.endDate),
      })),
    },
  });

  useEffect(() => {
    form.reset({
      tasks: workspaceData.tasks.map(t => ({
          ...t,
          startDate: t.startDate instanceof Date ? t.startDate : new Date(t.startDate),
          endDate: t.endDate instanceof Date ? t.endDate : new Date(t.endDate),
      })),
    });
  }, [workspaceData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });
  
  const onSubmit = (data: FormValues) => {
    setWorkspaceData({
        ...workspaceData,
        tasks: data.tasks
    });
    toast({
        title: "Success",
        description: "Local task data has been updated."
    })
  };
  
  const handleRemoveTask = (index: number) => {
    remove(index);
  }

  return (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                             <TableRow key={field.id}>
                                <TableCell><FormField control={form.control} name={`tasks.${index}.name`} render={({ field }) => <Input {...field} />} /></TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.projectId`}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                {workspaceData.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.startDate`}
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.endDate`}
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                </TableCell>
                                <TableCell><FormField control={form.control} name={`tasks.${index}.hours`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTask(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end">
                <Button type="submit">Save Task Changes</Button>
            </div>
        </form>
    </Form>
  )
}

    