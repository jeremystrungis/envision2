
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/lib/firebase-types';
import { useState, useMemo, useEffect } from 'react';
import { useUsers } from '@/hooks/use-users';

const memberSchema = z.object({
  name: z.string().min(1, 'Member name is required'),
  team: z.string().min(1, 'Team name cannot be empty'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1 hour').max(12, 'Capacity cannot exceed 12 hours'),
  avatar: z.string().url('Please enter a valid URL for the avatar.'),
  newTeamName: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
}

const defaultValues = {
    name: '',
    team: '',
    capacity: 8,
    avatar: 'https://i.pravatar.cc/150',
    newTeamName: '',
}

export default function AddMemberDialog({ isOpen, onClose, onAddUser }: AddMemberDialogProps) {
  const { users } = useUsers();
  const [isAddingNewTeam, setIsAddingNewTeam] = useState(false);

  const existingTeams = useMemo(() => {
    const teams = new Set(users.map(u => u.team));
    return Array.from(teams);
  }, [users]);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(defaultValues);
        setIsAddingNewTeam(false);
    }
  }, [isOpen, form]);

  const onSubmit = (data: MemberFormValues) => {
    const finalTeam = isAddingNewTeam ? data.newTeamName : data.team;
    const { newTeamName, ...userData } = data;
    onAddUser({ ...userData, team: finalTeam as any });
  };
  
  const handleTeamChange = (value: string) => {
    if (value === 'add_new_team') {
        setIsAddingNewTeam(true);
        form.setValue('team', 'add_new_team');
    } else {
        setIsAddingNewTeam(false);
        form.setValue('team', value);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new team member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://i.pravatar.cc/150" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                    {!isAddingNewTeam ? (
                        <Select onValueChange={handleTeamChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {existingTeams.map(teamName => (
                                    <SelectItem key={teamName} value={teamName}>{teamName}</SelectItem>
                                ))}
                                <SelectItem value="add_new_team">Add New Team...</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <FormField
                            control={form.control}
                            name="newTeamName"
                            render={({ field: newTeamField }) => (
                                <div className="flex items-center gap-2">
                                    <Input placeholder="Enter new team name" {...newTeamField} />
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingNewTeam(false)}>Cancel</Button>
                                </div>
                            )}
                        />
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Capacity (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
