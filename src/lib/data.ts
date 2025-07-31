
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
  { id: 'user-1', name: 'Alice Johnson', team: 'System Planning', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', capacity: 8 }, // 2 tasks -> 4h/8h -> 50% -> Green
  { id: 'user-2', name: 'Bob Williams', team: 'Protection & Control', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', capacity: 8 }, // 5 tasks -> 10h/8h -> 125% -> Red
  { id: 'user-3', name: 'Charlie Brown', team: 'System Planning', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', capacity: 6 }, // 2 tasks -> 4h/6h -> 66% -> Green
  { id: 'user-4', name: 'Diana Miller', team: 'Substation Engineering', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', capacity: 8 }, // 3 tasks -> 6h/8h -> 75% -> Green
  { id: 'user-5', name: 'Ethan Garcia', team: 'Protection & Control', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704b', capacity: 8 }, // 4 tasks -> 8h/8h -> 100% -> Yellow
  { id: 'user-6', name: 'Fiona Davis', team: 'Transmission Line Design', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704c', capacity: 7 }, // 4 tasks -> 8h/7h -> 114% -> Orange
  { id: 'user-7', name: 'George Harris', team: 'Substation Engineering', avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267041', capacity: 8 }, // 1 task -> 2h/8h -> 25% -> Blue
];

export const projects: Project[] = [
  { id: 'proj-1', name: 'Project Phoenix', status: 'On Track' },
  { id: 'proj-2', name: 'Project Titan', status: 'At Risk' },
  { id: 'proj-3', name: 'Project Nova', status: 'Off Track' },
];

const today = new Date();

export const tasks: Task[] = [
    // Project 1
    { id: 'task-1', name: 'Feasibility Study', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 10), endDate: subDays(today, 5), dependencies: [] },
    { id: 'task-2', name: 'Initial Scoping', projectId: 'proj-1', assigneeId: 'user-3', startDate: subDays(today, 4), endDate: addDays(today, 1), dependencies: ['task-1'] },
    { id: 'task-3', name: 'Design UI/UX Mockups', projectId: 'proj-1', assigneeId: 'user-1', startDate: addDays(today, 2), endDate: addDays(today, 7), dependencies: ['task-2'] },
    { id: 'task-4', name: 'Develop UI Components', projectId: 'proj-1', assigneeId: 'user-6', startDate: addDays(today, 8), endDate: addDays(today, 15), dependencies: ['task-3'] },

    // Project 2
    { id: 'task-5', name: 'Setup Database', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 8), endDate: subDays(today, 4), dependencies: [] },
    { id: 'task-6', name: 'Develop Authentication API', projectId: 'proj-2', assigneeId: 'user-5', startDate: subDays(today, 3), endDate: addDays(today, 3), dependencies: ['task-5'] },
    { id: 'task-7', name: 'Integrate Frontend with API', projectId: 'proj-2', assigneeId: 'user-4', startDate: addDays(today, 4), endDate: addDays(today, 10), dependencies: ['task-6', 'task-4'] },

    // Project 3
    { id: 'task-8', name: 'Setup CI/CD Pipeline', projectId: 'proj-3', assigneeId: 'user-7', startDate: subDays(today, 2), endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-9', name: 'Write E2E Tests', projectId: 'proj-3', assigneeId: 'user-2', startDate: addDays(today, 5), endDate: addDays(today, 12), dependencies: ['task-7', 'task-8'] },
    { id: 'task-10', name: 'User Acceptance Testing', projectId: 'proj-3', assigneeId: null, startDate: addDays(today, 13), endDate: addDays(today, 18), dependencies: ['task-9'] },
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

    