
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
import { User } from '@/lib/firebase-types';
import { useEffect } from 'react';
import { useTeams } from '@/hooks/use-teams';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';


const memberSchema = z.object({
  name: z.string().min(1, 'Member name is required'),
  teams: z.array(z.string()).optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1 hour').max(12, 'Capacity cannot exceed 12 hours'),
  avatar: z.string().url('Please enter a valid URL for the avatar.'),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface EditMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (user: Omit<User, 'id'>) => void;
  user: User;
}

export default function EditMemberDialog({ isOpen, onClose, onUpdateUser, user }: EditMemberDialogProps) {
  const { teams: availableTeams } = useTeams();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: user.name,
      teams: user.teams || [],
      capacity: user.capacity,
      avatar: user.avatar,
    },
  });

  useEffect(() => {
    form.reset({
        name: user.name,
        teams: user.teams || [],
        capacity: user.capacity,
        avatar: user.avatar,
    });
  }, [user, form, isOpen]);

  const onSubmit = (data: MemberFormValues) => {
    onUpdateUser({ ...data, teams: data.teams || [] });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update the details for this team member.
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
                    <Input placeholder="e.g., Jane Doe" {...field} />
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
              name="teams"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Team(s)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value?.length && "text-muted-foreground"
                                    )}
                                >
                                    {field.value && field.value.length > 0
                                        ? `${field.value.length} team(s) selected`
                                        : "Select teams"}
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
                                    {availableTeams.map((team) => (
                                        <CommandItem
                                            value={team.name}
                                            key={team.id}
                                            onSelect={() => {
                                                const currentTeams = field.value || [];
                                                const newTeams = currentTeams.includes(team.name)
                                                    ? currentTeams.filter(t => t !== team.name)
                                                    : [...currentTeams, team.name];
                                                form.setValue("teams", newTeams);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value?.includes(team.name)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                            />
                                            {team.name}
                                        </CommandItem>
                                    ))}
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
