
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
import { Form, FormField } from '@/components/ui/form';
import { v4 as uuidv4 } from 'uuid';

interface WorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: Task[];
}

interface EditTeamsProps {
    workspaceData: WorkspaceData;
    setWorkspaceData: (data: WorkspaceData) => void;
}

const teamSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
});

const formSchema = z.object({
  teams: z.array(teamSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditTeams({ workspaceData, setWorkspaceData }: EditTeamsProps) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teams: workspaceData.teams,
    },
  });

  useEffect(() => {
    form.reset({ teams: workspaceData.teams });
  }, [workspaceData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'teams',
  });
  
  const onSubmit = (data: FormValues) => {
    setWorkspaceData({
        ...workspaceData,
        teams: data.teams
    });
    toast({
        title: "Success",
        description: "Local team data has been updated."
    })
  };

  const handleAddNewTeam = () => {
    append({ id: uuidv4(), name: 'New Team' })
  }
  
  const handleRemoveTeam = (index: number) => {
      const teamToRemove = fields[index];
      const isAssigned = workspaceData.members.some(member => member.teams.includes(teamToRemove.name));

      if (isAssigned) {
          toast({
              title: "Cannot Delete Team",
              description: `"${teamToRemove.name}" is assigned to one or more members. Please reassign the members before deleting.`,
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
                            <TableHead>Team Name</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                             <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`teams.${index}.name`}
                                        render={({ field }) => (
                                            <Input {...field} />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTeam(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between items-center">
                 <Button type="button" variant="outline" size="sm" onClick={handleAddNewTeam}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Team
                </Button>
                <Button type="submit">Save Team Changes</Button>
            </div>
        </form>
    </Form>
  )
}

    