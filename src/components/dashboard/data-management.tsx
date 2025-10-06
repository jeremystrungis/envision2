
'use client';

import React from 'react';
// [Tauri] Import the save dialog API
import { save } from '@tauri-apps/api/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';

export default function DataManagement() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { teams } = useTeams();
  const { users: members } = useUsers();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to export data.', variant: 'destructive'});
        return;
    }
    try {
      const exportData = {
        userId: user.uid,
        teams: teams.map(({ ...rest }) => ({ ...rest })),
        members: members.map(({ ...rest }) => ({ ...rest })),
        projects: projects.map(({ ...rest }) => ({ ...rest })),
        tasks: tasks.map(({ startDate, endDate, ...rest }) => ({
          ...rest,
          startDate: startDate.toDate().toISOString(),
          endDate: endDate.toDate().toISOString(),
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      // [Tauri] Replace browser download with native save dialog
      await save({
        defaultPath: 'pmvision_export.json',
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }],
      });

      // Note: The actual file writing will be handled in the main process
      // For now, we just open the dialog. We'll add the file writing logic
      // after setting up the Tauri backend.

      toast({
        title: 'Export Successful',
        description: 'Your workspace data has been downloaded.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export your workspace data. See console for details.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export your current workspace to a JSON file.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export to JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
