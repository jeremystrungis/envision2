
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
  
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const { teams, loading: teamsLoading } = useTeams();
  const { users, loading: usersLoading } = useUsers();

  const loading = projectsLoading || tasksLoading || teamsLoading || usersLoading;

  useEffect(() => {
    // Only perform automatic sync if all hooks are done loading
    if (!loading) {
      // Construct the full live dataset
      const liveData: WorkspaceData = {
        teams,
        members: users,
        projects,
        tasks: tasks.map(t => ({
          ...t,
          startDate: t.startDate.toDate ? t.startDate.toDate() : new Date(t.startDate),
          endDate: t.endDate.toDate ? t.endDate.toDate() : new Date(t.endDate),
        })) as any[],
      };
      
      setWorkspaceData(currentData => {
        if (!currentData) {
          // If there's no data in the context, initialize it with the live data.
          return liveData;
        }

        // If there IS data, merge the live data into it.
        // This creates an additive effect, preserving manually loaded data
        // while adding any new items from the live database.
        const newTeams = [...currentData.teams];
        liveData.teams.forEach(liveTeam => {
          if (!newTeams.some(t => t.id === liveTeam.id)) {
            newTeams.push(liveTeam);
          }
        });
        
        const newMembers = [...currentData.members];
        liveData.members.forEach(liveMember => {
          if (!newMembers.some(m => m.id === liveMember.id)) {
            newMembers.push(liveMember);
          }
        });

        const newProjects = [...currentData.projects];
        liveData.projects.forEach(liveProject => {
          if (!newProjects.some(p => p.id === liveProject.id)) {
            newProjects.push(liveProject);
          }
        });

        const newTasks = [...currentData.tasks];
        liveData.tasks.forEach(liveTask => {
          if (!newTasks.some(t => t.id === liveTask.id)) {
            newTasks.push(liveTask);
          }
        });
        
        return {
          teams: newTeams,
          members: newMembers,
          projects: newProjects,
          tasks: newTasks,
        };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, tasks, teams, users]); // Rerun whenever live data changes

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

