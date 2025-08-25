
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Team, User, Project, Task } from '@/lib/firebase-types';

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
  
  // For Dashboard 2, loading is determined by the component itself,
  // so we can set the context loading to false.
  const loading = false;

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
