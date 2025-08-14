
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
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Project, Task, Assignment } from '@/lib/firebase-types';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import React, { useCallback, useEffect, useState } from 'react';
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
  hours: z.coerce.number().min(0, "Hours must be positive"),
}).refine(data => !data.name || data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine(data => {
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

function AssigneePopover({ taskIndex, form, users }: { taskIndex: number, form: any, users: any[] }) {
    const [open, setOpen] = useState(false);

    const redistributeEffort = useCallback((taskIndex: number) => {
        const assignments = form.getValues(`tasks.${taskIndex}.assignments`);
        if (assignments.length > 0) {
        const evenSplit = 100 / assignments.length;
        const updatedAssignments = assignments.map((a:any) => ({...a, effort: evenSplit}));
        form.setValue(`tasks.${taskIndex}.assignments`, updatedAssignments, { shouldValidate: true });
        }
    }, [form]);

    const handleSliderChange = (taskIndex: number, assignmentIndex: number, newEffort: number) => {
        const assignments = form.getValues(`tasks.${taskIndex}.assignments`);
        const otherAssignments = assignments.filter((_:any, i:number) => i !== assignmentIndex);
        const remainingEffort = 100 - newEffort;
        
        if (otherAssignments.length > 0) {
            const totalPreviousEffort = otherAssignments.reduce((sum:number, a:any) => sum + a.effort, 0);
            
            const updatedAssignments = [...assignments];
            updatedAssignments[assignmentIndex].effort = newEffort;

            if (totalPreviousEffort > 0) {
                otherAssignments.forEach((ass:any, i:number) => {
                    const originalProportion = ass.effort / totalPreviousEffort;
                    const otherIndex = assignments.findIndex((a:any) => a.assigneeId === ass.assigneeId);
                    updatedAssignments[otherIndex].effort = remainingEffort * originalProportion;
                });
            } else {
                const evenSplit = remainingEffort / otherAssignments.length;
                otherAssignments.forEach((ass:any, i:number) => {
                    const otherIndex = assignments.findIndex((a:any) => a.assigneeId === ass.assigneeId);
                    updatedAssignments[otherIndex].effort = evenSplit;
                });
            }
            
            form.setValue(`tasks.${taskIndex}.assignments`, updatedAssignments, { shouldValidate: true });
        } else {
            const updatedAssignments = [...assignments];
            updatedAssignments[assignmentIndex].effort = 100;
            form.setValue(`tasks.${taskIndex}.assignments`, updatedAssignments, { shouldValidate: true });
        }
    };
    
    const assignmentsField = form.watch(`tasks.${taskIndex}.assignments`);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    {assignmentsField.length > 0 ? `${assignmentsField.length} selected` : 'Select members'}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search members..." />
                    <ScrollArea className="h-[200px]">
                        <CommandList>
                            <CommandEmpty>No members found.</CommandEmpty>
                            <CommandGroup>
                                {users.map(user => {
                                    const assignmentIndex = assignmentsField.findIndex((a: any) => a.assigneeId === user.id);
                                    const isSelected = assignmentIndex > -1;
                                    
                                    return (
                                        <React.Fragment key={user.id}>
                                            <CommandItem
                                                onSelect={() => {
                                                    const currentAssignments = assignmentsField || [];
                                                    if (isSelected) {
                                                        form.setValue(`tasks.${taskIndex}.assignments`, currentAssignments.filter((a: any) => a.assigneeId !== user.id));
                                                    } else {
                                                        form.setValue(`tasks.${taskIndex}.assignments`, [...currentAssignments, { assigneeId: user.id, workingDays: [1, 2, 3, 4, 5], effort: 0 }]);
                                                    }
                                                    redistributeEffort(taskIndex);
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
                                                                name={`tasks.${taskIndex}.assignments.${assignmentIndex}.workingDays`}
                                                                render={({ field: daysField }) => (
                                                                    <FormItem className="flex flex-col items-center space-y-1">
                                                                        <FormLabel htmlFor={`day-${taskIndex}-${assignmentIndex}-${day.id}`} className="text-xs">{day.label}</FormLabel>
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                id={`day-${taskIndex}-${assignmentIndex}-${day.id}`}
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
                                                            value={[assignmentsField[assignmentIndex]?.effort || 0]}
                                                            onValueChange={([val]) => handleSliderChange(taskIndex, assignmentIndex, val)}
                                                            max={100}
                                                            step={5}
                                                        />
                                                        <span className="text-xs text-muted-foreground w-16 text-right">
                                                            {Math.round(assignmentsField[assignmentIndex]?.effort || 0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </ScrollArea>
                    <div className="p-1 border-t">
                        <Button className="w-full" size="sm" onClick={() => setOpen(false)}>Done</Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function AddProjectDialog({ isOpen, onClose, onAddProject }: AddProjectDialogProps) {
  const { users } = useUsers();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      status: 'On Track',
      tasks: Array(1).fill(defaultTaskValues),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  const onSubmit = (data: ProjectFormValues) => {
    const { tasks, ...projectData } = data;
    onAddProject(projectData, tasks);
    form.reset();
    onClose();
  };

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
                      {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 p-4 border rounded-lg relative">
                          <div className="col-span-12">
                              <FormLabel>Task #{index + 1}</FormLabel>
                          </div>
                          <div className="col-span-12 sm:col-span-6 md:col-span-8">
                              <FormField
                              control={form.control}
                              name={`tasks.${index}.name`}
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
                                  name={`tasks.${index}.hours`}
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Estimated # of hours per person</FormLabel>
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
                                name={`tasks.${index}.assignments`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assignees, Work Days & Effort</FormLabel>
                                        <AssigneePopover taskIndex={index} form={form} users={users} />
                                        <FormMessage>{form.formState.errors.tasks?.[index]?.assignments?.message}</FormMessage>
                                    </FormItem>
                                )}
                            />
                           </div>
                           
                           <div className="col-span-6">
                             <FormField
                                control={form.control}
                                name={`tasks.${index}.startDate`}
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
                                name={`tasks.${index}.endDate`}
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
                          <div className="col-span-12 flex justify-end">
                              <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => remove(index)}
                              >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove Task</span>
                              </Button>
                          </div>
                          <div className="col-span-12">
                              <FormMessage>{form.formState.errors.tasks?.[index]?.endDate?.message}</FormMessage>
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
