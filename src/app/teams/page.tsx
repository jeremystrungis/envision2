
'use client';

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/lib/firebase-types';
import { useUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import EditMemberDialog from '@/components/teams/edit-member-dialog';
import AddMemberDialog from '@/components/teams/add-member-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { users, addUser, updateUser } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditMemberOpen(true);
  };

  const handleUpdateUser = (updatedUser: Omit<User, 'id'>) => {
    if (selectedUser) {
      updateUser(selectedUser.id, updatedUser);
    }
    setIsEditMemberOpen(false);
    setSelectedUser(null);
  };
  
  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    addUser(newUser);
    setIsAddMemberOpen(false);
  }
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>Manage your team members. The first member is considered "Me".</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddMemberOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Member
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Daily Capacity</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none flex items-center gap-2">
                              {user.name}
                              {index === 0 && <Badge variant="secondary">(Me)</Badge>}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.team}</Badge>
                      </TableCell>
                      <TableCell>{user.capacity}h</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
       <AddMemberDialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddUser={handleAddUser}
       />
      {selectedUser && (
        <EditMemberDialog
            isOpen={isEditMemberOpen}
            onClose={() => {
                setIsEditMemberOpen(false);
                setSelectedUser(null);
            }}
            onUpdateUser={handleUpdateUser}
            user={selectedUser}
        />
      )}
    </div>
  );
}
