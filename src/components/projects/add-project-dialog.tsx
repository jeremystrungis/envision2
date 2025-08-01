
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
import { Project, Task, User } from '@/lib/data';
import { useStore } from '@/lib/store';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  assigneeId: z.string().nullable(),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => !data.name || data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
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
  assigneeId: null,
  startDate: new Date(),
  endDate: new Date(),
};

export default function AddProjectDialog({ isOpen, onClose, onAddProject }: AddProjectDialogProps) {
  const { users } = useStore();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      status: 'On Track',
      tasks: Array(4).fill(defaultTaskValues),
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
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
                          <div className="col-span-12 sm:col-span-6 md:col-span-5">
                              <FormField
                              control={form.control}
                              name={`tasks.${index}.name`}
                              render={({ field }) => (
                                  <FormItem>
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
                                  name={`tasks.${index}.assigneeId`}
                                  render={({ field: selectField }) => (
                                      <FormItem>
                                      <Select onValueChange={selectField.onChange} value={selectField.value || "unassigned"}>
                                          <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Assignee" />
                                          </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                          <SelectItem value="unassigned">Unassigned</SelectItem>
                                          {users.map(user => (
                                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                          ))}
                                          </SelectContent>
                                      </Select>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>
                          <div className="col-span-6 sm:col-span-6 md:col-span-3">
                              <Controller
                                  control={form.control}
                                  name={`tasks.${index}.startDate`}
                                  render={({ field: dateField }) => (
                                      <Popover>
                                          <PopoverTrigger asChild>
                                          <FormControl>
                                              <Button
                                              variant={"outline"}
                                              className={cn(
                                                  "w-full justify-start text-left font-normal",
                                                  !dateField.value && "text-muted-foreground"
                                              )}
                                              >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {dateField.value ? format(dateField.value, "PPP") : <span>Start date</span>}
                                              </Button>
                                          </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar mode="single" selected={dateField.value} onSelect={dateField.onChange} initialFocus />
                                          </PopoverContent>
                                      </Popover>
                                  )}
                              />
                          </div>
                          <div className="col-span-6 sm:col-span-6 md:col-span-3">
                              <Controller
                                  control={form.control}
                                  name={`tasks.${index}.endDate`}
                                  render={({ field: dateField }) => (
                                      <Popover>
                                          <PopoverTrigger asChild>
                                          <FormControl>
                                              <Button
                                              variant={"outline"}
                                              className={cn(
                                                  "w-full justify-start text-left font-normal",
                                                  !dateField.value && "text-muted-foreground"
                                              )}
                                              >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {dateField.value ? format(dateField.value, "PPP") : <span>End date</span>}
                                              </Button>
                                          </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar mode="single" selected={dateField.value} onSelect={dateField.onChange} initialFocus />
                                          </PopoverContent>
                                      </Popover>
                                  )}
                              />
                          </div>
                          <div className="col-span-12 md:col-span-1 flex items-center">
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
