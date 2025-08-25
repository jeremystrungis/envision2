
'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';
import { importWorkspaceData } from '@/ai/flows/import-workspace-flow';
import { useAuth } from '@/hooks/use-auth';

export default function DataManagement() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { teams } = useTeams();
  const { users: members } = useUsers(); // useUsers is the correct hook for members
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const exportData = {
        teams: teams.map(({ ...rest }) => rest),
        members: members.map(member => ({ ...member })), // Keep all member data, including ID
        projects: projects.map(project => ({ ...project })), // Keep all project data, including ID
        tasks: tasks.map(({ startDate, endDate, ...rest }) => ({
          ...rest,
          startDate: startDate.toDate().toISOString(),
          endDate: endDate.toDate().toISOString(),
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pmvision_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('File content is not valid.');
        }
        const data = JSON.parse(content);

        // Basic validation can be done here before sending to the flow
        if (!data.teams || !data.members || !data.projects || !data.tasks) {
          throw new Error('Invalid JSON structure. Missing required fields.');
        }
        
        toast({ title: 'Importing Data...', description: 'Please wait while your data is being added.' });

        // Pass the user ID to the flow
        const result = await importWorkspaceData({ ...data, userId: user.uid });

        if (result.success) {
          toast({
            title: 'Import Successful',
            description: 'Your workspace data has been added successfully.',
          });
        } else {
           throw new Error('The import process failed on the server. Check logs.');
        }


      } catch (error: any) {
        console.error('Import failed:', error);
        toast({
          title: 'Import Failed',
          description: error.message || 'Could not import data from the file. Check server logs for details.',
          variant: 'destructive',
        });
      } finally {
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export your current workspace or import data from a JSON file.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import from JSON
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
