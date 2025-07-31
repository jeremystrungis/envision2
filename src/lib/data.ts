import { subDays, addDays, isSameDay } from "date-fns";

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
  { id: 'user-1', name: 'Alice Johnson', team: 'System Planning', avatar: '/avatars/01.png', capacity: 8 }, // 2 tasks -> 4h/8h -> 50% -> Green
  { id: 'user-2', name: 'Bob Williams', team: 'Protection & Control', avatar: '/avatars/02.png', capacity: 8 }, // 5 tasks -> 10h/8h -> 125% -> Red
  { id: 'user-3', name: 'Charlie Brown', team: 'System Planning', avatar: '/avatars/03.png', capacity: 6 }, // 2 tasks -> 4h/6h -> 66% -> Green
  { id: 'user-4', name: 'Diana Miller', team: 'Substation Engineering', avatar: '/avatars/04.png', capacity: 8 }, // 3 tasks -> 6h/8h -> 75% -> Green
  { id: 'user-5', name: 'Ethan Garcia', team: 'Protection & Control', avatar: '/avatars/05.png', capacity: 8 }, // 4 tasks -> 8h/8h -> 100% -> Yellow
  { id: 'user-6', name: 'Fiona Davis', team: 'Transmission Line Design', avatar: '/avatars/06.png', capacity: 7 }, // 4 tasks -> 8h/7h -> 114% -> Orange
  { id: 'user-7', name: 'George Harris', team: 'Substation Engineering', avatar: '/avatars/07.png', capacity: 8 }, // 1 task -> 2h/8h -> 25% -> Blue
];

export const projects: Project[] = [
  { id: 'proj-1', name: 'Project Phoenix', status: 'On Track' },
  { id: 'proj-2', name: 'Project Titan', status: 'At Risk' },
  { id: 'proj-3', name: 'Project Nova', status: 'Off Track' },
];

const today = new Date();

export const tasks: Task[] = [
    // User 1 (Alice) - Green
    { id: 'task-1a', name: 'Feasibility Study', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-1b', name: 'Initial Scoping', projectId: 'proj-1', assigneeId: 'user-1', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: ['task-1a'] },

    // User 2 (Bob) - Red
    { id: 'task-2a', name: 'Relay Coordination Study', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 2), endDate: addDays(today, 1), dependencies: [] },
    { id: 'task-2b', name: 'Fault Analysis', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 1), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-2c', name: 'Protection Scheme Design', projectId: 'proj-2', assigneeId: 'user-2', startDate: today, endDate: addDays(today, 3), dependencies: ['task-2b'] },
    { id: 'task-2d', name: 'Emergency System Review', projectId: 'proj-3', assigneeId: 'user-2', startDate: today, endDate: addDays(today, 1), dependencies: [] },
    { id: 'task-2e', name: 'Critical Infrastructure Audit', projectId: 'proj-3', assigneeId: 'user-2', startDate: subDays(today, 1), endDate: addDays(today, 2), dependencies: [] },

    // User 3 (Charlie) - Green
    { id: 'task-3a', name: 'Load Flow Analysis', projectId: 'proj-1', assigneeId: 'user-3', startDate: today, endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-3b', name: 'Contingency Planning', projectId: 'proj-1', assigneeId: 'user-3', startDate: addDays(today, 1), endDate: addDays(today, 5), dependencies: [] },

    // User 4 (Diana) - Green
    { id: 'task-4a', name: 'Substation Layout Design', projectId: 'proj-2', assigneeId: 'user-4', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-4b', name: 'Equipment Specification', projectId: 'proj-2', assigneeId: 'user-4', startDate: today, endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-4c', name: 'Grounding System Design', projectId: 'proj-2', assigneeId: 'user-4', startDate: addDays(today, 1), endDate: addDays(today, 5), dependencies: [] },
    
    // User 5 (Ethan) - Yellow
    { id: 'task-5a', name: 'SCADA Integration', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 2), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-5b', name: 'HMI Screen Development', projectId: 'proj-3', assigneeId: 'user-5', startDate: subDays(today, 1), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-5c', name: 'Control Logic Programming', projectId: 'proj-3', assigneeId: 'user-5', startDate: today, endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-5d', name: 'Factory Acceptance Testing', projectId: 'proj-3', assigneeId: 'user-5', startDate: addDays(today, 1), endDate: addDays(today, 5), dependencies: [] },

    // User 6 (Fiona) - Orange
    { id: 'task-6a', name: 'Tower Spotting', projectId: 'proj-1', assigneeId: 'user-6', startDate: subDays(today, 1), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-6b', name: 'Conductor Sizing', projectId: 'proj-1', assigneeId: 'user-6', startDate: today, endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-6c', name: 'Structural Analysis', projectId: 'proj-1', assigneeId: 'user-6', startDate: addDays(today, 1), endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-6d', 'name': 'Right-of-Way Assessment', projectId: 'proj-1', assigneeId: 'user-6', startDate: subDays(today, 1), endDate: addDays(today, 1), dependencies: [] },

    // User 7 (George) - Blue
    { id: 'task-7a', name: 'Review Vendor Documents', projectId: 'proj-2', assigneeId: 'user-7', startDate: today, endDate: addDays(today, 3), dependencies: [] },
];


export const getOverloadedUsers = () => {
  const today = new Date();
  const allocation: Record<string, { count: number, tasks: string[] }> = {};
  users.forEach(u => allocation[u.id] = { count: 0, tasks: [] });

  tasks.forEach(task => {
    if (task.assigneeId && isSameDay(today, task.startDate) <= true && isSameDay(today, task.endDate) >= true) {
      allocation[task.assigneeId].count += 2; // Assume each task is 2hr/day
    }
  });

  return users.filter(user => (allocation[user.id]?.count || 0) > user.capacity);
};
