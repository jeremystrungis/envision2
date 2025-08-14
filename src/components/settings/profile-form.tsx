
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
import { useUsers } from '@/hooks/use-users'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { User } from 'lucide-react'
import { useEffect } from 'react'

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
  const { users, updateUser } = useUsers();
  const { toast } = useToast();

  const currentUser = users[0];

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      avatar: '',
    },
    mode: 'onChange',
  })
  
  useEffect(() => {
      if (currentUser) {
          form.reset({
              name: currentUser.name,
              avatar: currentUser.avatar,
          });
      }
  }, [currentUser, form])

  function onSubmit(data: ProfileFormValues) {
    if (!currentUser) return;
    
    const { team, capacity } = currentUser;
    updateUser(currentUser.id, { ...data, team, capacity });

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
                To manage profile settings, please first add a team member on the Teams page. The first member is considered "you".
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
                Enter a URL for your profile picture. You can use a service like Pravatar.
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
