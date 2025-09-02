
'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Team, Project, Task } from '@/lib/firebase-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';


interface WorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: Task[];
}

interface EditMembersProps {
    workspaceData: WorkspaceData;
    setWorkspaceData: (data: WorkspaceData) => void;
}

const memberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().url('Must be a valid URL'),
  capacity: z.coerce.number().min(0, 'Capacity must be a positive number'),
  teams: z.array(z.string()),
});

const formSchema = z.object({
  members: z.array(memberSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditMembers({ workspaceData, setWorkspaceData }: EditMembersProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      members: workspaceData.members,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members',
  });
  
  const onSubmit = (data: FormValues) => {
    setWorkspaceData({
        ...workspaceData,
        members: data.members
    });
    toast({
        title: "Success",
        description: "Local member data has been updated."
    })
  };

  const handleAddNewMember = () => {
    append({
        id: uuidv4(),
        name: 'New Member',
        avatar: 'https://i.pravatar.cc/150',
        capacity: 8,
        teams: [],
    })
  }
  
  const handleRemoveMember = (index: number) => {
      const memberToRemove = fields[index];
      const isAssigned = workspaceData.tasks.some(task => 
        task.assignments.some(a => a.assigneeId === memberToRemove.id)
      );

      if (isAssigned) {
          toast({
              title: "Cannot Delete Member",
              description: `${memberToRemove.name} is currently assigned to one or more tasks. Please reassign the tasks before deleting.`,
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
                            <TableHead>Name</TableHead>
                            <TableHead>Avatar URL</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Teams</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                             <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`members.${index}.name`}
                                        render={({ field }) => (
                                            <Input {...field} />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`members.${index}.avatar`}
                                        render={({ field }) => (
                                            <Input {...field} />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`members.${index}.capacity`}
                                        render={({ field }) => (
                                            <Input type="number" {...field} />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`members.${index}.teams`}
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                                                             {field.value?.length > 0 ? `${field.value.length} selected` : "Select teams"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search teams..." />
                                                        <CommandList>
                                                        <CommandEmpty>No teams found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {workspaceData.teams.map((team) => (
                                                            <CommandItem
                                                                value={team.name}
                                                                key={team.id}
                                                                onSelect={() => {
                                                                    const currentTeams = field.value || [];
                                                                    const newTeams = currentTeams.includes(team.name)
                                                                        ? currentTeams.filter(t => t !== team.name)
                                                                        : [...currentTeams, team.name];
                                                                    form.setValue(`members.${index}.teams`, newTeams);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value?.includes(team.name) ? "opacity-100" : "opacity-0")} />
                                                                {team.name}
                                                            </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                     />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between items-center">
                 <Button type="button" variant="outline" size="sm" onClick={handleAddNewMember}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Member
                </Button>
                <Button type="submit">Save Member Changes</Button>
            </div>
        </form>
    </Form>
  )
}
