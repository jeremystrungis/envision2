
'use client';

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Team } from '@/lib/firebase-types';
import { useUsers } from '@/hooks/use-users';
import { useTeams } from '@/hooks/use-teams';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import EditMemberDialog from '@/components/teams/edit-member-dialog';
import AddMemberDialog from '@/components/teams/add-member-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import AddTeamDialog from '@/components/teams/add-team-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function ManageTeamsCard() {
  const { teams, addTeam, deleteTeam } = useTeams();
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Teams</CardTitle>
              <CardDescription>Add, or remove team names available for assignment.</CardDescription>
            </div>
            <Button onClick={() => setIsAddTeamOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {teams.length > 0 ? (
              teams.map((team) => (
                <AlertDialog key={team.id}>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Badge variant="outline" className="text-lg py-1 px-4 cursor-pointer hover:bg-muted">
                            {team.name}
                        </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>{team.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Team
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the "{team.name}" team. This action cannot be undone and may affect existing team member assignments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTeam(team.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
               </AlertDialog>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No teams created yet. Add a new team to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <AddTeamDialog
        isOpen={isAddTeamOpen}
        onClose={() => setIsAddTeamOpen(false)}
        onAddTeam={(name) => {
          addTeam({ name });
          setIsAddTeamOpen(false);
        }}
      />
    </>
  );
}


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
        <main className="flex-1 p-6 space-y-6">
          <ManageTeamsCard />
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>Manage your team members and their assigned teams.</CardDescription>
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
                    <TableHead>Team(s)</TableHead>
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
                        <div className="flex flex-wrap gap-1">
                          {user.teams && user.teams.length > 0 ? (
                            user.teams.map(teamName => (
                                <Badge key={teamName} variant="outline">{teamName}</Badge>
                            ))
                          ) : (
                            <Badge variant="secondary">Unassigned</Badge>
                          )}
                        </div>
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
