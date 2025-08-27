
'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { useForm } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, Assignment, User } from '@/lib/firebase-types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { useUsers } from '@/hooks/use-users';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useWorkspace } from '@/context/workspace-context';
import { Separator } from '../ui/separator';


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
  hours: z.coerce.number().min(0, "Hours must be a positive number"),
}).refine(data => data.endDate >= data.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
}).refine(data => {
    if (data.assignments.length === 0) return true;
    const totalEffort = data.assignments.reduce((sum, a) => sum + a.effort, 0);
    return Math.abs(totalEffort - 100) < 0.01;
}, {
    message: "Total effort must sum to 100%",
    path: ["assignments"],
});


type TaskFormValues = z.infer<typeof taskSchema>;

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Omit<Task, 'id' | 'projectId' | 'dependencies'>) => void;
  task: Task;
}

const weekDays = [
    { id: 1, label: 'M' }, { id: 2, label: 'T' }, { id: 3, label: 'W' },
    { id: 4, label: 'T' }, { id: 5, label: 'F' }, { id: 6, label: 'S' }, { id: 0, label: 'S' }
];

function AssigneePopover({ form }: { form: any }) {
    const { users: liveUsers } = useUsers();
    const { workspaceData } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);

    const currentAssignments = form.watch('assignments') || [];
    const [selectedUsers, setSelectedUsers] = useState<string[]>(currentAssignments.map((a: Assignment) => a.assigneeId));
    
    useEffect(() => {
        const assignments = form.getValues('assignments') || [];
        setSelectedUsers(assignments.map((a: Assignment) => a.assigneeId));
    }, [currentAssignments, form]);

    const { importedUsers } = useMemo(() => {
      const imported = workspaceData?.members || [];
      const uniqueImported = imported.filter(importedUser => 
          !liveUsers.some(liveUser => liveUser.name === importedUser.name)
      );
      return { importedUsers: uniqueImported };
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
        const currentAssignments = form.getValues('assignments') || [];
        const newAssignments = selectedUsers.map(userId => {
            const existing = currentAssignments.find((a: Assignment) => a.assigneeId === userId);
            return existing || { assigneeId: userId, workingDays: [1, 2, 3, 4, 5], effort: 0 };
        });
        
        const finalAssignmentsPre = newAssignments.filter(a => selectedUsers.includes(a.assigneeId));

        const evenSplit = finalAssignmentsPre.length > 0 ? 100 / finalAssignmentsPre.length : 0;
        const finalAssignments = finalAssignmentsPre.map(a => ({...a, effort: evenSplit }));

        form.setValue('assignments', finalAssignments, { shouldValidate: true });
        setIsOpen(false);
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    
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
                                            id={`user-edit-task-${user.id}`}
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={() => handleUserSelect(user.id)}
                                            className="mr-2"
                                        />
                                        <label htmlFor={`user-edit-task-${user.id}`} className="flex-1 cursor-pointer">{user.name}</label>
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
                                        className="flex items-center aria-selected:bg-blue-500/20"
                                    >
                                        <Checkbox
                                            id={`user-edit-task-imported-${user.id}`}
                                            checked={selectedUsers.includes(user.id)}
                                            onCheckedChange={() => handleUserSelect(user.id)}
                                            className="mr-2"
                                        />
                                        <label htmlFor={`user-edit-task-imported-${user.id}`} className="flex-1 cursor-pointer text-white">{user.name}</label>
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

export default function EditTaskDialog({ isOpen, onClose, onUpdateTask, task }: EditTaskDialogProps) {
  const { users: liveUsers } = useUsers();
  const { workspaceData } = useWorkspace();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task.name,
      assignments: task.assignments,
      startDate: task.startDate.toDate(),
      endDate: task.endDate.toDate(),
      hours: task.hours,
    },
  });
  
  const watchAssignments = form.watch('assignments');

  useEffect(() => {
    form.reset({
        name: task.name,
        assignments: task.assignments || [],
        startDate: task.startDate.toDate(),
        endDate: task.endDate.toDate(),
        hours: task.hours,
    })
  }, [task, form, isOpen]);

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
  
  const getUserById = (id: string) => allUsers.find(u => u.id === id);


  const onSubmit = (data: TaskFormValues) => {
    onUpdateTask(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details for this task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., General Arrangement Drawings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="assignments"
                render={() => (
                    <FormItem>
                        <FormLabel>Assignees</FormLabel>
                        <AssigneePopover form={form} />
                        <FormMessage>{form.formState.errors.assignments?.message || form.formState.errors.assignments?.root?.message}</FormMessage>
                    </FormItem>
                )}
            />

            {watchAssignments?.map((assignment, index) => {
                const user = getUserById(assignment.assigneeId);
                const totalEffort = watchAssignments.reduce((sum, a) => sum + a.effort, 0);

                return (
                    <div key={assignment.assigneeId} className="p-3 border rounded-md bg-muted/30">
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
                            name={`assignments.${index}.effort`}
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
                                name={`assignments.${index}.workingDays`}
                                render={() => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Working Days</FormLabel>
                                        <div className="flex gap-2 items-center">
                                            {weekDays.map(day => (
                                                <FormField
                                                    key={day.id}
                                                    control={form.control}
                                                    name={`assignments.${index}.workingDays`}
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
                        {index === watchAssignments.length - 1 && Math.abs(totalEffort - 100) > 0.01 && (
                            <div className="text-xs font-medium text-destructive text-right mt-2">
                                Total effort must be 100%. Current: {totalEffort.toFixed(0)}%
                            </div>
                        )}
                    </div>
                );
            })}

             <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
