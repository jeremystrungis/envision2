
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Team, User, Project, Task } from '@/lib/firebase-types';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';

interface WorkspaceData {
    teams: Team[];
    members: User[];
    projects: Project[];
    tasks: Task[];
}

interface WorkspaceContextType {
  workspaceData: WorkspaceData | null;
  setWorkspaceData: (data: WorkspaceData | null) => void;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  
  // Fetch live data from Firestore hooks
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const { teams, loading: teamsLoading } = useTeams();
  const { users, loading: usersLoading } = useUsers();

  const loading = projectsLoading || tasksLoading || teamsLoading || usersLoading;

  // This effect synchronizes the live data with the workspace context for Dashboard 2
  useEffect(() => {
    // Only update if all data streams have loaded to prevent partial state
    if (!loading) {
      const liveData: WorkspaceData = {
        teams: teams,
        members: users,
        projects: projects,
        // Convert Firestore Timestamps to JS Dates for components
        tasks: tasks.map(task => ({
          ...task,
          startDate: task.startDate.toDate(),
          endDate: task.endDate.toDate(),
        })) as unknown as Task[],
      };
      setWorkspaceData(liveData);
    }
  }, [projects, tasks, teams, users, loading]);


  const value = { workspaceData, setWorkspaceData, loading };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
