
import { subDays, addDays, isWithinInterval } from "date-fns";

export interface User {
  id: string;
  name: string;
  team: 'System Planning' | 'Protection & Control' | 'Substation Engineering' | 'Transmission Line Design';
  avatar: string;
  capacity: number; // hours per day
}

export interface Task {
  id:string;
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
    // Project 1 - Substation Engineering - User 4 (Diana, 8h) & User 7 (George, 8h)
    // Goal: Show green, yellow, orange for Diana & George
    { id: 'task-p1-1', name: 'General Arrangement Drawings', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 10), endDate: addDays(today, 2), dependencies: [] }, // Diana: 2h
    { id: 'task-p1-2', name: 'Major Equipment Specification', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 8), endDate: addDays(today, 4), dependencies: ['task-p1-1'] }, // George: 2h
    { id: 'task-p1-3', name: 'Control House Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 1), endDate: addDays(today, 9), dependencies: ['task-p1-1'] }, // Diana: 2h -> 4h total
    { id: 'task-p1-3a', name: 'AC/DC Panel Schematics', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 1), endDate: addDays(today, 9), dependencies: ['task-p1-1'] }, // Diana: 2h -> 6h total (Green)
    { id: 'task-p1-3b', name: 'Bill of Materials', projectId: 'proj-1', assigneeId: 'user-4', startDate: subDays(today, 1), endDate: addDays(today, 9), dependencies: ['task-p1-1'] }, // Diana: 2h -> 8h total (Yellow)
    { id: 'task-p1-4', name: 'Grounding Grid Design', projectId: 'proj-1', assigneeId: 'user-7', startDate: addDays(today, 2), endDate: addDays(today, 12), dependencies: ['task-p1-2'] }, // George: 2h -> 4h total
    { id: 'task-p1-4a', name: 'Lightning Protection Study', projectId: 'proj-1', assigneeId: 'user-7', startDate: addDays(today, 2), endDate: addDays(today, 12), dependencies: ['task-p1-2'] }, // George: 2h -> 6h total (Green)
    { id: 'task-p1-5', name: 'Structural Steel Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 6), endDate: addDays(today, 18), dependencies: ['task-p1-3'] },// Diana: 2h
    { id: 'task-p1-6', name: 'Insulation Coordination Study', projectId: 'proj-1', assigneeId: 'user-7', startDate: addDays(today, 1), endDate: addDays(today, 6), dependencies: ['task-p1-2'] }, // George: 2h

    // Project 2 - Protection & Control - User 2 (Bob, 8h) & User 5 (Ethan, 8h)
    // Goal: Show red/orange for Bob, blue/green for Ethan
    { id: 'task-p2-1', name: 'One-Line Diagrams', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] }, // Bob: 2h
    { id: 'task-p2-1a', name: 'Three-Line Diagrams', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] }, // Bob: 2h -> 4h
    { id: 'task-p2-1b', name: 'Protection & Control Schematics', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] }, // Bob: 2h -> 6h
    { id: 'task-p2-1c', name: 'Panel Layout Drawings', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] }, // Bob: 2h -> 8h (Yellow)
    { id: 'task-p2-1d', name: 'Control Logic Diagrams', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 2), endDate: addDays(today, 8), dependencies: ['task-p2-1'] }, // Bob: 2h -> 10h (Orange/Red)
    
    { id: 'task-p2-2', name: 'Relay Setting Development', projectId: 'proj-2', assigneeId: 'user-5', startDate: subDays(today, 2), endDate: addDays(today, 8), dependencies: ['task-p2-1'] }, // Ethan: 2h (Blue)
    { id: 'task-p2-3', name: 'SCADA & Communications Design', projectId: 'proj-2', assigneeId: 'user-2', startDate: addDays(today, 1), endDate: addDays(today, 12), dependencies: ['task-p2-1'] }, // Bob: 2h -> 12h (Red)
    { id: 'task-p2-4', name: 'FAT/SAT Support', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 9), endDate: addDays(today, 20), dependencies: ['task-p2-2', 'task-p2-3'] }, // Ethan: 2h (Blue)
    { id: 'task-p2-5', name: 'Panel Wiring Diagrams', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 2), endDate: addDays(today, 9), dependencies: ['task-p2-1'] }, // Ethan: 2h -> 4h (Green)
    
    // Project 3 - System Planning (User 1, Alice, 8h; User 3, Charlie, 6h), Trans. Line (User 6, Fiona, 7h)
    // Goal: Show blue for Alice, green for Charlie, orange/yellow for Fiona
    { id: 'task-p3-1', name: 'Load Flow Analysis', projectId: 'proj-3', assigneeId: 'user-1', startDate: subDays(today, 12), endDate: subDays(today, 2), dependencies: [] }, // Alice: 2h (Blue)
    { id: 'task-p3-2', name: 'Short Circuit Study', projectId: 'proj-3', assigneeId: 'user-3', startDate: subDays(today, 8), endDate: addDays(today, 2), dependencies: ['task-p3-1'] }, // Charlie: 2h
    { id: 'task-p3-2a', name: 'Coordination Study', projectId: 'proj-3', assigneeId: 'user-3', startDate: subDays(today, 8), endDate: addDays(today, 2), dependencies: ['task-p3-1'] }, // Charlie: 2h -> 4h (Green)
    { id: 'task-p3-3', name: 'Transient Stability Analysis', projectId: 'proj-3', assigneeId: 'user-1', startDate: subDays(today, 1), endDate: addDays(today, 10), dependencies: ['task-p3-2'] }, // Alice: 2h (Blue)
    
    { id: 'task-p3-4', name: 'Tower Spotting & Optimization', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 5), endDate: addDays(today, 4), dependencies: [] }, // Fiona: 2h
    { id: 'task-p3-4a', name: 'PLS-CADD Modeling', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 5), endDate: addDays(today, 4), dependencies: [] }, // Fiona: 2h -> 4h
    { id: 'task-p3-4b', name: 'Structure Loading Trees', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 5), endDate: addDays(today, 4), dependencies: [] }, // Fiona: 2h -> 6h (Green/Yellow)
    
    { id: 'task-p3-5', name: 'Foundation Design', projectId: 'proj-3', assigneeId: 'user-6', startDate: addDays(today, 5), endDate: addDays(today, 15), dependencies: ['task-p3-4'] }, // Fiona: 2h
    { id: 'task-p3-6', name: 'Conductor & Shield Wire Sizing', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 1), endDate: addDays(today, 6), dependencies: ['task-p3-4'] },// Fiona: 2h -> 8h (Orange)
    { id: 'task-p3-7', name: 'Permitting Support', projectId: 'proj-3', assigneeId: 'user-1', startDate: addDays(today, 1), endDate: addDays(today, 14), dependencies: ['task-p3-3'] }, // Alice: 2h -> 4h (Green)
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
