
import { subDays, addDays, isWithinInterval, isSameDay } from "date-fns";

export interface User {
  id: string;
  name: string;
  team: 'System Planning' | 'Protection & Control' | 'Substation Engineering' | 'Transmission Line Design';
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
  { id: 'user-1', name: 'Alice Johnson', team: 'System Planning', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', capacity: 8 },
  { id: 'user-2', name: 'Bob Williams', team: 'Protection & Control', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', capacity: 8 },
  { id: 'user-3', name: 'Charlie Brown', team: 'System Planning', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', capacity: 6 },
  { id: 'user-4', name: 'Diana Miller', team: 'Substation Engineering', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', capacity: 8 },
  { id: 'user-5', name: 'Ethan Garcia', team: 'Protection & Control', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704b', capacity: 8 },
  { id: 'user-6', name: 'Fiona Davis', team: 'Transmission Line Design', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704c', capacity: 7 },
  { id: 'user-7', name: 'George Harris', team: 'Substation Engineering', avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267041', capacity: 8 },
];

export const projects: Project[] = [
  { id: 'proj-1', name: 'Project Phoenix', status: 'On Track' },
  { id: 'proj-2', name: 'Project Titan', status: 'At Risk' },
  { id: 'proj-3', name: 'Project Nova', status: 'Off Track' },
];

const today = new Date();

// Spanning tasks across 3 weeks to show varied workload
export const tasks: Task[] = [
    // Past Week
    { id: 'task-w0-1', name: 'Feasibility Study', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 10), endDate: subDays(today, 7), dependencies: [] },
    { id: 'task-w0-2', name: 'Initial Scoping', projectId: 'proj-1', assigneeId: 'user-2', startDate: subDays(today, 9), endDate: subDays(today, 6), dependencies: [] },

    // Current Week (to create varied loads)
    // User 1 (Alice) - Good
    { id: 'task-w1-1', name: 'API Dev', projectId: 'proj-2', assigneeId: 'user-1', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-2', name: 'UI Mockups', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },
    
    // User 2 (Bob) - High
    { id: 'task-w1-3', name: 'DB Setup', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 3), endDate: addDays(today, 1), dependencies: [] },
    { id: 'task-w1-4', name: 'Backend Logic', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-5', name: 'Security Audit', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 1), endDate: addDays(today, 0), dependencies: [] },
    { id: 'task-w1-15', name: 'Documentation', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 0), endDate: addDays(today, 3), dependencies: [] },

    // User 3 (Charlie) - Light
    { id: 'task-w1-6', name: 'Code Review', projectId: 'proj-1', assigneeId: 'user-3', startDate: subDays(today, 0), endDate: addDays(today, 1), dependencies: [] },

    // User 4 (Diana) - Good
     { id: 'task-w1-7', name: 'Substation Design', projectId: 'proj-3', assigneeId: 'user-4', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
     { id: 'task-w1-8', name: 'Material Procurement', projectId: 'proj-3', assigneeId: 'user-4', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },

    // User 5 (Ethan) - Overloaded
    { id: 'task-w1-9', name: 'Control System Logic', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 3), endDate: addDays(today, 1), dependencies: [] },
    { id: 'task-w1-10', name: 'P&C Schematics', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-11', name: 'Relay Settings', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-16', name: 'FAT Support', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 0), endDate: addDays(today, 1), dependencies: [] },

    // User 6 (Fiona) - Critically Overloaded
    { id: 'task-w1-12', name: 'Transmission Line Analysis', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-13', name: 'Tower Spotting', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-14', name: 'Foundation Design', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-17', name: 'Conductor Selection', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w1-18', name: 'Insulator Config', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 1), endDate: addDays(today, 1), dependencies: [] },

    // Next Week
    { id: 'task-w2-1', name: 'UI Components', projectId: 'proj-1', assigneeId: 'user-1', startDate: addDays(today, 7), endDate: addDays(today, 11), dependencies: [] },
    { id: 'task-w2-2', name: 'E2E Tests', projectId: 'proj-3', assigneeId: 'user-7', startDate: addDays(today, 6), endDate: addDays(today, 10), dependencies: [] },
    { id: 'task-w2-3', name: 'UAT', projectId: 'proj-3', assigneeId: null, startDate: addDays(today, 12), endDate: addDays(today, 14), dependencies: [] },

];

export const getOverloadedUsers = () => {
  const today = new Date();
  const allocation: Record<string, { count: number, tasks: string[] }> = {};
  users.forEach(u => allocation[u.id] = { count: 0, tasks: [] });

  tasks.forEach(task => {
    if (task.assigneeId && isWithinInterval(today, { start: task.startDate, end: task.endDate })) {
      allocation[task.assigneeId].count += 2; // Assume each task is 2hr/day
    }
  });

  return users.filter(user => (allocation[user.id]?.count || 0) > user.capacity);
};
