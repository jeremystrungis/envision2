
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Project, Task, Assignment, User } from '@/lib/firebase-types';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import React, { useState, useEffect, useMemo } from 'react';
import { Slider } from '../ui/slider';
import { useUsers } from '@/hooks/use-users';
import { Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useWorkspace } from '@/context/workspace-context';

const assignmentSchema = z.object({
    assigneeId: z.string(),
    workingDays: z.array(z.number()).min(1, "Must select at least one working day"),
    effort: z.number().min(0).max(100),
});

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  assignments: z.array(assignmentSchema).min(1, 'At least one assignee is required'),
  startDate: z.date(),
  endDate: z.date(),
  hours: z.coerce.number().min(0, "Hours must be positive"),
}).refine(data => !data.name || data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine(data => {
    if (!data.name || data.assignments.length === 0) return true;
    const totalEffort = data.assignments.reduce((sum, a) => sum + a.effort, 0);
    return Math.abs(totalEffort - 100) < 0.01;
}, {
    message: "Total effort must sum to 100%",
    path: ["assignments"],
});


const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  status: z.enum(['On Track', 'At Risk', 'Off Track']),
  tasks: z.array(taskSchema),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Omit<Project, 'id'>, tasks: Omit<Task, 'id' | 'projectId' | 'dependencies'>[]) => void;
}

const defaultTaskValues = {
  name: '',
  assignments: [],
  startDate: new Date(),
  endDate: new Date(),
  hours: 8,
};

const weekDays = [
    { id: 1, label: 'M' }, { id: 2, label: 'T' }, { id: 3, label: 'W' },
    { id: 4, label: 'T' }, { id: 5, label: 'F' }, { id: 6, label: 'S' }, { id: 0, label: 'S' }
];

