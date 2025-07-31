
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

export const tasks: Task[] = [
    // Project 1
    { id: 'task-p1-1', name: 'General Arrangement Drawings', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 10), endDate: subDays(today, 2), dependencies: [] },
    { id: 'task-p1-2', name: 'Major Equipment Specification', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 8), endDate: addDays(today, 1), dependencies: ['task-p1-1'] },
    { id: 'task-p1-3', name: 'Control House Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 1), endDate: addDays(today, 5), dependencies: ['task-p1-1'] },
    { id: 'task-p1-4', name: 'Grounding Grid Design', projectId: 'proj-1', assigneeId: 'user-7', startDate: addDays(today, 2), endDate: addDays(today, 8), dependencies: ['task-p1-2'] },
    { id: 'task-p1-5', name: 'Structural Steel Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 6), endDate: addDays(today, 15), dependencies: ['task-p1-3'] },

    // Project 2
    { id: 'task-p2-1', name: 'Protection & Control Schematics', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] },
    { id: 'task-p2-2', name: 'Relay Setting Development', projectId: 'proj-2', assigneeId: 'user-5', startDate: subDays(today, 2), endDate: addDays(today, 8), dependencies: ['task-p2-1'] },
    { id: 'task-p2-3', name: 'SCADA & Communications Design', projectId: 'proj-2', assigneeId: 'user-2', startDate: addDays(today, 6), endDate: addDays(today, 12), dependencies: ['task-p2-1'] },
    { id: 'task-p2-4', name: 'FAT/SAT Support', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 13), endDate: addDays(today, 20), dependencies: ['task-p2-2', 'task-p2-3'] },

    // Project 3
    { id: 'task-p3-1', name: 'Site Selection & Survey', projectId: 'proj-3', assigneeId: 'user-1', startDate: subDays(today, 12), endDate: subDays(today, 5), dependencies: [] },
    { id: 'task-p3-2', name: 'Geotechnical Investigation', projectId: 'proj-3', assigneeId: 'user-3', startDate: subDays(today, 4), endDate: addDays(today, 2), dependencies: ['task-p3-1'] },
    { id: 'task-p3-3', name: 'Permitting Support', projectId: 'proj-3', assigneeId: 'user-1', startDate: addDays(today, 3), endDate: addDays(today, 10), dependencies: ['task-p3-2'] },
    { id: 'task-p3-4', name: 'Bill of Materials (BOM) Creation', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 2), endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-p3-5', name: 'Vendor Drawing Review', projectId: 'proj-3', assigneeId: 'user-6', startDate: addDays(today, 5), endDate: addDays(today, 12), dependencies: ['task-p3-4'] },
    { id: 'task-p3-6', name: 'Construction Sequencing Plan', projectId: 'proj-3', assigneeId: null, startDate: addDays(today, 13), endDate: addDays(today, 18), dependencies: ['task-p3-5'] },
];


// Function to determine workload and return overloaded users
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
