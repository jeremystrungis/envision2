
import { subDays, addDays, isWithinInterval } from "date-fns";

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
    // Week 1 (Past)
    { id: 'task-w1-1', name: 'Week 1 - Feasibility Study', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 14), endDate: subDays(today, 10), dependencies: [] },
    { id: 'task-w1-2', name: 'Week 1 - Initial Scoping', projectId: 'proj-1', assigneeId: 'user-2', startDate: subDays(today, 13), endDate: subDays(today, 11), dependencies: [] },
    { id: 'task-w1-3', name: 'Week 1 - DB Setup', projectId: 'proj-2', assigneeId: 'user-5', startDate: subDays(today, 12), endDate: subDays(today, 8), dependencies: [] },

    // Week 2 (Current Week)
    { id: 'task-w2-1', name: 'Current Week - API Dev', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 4), endDate: addDays(today, 2), dependencies: ['task-w1-3'] },
    { id: 'task-w2-2', name: 'Current Week - UI Mockups', projectId: 'proj-1', assigneeId: 'user-3', startDate: subDays(today, 3), endDate: addDays(today, 1), dependencies: ['task-w1-2'] },
    { id: 'task-w2-3', name: 'Current Week - Overload Task 1', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w2-4', name: 'Current Week - Overload Task 2', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w2-5', name: 'Current Week - Overload Task 3', projectId: 'proj-2', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-w2-6', name: 'Current Week - High Load', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-w2-7', name: 'Current Week - High Load 2', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-w2-8', name: 'Current Week - High Load 3', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-w2-9', name: 'Current Week - Critical Overload', projectId: 'proj-3', assigneeId: 'user-2', startDate: subDays(today, 3), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-w2-10', name: 'Current Week - Good Load', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },

    // Week 3 (Future)
    { id: 'task-w3-1', name: 'Next Week - UI Components', projectId: 'proj-1', assigneeId: 'user-1', startDate: addDays(today, 7), endDate: addDays(today, 11), dependencies: ['task-w2-2'] },
    { id: 'task-w3-2', name: 'Next Week - E2E Tests', projectId: 'proj-3', assigneeId: 'user-7', startDate: addDays(today, 6), endDate: addDays(today, 10), dependencies: [] },
    { id: 'task-w3-3', name: 'Next Week - Light Load', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 8), endDate: addDays(today, 9), dependencies: [] },
    { id: 'task-w3-4', name: 'Next Week - UAT', projectId: 'proj-3', assigneeId: null, startDate: addDays(today, 12), endDate: addDays(today, 14), dependencies: [] },
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
