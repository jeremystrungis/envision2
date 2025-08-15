
'use client';

import React, { useEffect, useState } from 'react';
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

function AssigneePopover({ form }: { form: any }) {
    const { users } = useUsers();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>(() => {
        const existingAssignees = form.getValues('assignments') || [];
        return existingAssignees.map((a: Assignment) => a.assigneeId);
    });

    const assignmentsField = form.watch('assignments');

    useEffect(() => {
        const existingAssignees = form.getValues('assignments') || [];
        setSelectedUsers(existingAssignees.map((a: Assignment) => a.assigneeId));
    }, [assignmentsField, form]);

    const handleDone = () => {
        const currentAssignments = form.getValues('assignments') || [];
        const newAssignments = selectedUsers.map(userId => {
            const existing = currentAssignments.find((a: Assignment) => a.assigneeId === userId);
            return existing || { assigneeId: userId, workingDays: [1, 2, 3, 4, 5], effort: 0 };
        });

        const evenSplit = newAssignments.length > 0 ? 100 / newAssignments.length : 0;
        const finalAssignments = newAssignments.map(a => ({...a, effort: evenSplit }));

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
                    {assignmentsField?.length > 0 ? `${assignmentsField.length} selected` : "Assign Members"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-48">
                                {users.map(user => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => handleUserSelect(user.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedUsers.includes(user.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {user.name}
                                    </CommandItem>
                                ))}
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                     <div className="p-2 border-t flex justify-end">
                        <Button onClick={handleDone}>Done</Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function EditTaskDialog({ isOpen, onClose, onUpdateTask, task }: EditTaskDialogProps) {
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

  useEffect(() => {
    form.reset({
        name: task.name,
        assignments: task.assignments || [],
        startDate: task.startDate.toDate(),
        endDate: task.endDate.toDate(),
        hours: task.hours,
    })
  }, [task, form, isOpen]);

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
