
'use client';

import React, { useCallback, useEffect } from 'react';
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
import { CalendarIcon, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/firebase-types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { useUsers } from '@/hooks/use-users';

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

export default function EditTaskDialog({ isOpen, onClose, onUpdateTask, task }: EditTaskDialogProps) {
  const { users } = useUsers();
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
  
  const redistributeEffort = useCallback(() => {
    const assignments = form.getValues('assignments');
    if (assignments.length > 0) {
      const evenSplit = 100 / assignments.length;
      const updatedAssignments = assignments.map(a => ({...a, effort: evenSplit}));
      form.setValue('assignments', updatedAssignments, { shouldValidate: true });
    }
  }, [form]);

  const handleSliderChange = (assignmentIndex: number, newEffort: number) => {
    const assignments = form.getValues('assignments');
    const otherAssignments = assignments.filter((_, i) => i !== assignmentIndex);
    const remainingEffort = 100 - newEffort;
    
    if (otherAssignments.length > 0) {
        const totalPreviousEffort = otherAssignments.reduce((sum, a) => sum + a.effort, 0);
        
        const updatedAssignments = [...assignments];
        updatedAssignments[assignmentIndex].effort = newEffort;

        if (totalPreviousEffort > 0) {
            otherAssignments.forEach((ass, i) => {
                const originalProportion = ass.effort / totalPreviousEffort;
                const otherIndex = assignments.findIndex(a => a.assigneeId === ass.assigneeId);
                updatedAssignments[otherIndex].effort = remainingEffort * originalProportion;
            });
        } else {
            const evenSplit = remainingEffort / otherAssignments.length;
            otherAssignments.forEach((ass, i) => {
                const otherIndex = assignments.findIndex(a => a.assigneeId === ass.assigneeId);
                updatedAssignments[otherIndex].effort = evenSplit;
            });
        }
        
        form.setValue(`assignments`, updatedAssignments, { shouldValidate: true });
    } else {
        const updatedAssignments = [...assignments];
        updatedAssignments[assignmentIndex].effort = 100;
        form.setValue(`assignments`, updatedAssignments, { shouldValidate: true });
    }
  };


  useEffect(() => {
    form.reset({
        name: task.name,
        assignments: task.assignments,
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
                render={({ field: assignmentsField }) => (
                    <FormItem>
                        <FormLabel>Assignees, Work Days & Effort</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                    {assignmentsField.value.length > 0 ? `${assignmentsField.value.length} selected` : 'Select members'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search members..." />
                                    <CommandList>
                                        <CommandEmpty>No members found.</CommandEmpty>
                                        <CommandGroup>
                                            {users.map(user => {
                                                const assignmentIndex = assignmentsField.value.findIndex(a => a.assigneeId === user.id);
                                                const isSelected = assignmentIndex > -1;
                                                
                                                return (
                                                    <React.Fragment key={user.id}>
                                                        <CommandItem
                                                            onSelect={() => {
                                                                const currentAssignments = assignmentsField.value || [];
                                                                if (isSelected) {
                                                                    form.setValue(`assignments`, currentAssignments.filter(a => a.assigneeId !== user.id));
                                                                } else {
                                                                    form.setValue(`assignments`, [...currentAssignments, { assigneeId: user.id, workingDays: [1, 2, 3, 4, 5], effort: 0 }]);
                                                                }
                                                                redistributeEffort();
                                                            }}
                                                        >
                                                            <Checkbox className="mr-2" checked={isSelected} />
                                                            {user.name}
                                                        </CommandItem>
                                                        {isSelected && (
                                                            <div className="pl-8 pr-2 pb-2 space-y-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    {weekDays.map(day => (
                                                                        <FormField
                                                                            key={day.id}
                                                                            control={form.control}
                                                                            name={`assignments.${assignmentIndex}.workingDays`}
                                                                            render={({ field: daysField }) => (
                                                                                <FormItem className="flex flex-col items-center space-y-1">
                                                                                    <FormLabel htmlFor={`day-edit-${assignmentIndex}-${day.id}`} className="text-xs">{day.label}</FormLabel>
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            id={`day-edit-${assignmentIndex}-${day.id}`}
                                                                                            checked={daysField.value?.includes(day.id)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentDays = daysField.value || [];
                                                                                                return checked
                                                                                                    ? daysField.onChange([...currentDays, day.id])
                                                                                                    : daysField.onChange(currentDays.filter((value) => value !== day.id));
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                 <div className="flex items-center gap-2">
                                                                    <Slider
                                                                        value={[assignmentsField.value[assignmentIndex]?.effort || 0]}
                                                                        onValueChange={([val]) => handleSliderChange(assignmentIndex, val)}
                                                                        max={100}
                                                                        step={5}
                                                                    />
                                                                    <span className="text-xs text-muted-foreground w-16 text-right">
                                                                        {Math.round(assignmentsField.value[assignmentIndex]?.effort || 0)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />

             <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated # of hours per person</FormLabel>
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