function AssigneePopover({ taskIndex, form }: { taskIndex: number, form: any }) {
    const { users: liveUsers } = useUsers();
    const { workspaceData } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    
    const currentAssignments = form.watch(`tasks.${taskIndex}.assignments`) || [];
    const [selectedUsers, setSelectedUsers] = useState<string[]>(currentAssignments.map((a: Assignment) => a.assigneeId));

    useEffect(() => {
        const assignments = form.getValues(`tasks.${taskIndex}.assignments`) || [];
        setSelectedUsers(assignments.map((a: Assignment) => a.assigneeId));
    }, [currentAssignments, form, taskIndex]);

    const { importedUsers, liveUserIds } = useMemo(() => {
      const imported = workspaceData?.members || [];
      const liveIds = new Set(liveUsers.map(u => u.id));
      
      const uniqueImported = imported.filter(importedUser => 
          !liveUsers.some(liveUser => liveUser.name === importedUser.name)
      );

      return { 
          importedUsers: uniqueImported,
          liveUserIds: liveIds
      };
    }, [liveUsers, workspaceData]);

    const allUsers = useMemo(() => {
        const all = new Map<string, User>();
        liveUsers.forEach(u => all.set(u.id, u));
        (workspaceData?.members || []).forEach(u => {
            if (!all.has(u.id)) {
                all.set(u.id, u);
            }
        });
        return Array.from(all.values());
    }, [liveUsers, workspaceData]);


    const handleDone = () => {
        const currentAssignments = form.getValues(`tasks.${taskIndex}.assignments`) || [];
        const newAssignments = selectedUsers.map(userId => {
            const existing = currentAssignments.find((a: Assignment) => a.assigneeId === userId);
            return existing || { assigneeId: userId, workingDays: [1, 2, 3, 4, 5], effort: 0 };
        });

        const finalAssignmentsPre = newAssignments.filter(a => selectedUsers.includes(a.assigneeId));

        const evenSplit = finalAssignmentsPre.length > 0 ? 100 / finalAssignmentsPre.length : 0;
        const finalAssignments = finalAssignmentsPre.map(a => ({...a, effort: evenSplit }));

        form.setValue(`tasks.${taskIndex}.assignments`, finalAssignments, { shouldValidate: true });
        setIsOpen(false);
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    
    const getUserById = (id: string) => allUsers.find(u => u.id === id);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <Button variant="outline" role="combobox" aria-expanded={isOpen} className="w-full justify-between">
                    {currentAssignments?.length > 0 ? `${currentAssignments.length} selected` : "Assign Members"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup heading="Workspace Members">
                            <ScrollArea className="max-h-32">
                                {liveUsers.map(user => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => handleUserSelect(user.id)}
                                        className="flex items-center"
                                    >
                                        <Checkbox
                                            id={`user-${user.id}`}
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={() => handleUserSelect(user.id)}
                                            className="mr-2"
                                        />
                                        <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">{user.name}</label>
                                    </CommandItem>
                                ))}
                            </ScrollArea>
                        </CommandGroup>
                        {importedUsers.length > 0 && (
                            <>
                            <Separator />
                            <CommandGroup heading="Assign Other Team Members">
                                <ScrollArea className="max-h-32">
                                    {importedUsers.map(user => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.name}
                                            onSelect={() => handleUserSelect(user.id)}
                                            className="flex items-center"
                                        >
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => handleUserSelect(user.id)}
                                                className="mr-2"
                                            />
                                            <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer text-white hover:text-blue-200">{user.name}</label>
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                            </>
                        )}
                    </CommandList>
                     <div className="p-2 border-t flex justify-end">
                        <Button onClick={handleDone}>Save</Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


export default function AddProjectDialog({ isOpen, onClose, onAddProject }: AddProjectDialogProps) {
  const { users } = useUsers();
   const { workspaceData } = useWorkspace();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      status: 'On Track',
      tasks: [defaultTaskValues],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });
  
  const watchTasks = form.watch('tasks');

  const allUsers = useMemo(() => {
    const all = new Map<string, User>();
    users.forEach(u => all.set(u.id, u));
    (workspaceData?.members || []).forEach(u => {
        if (!all.has(u.id)) {
            all.set(u.id, u);
        }
    });
    return Array.from(all.values());
    }, [users, workspaceData]);

  const onSubmit = (data: ProjectFormValues) => {
    const { tasks, ...projectData } = data;
    onAddProject(projectData, tasks);
    form.reset();
    onClose();
  };
  
  const getUserById = (id: string) => allUsers.find(u => u.id === id);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Enter the details for the new project and add its initial tasks.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="pr-6 -mr-6 h-[60vh]">
              <div className="space-y-6 pr-6">
                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Substation Automation Upgrade" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Initial Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="On Track">On Track</SelectItem>
                            <SelectItem value="At Risk">At Risk</SelectItem>
                            <SelectItem value="Off Track">Off Track</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Tasks</h3>
                  <div className="space-y-4">
                      {fields.map((field, taskIndex) => (
                      <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                        <div className="flex justify-between items-start">
                           <h4 className="font-semibold text-base pt-2">Task #{taskIndex + 1}</h4>
                           <Button type="button" variant="ghost" size="icon" onClick={() => remove(taskIndex)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Remove Task</span>
                           </Button>
                        </div>

                        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                          <div className="col-span-12 sm:col-span-6 md:col-span-8">
                              <FormField
                                control={form.control}
                                name={`tasks.${taskIndex}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Task Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Task name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                              />
                          </div>
                          
                           <div className="col-span-12 sm:col-span-6 md:col-span-4">
                              <FormField
                                  control={form.control}
                                  name={`tasks.${taskIndex}.hours`}
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Estimated Hours</FormLabel>
                                      <FormControl>
                                          <Input type="number" placeholder="Hours" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>

                           <div className="col-span-12">
                                <FormField
                                    control={form.control}
                                    name={`tasks.${taskIndex}.assignments`}
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Assignees</FormLabel>
                                            <AssigneePopover taskIndex={taskIndex} form={form} />
                                            <FormMessage>{form.formState.errors.tasks?.[taskIndex]?.assignments?.message || form.formState.errors.tasks?.[taskIndex]?.assignments?.root?.message}</FormMessage>
                                        </FormItem>
                                    )}
                                />
                           </div>

                            {watchTasks[taskIndex]?.assignments?.map((assignment, assignmentIndex) => {
                                const user = getUserById(assignment.assigneeId);
                                const totalEffort = watchTasks[taskIndex].assignments.reduce((sum, a) => sum + a.effort, 0);

                                return (
                                    <div key={assignment.assigneeId} className="col-span-12 p-3 border rounded-md bg-muted/30">
                                       <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={user?.avatar} />
                                                    <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm">{user?.name}</span>
                                            </div>
                                            <div className="text-sm font-semibold">{assignment.effort.toFixed(0)}%</div>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`tasks.${taskIndex}.assignments.${assignmentIndex}.effort`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Effort</FormLabel>
                                                    <FormControl>
                                                        <Slider
                                                            min={0}
                                                            max={100}
                                                            step={5}
                                                            value={[field.value]}
                                                            onValueChange={(value) => field.onChange(value[0])}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        <div className="mt-3">
                                            <FormField
                                                control={form.control}
                                                name={`tasks.${taskIndex}.assignments.${assignmentIndex}.workingDays`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Working Days</FormLabel>
                                                        <div className="flex gap-2 items-center">
                                                            {weekDays.map(day => (
                                                                <FormField
                                                                    key={day.id}
                                                                    control={form.control}
                                                                    name={`tasks.${taskIndex}.assignments.${assignmentIndex}.workingDays`}
                                                                    render={({ field }) => (
                                                                        <FormItem key={day.id} className="flex flex-col items-center space-y-1">
                                                                             <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(day.id)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        return checked
                                                                                        ? field.onChange([...(field.value || []), day.id])
                                                                                        : field.onChange(field.value?.filter((value) => value !== day.id))
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="text-xs">{day.label}</FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                         {assignmentIndex === watchTasks[taskIndex].assignments.length - 1 && Math.abs(totalEffort - 100) > 0.01 && (
                                            <div className="text-xs font-medium text-destructive text-right mt-2">
                                                Total effort must be 100%. Current: {totalEffort.toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                           
                           <div className="col-span-6">
                             <FormField
                                control={form.control}
                                name={`tasks.${taskIndex}.startDate`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                          </div>
                          <div className="col-span-6">
                              <FormField
                                control={form.control}
                                name={`tasks.${taskIndex}.endDate`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>End Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                          </div>
                          
                          <div className="col-span-12">
                              <FormMessage>{form.formState.errors.tasks?.[taskIndex]?.endDate?.message}</FormMessage>
                          </div>
                      </div>
                      </div>
                      ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append(defaultTaskValues)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Another Task
                  </Button>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
