import { subDays, addDays } from "date-fns";

export interface User {
  id: string;
  name: string;
  team: 'Frontend' | 'Backend' | 'DevOps' | 'QA';
  avatar: string;
  capacity: number; // hours per day
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  assigneeId: string | null;
  startDate: Date;
  endDate: Date;
  dependencies: string[];
}

export interface Project {
  id: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
}

export const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', team: 'Frontend', avatar: '/avatars/01.png', capacity: 8 },
  { id: 'user-2', name: 'Bob Williams', team: 'Backend', avatar: '/avatars/02.png', capacity: 8 },
  { id: 'user-3', name: 'Charlie Brown', team: 'Frontend', avatar: '/avatars/03.png', capacity: 6 },
  { id: 'user-4', name: 'Diana Miller', team: 'DevOps', avatar: '/avatars/04.png', capacity: 8 },
  { id: 'user-5', name: 'Ethan Garcia', team: 'Backend', avatar: '/avatars/05.png', capacity: 8 },
  { id: 'user-6', name: 'Fiona Davis', team: 'QA', avatar: '/avatars/06.png', capacity: 8 },
];

export const projects: Project[] = [
  { id: 'proj-1', name: 'Project Phoenix', status: 'On Track' },
  { id: 'proj-2', name: 'Project Titan', status: 'At Risk' },
  { id: 'proj-3', name: 'Project Nova', status: 'Off Track' },
];

const today = new Date();

export const tasks: Task[] = [
  // Project Phoenix
  { id: 'task-1', name: 'Design UI/UX Mockups', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 10), endDate: subDays(today, 5), dependencies: [] },
  { id: 'task-2', name: 'Develop UI Components', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 4), endDate: addDays(today, 2), dependencies: ['task-1'] },
  { id: 'task-3', name: 'Setup CI/CD Pipeline', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 9), endDate: subDays(today, 6), dependencies: [] },
  { id: 'task-4', name: 'Develop Authentication API', projectId: 'proj-1', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: today, dependencies: [] },
  { id: 'task-5', name: 'Integrate Frontend with API', projectId: 'proj-1', assigneeId: 'user-3', startDate: addDays(today, 1), endDate: addDays(today, 5), dependencies: ['task-2', 'task-4'] },
  { id: 'task-6', name: 'Write E2E Tests', projectId: 'proj-1', assigneeId: 'user-6', startDate: addDays(today, 6), endDate: addDays(today, 10), dependencies: ['task-5'] },

  // Project Titan
  { id: 'task-7', name: 'Database Schema Design', projectId: 'proj-2', assigneeId: 'user-5', startDate: subDays(today, 15), endDate: subDays(today, 10), dependencies: [] },
  { id: 'task-8', name: 'Build Core Backend Logic', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 9), endDate: addDays(today, 3), dependencies: ['task-7'] },
  { id: 'task-9', name: 'Deploy Staging Environment', projectId: 'proj-2', assigneeId: 'user-4', startDate: subDays(today, 8), endDate: subDays(today, 4), dependencies: [] },
  { id: 'task-10', name: 'Frontend Scaffolding', projectId: 'proj-2', assigneeId: 'user-1', startDate: subDays(today, 3), endDate: addDays(today, 4), dependencies: [] },
  { id: 'task-11', name: 'Performance Testing', projectId: 'proj-2', assigneeId: 'user-6', startDate: addDays(today, 4), endDate: addDays(today, 8), dependencies: ['task-8'] },

  // Project Nova
  { id: 'task-12', name: 'Third-party API Integration', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] },
  { id: 'task-13', name: 'Urgent Security Patch', projectId: 'proj-3', assigneeId: 'user-2', startDate: subDays(today, 1), endDate: addDays(today, 1), dependencies: [] },
  { id: 'task-14', name: 'Client-side Feature Refactor', projectId: 'proj-3', assigneeId: 'user-3', startDate: today, endDate: addDays(today, 8), dependencies: [] },
];

export const getOverloadedUsers = () => {
  const allocation: Record<string, number> = {};
  users.forEach(u => allocation[u.id] = 0);
  
  tasks.forEach(task => {
    if (task.assigneeId) {
      allocation[task.assigneeId] = (allocation[task.assigneeId] || 0) + 2; // Assume each task is 2hr/day
    }
  });

  return users.filter(user => allocation[user.id] > user.capacity);
};
