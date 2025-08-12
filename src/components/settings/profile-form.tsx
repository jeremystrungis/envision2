
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useStore, store } from '@/lib/store'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { User } from 'lucide-react'

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(30, {
      message: 'Name must not be longer than 30 characters.',
    }),
  avatar: z.string().url({ message: 'Please enter a valid URL.' }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>


export function ProfileForm() {
  const { users } = useStore();
  const { toast } = useToast();

  // For this prototype, we'll edit the first user in the list.
  // In a real app, this would be the logged-in user.
  const currentUser = users[0];

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || '',
      avatar: currentUser?.avatar || '',
    },
    mode: 'onChange',
  })

  function onSubmit(data: ProfileFormValues) {
    if (!currentUser) return;
    
    // We only need name and avatar for the profile form.
    // Preserve other user properties.
    const { team, capacity } = currentUser;
    store.updateUser(currentUser.id, { ...data, team, capacity });

    toast({
      title: 'Profile updated',
      description: 'Your profile information has been successfully updated.',
    })
  }

  if (!currentUser) {
    return (
        <Alert>
            <User className="h-4 w-4" />
            <AlertTitle>No User Profile Found</AlertTitle>
            <AlertDescription>
                To manage profile settings, please first add a team member on the Teams page.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed throughout the application.
              </FormDescription>
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
                <Input placeholder="https://example.com/avatar.png" {...field} />
              </FormControl>
              <FormDescription>
                Enter a URL for your profile picture.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}
