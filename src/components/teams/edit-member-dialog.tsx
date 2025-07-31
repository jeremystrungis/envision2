
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
import { User } from '@/lib/data';
import { useEffect } from 'react';

const memberSchema = z.object({
  name: z.string().min(1, 'Member name is required'),
  team: z.enum(['System Planning', 'Protection & Control', 'Substation Engineering', 'Transmission Line Design']),
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
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: user.name,
      team: user.team,
      capacity: user.capacity,
      avatar: user.avatar,
    },
  });

  useEffect(() => {
    form.reset({
        name: user.name,
        team: user.team,
        capacity: user.capacity,
        avatar: user.avatar,
    })
  }, [user, form]);

  const onSubmit = (data: MemberFormValues) => {
    onUpdateUser(data);
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
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="System Planning">System Planning</SelectItem>
                      <SelectItem value="Protection & Control">Protection & Control</SelectItem>
                      <SelectItem value="Substation Engineering">Substation Engineering</SelectItem>
                      <SelectItem value="Transmission Line Design">Transmission Line Design</SelectItem>
                    </SelectContent>
                  </Select>
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
