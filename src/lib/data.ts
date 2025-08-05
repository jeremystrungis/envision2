
import { subDays, addDays, isWithinInterval, startOfWeek, endOfWeek, isSameDay } from "date-fns";

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
  { id: 'proj-1', name: 'Substation Expansion', status: 'On Track' },
  { id: 'proj-2', name: 'New Transmission Line', status: 'At Risk' },
  { id: 'proj-3', name: 'Protection System Upgrade', status: 'Off Track' },
];

const today = new Date();

export const tasks: Task[] = [
    // Project 1: Substation Expansion
    // George Harris (user-7) is overloaded in week 1.
    { id: 'task-p1-1', name: 'General Arrangement Drawings', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 10), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-p1-2', name: 'Major Equipment Specification', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 8), endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-p1-7', name: 'Bus Design & Layout', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 7), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-p1-8', name: 'Conduit & Trench Plan', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 6), endDate: addDays(today, 1), dependencies: [] },
    { id: 'task-p1-9', name: 'Cable Schedule Creation', projectId: 'proj-1', assigneeId: 'user-7', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] },

    // Diana Miller (user-4) is overloaded in week 2.
    { id: 'task-p1-3', name: 'Control House Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 7), endDate: addDays(today, 13), dependencies: ['task-p1-1'] },
    { id: 'task-p1-4', name: 'Grounding Grid Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 8), endDate: addDays(today, 15), dependencies: ['task-p1-2'] },
    { id: 'task-p1-5', name: 'Structural Steel Design', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 9), endDate: addDays(today, 14), dependencies: ['task-p1-3'] },
    { id: 'task-p1-6', name: 'Insulation Coordination Study', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 10), endDate: addDays(today, 16), dependencies: ['task-p1-4'] },
    { id: 'task-p1-10', name: 'Lightning Protection Plan', projectId: 'proj-1', assigneeId: 'user-4', startDate: addDays(today, 11), endDate: addDays(today, 17), dependencies: [] },


    // Project 2: New Transmission Line
    // Bob Williams (user-2) is overloaded in week 1
    { id: 'task-p2-1', name: 'One-Line & Three-Line Diagrams', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 5), dependencies: [] },
    { id: 'task-p2-2', name: 'Protection & Control Schematics', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 5), endDate: addDays(today, 8), dependencies: [] },
    { id: 'task-p2-7', name: 'Bill of Materials', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 4), endDate: addDays(today, 3), dependencies: [] },
    { id: 'task-p2-8', name: 'Relay Panel Front Views', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 3), endDate: addDays(today, 4), dependencies: [] },
    { id: 'task-p2-9', name: 'Network Connection Diagrams', projectId: 'proj-2', assigneeId: 'user-2', startDate: subDays(today, 2), endDate: addDays(today, 6), dependencies: [] },

    // Ethan Garcia (user-5) is overloaded in week 3
    { id: 'task-p2-3', name: 'Panel Layout & Wiring Diagrams', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 14), endDate: addDays(today, 20), dependencies: ['task-p2-1'] },
    { id: 'task-p2-4', name: 'Control Logic Diagrams', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 15), endDate: addDays(today, 21), dependencies: ['task-p2-2'] },
    { id: 'task-p2-5', name: 'Relay Setting Development', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 16), endDate: addDays(today, 22), dependencies: ['task-p2-3'] },
    { id: 'task-p2-6', name: 'SCADA & Communications Design', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 17), endDate: addDays(today, 23), dependencies: ['task-p2-4'] },
    { id: 'task-p2-10', name: 'RTU Point List', projectId: 'proj-2', assigneeId: 'user-5', startDate: addDays(today, 18), endDate: addDays(today, 24), dependencies: [] },

    // Project 3: Protection System Upgrade
    // Alice (user-1) & Charlie (user-3) have normal workloads
    { id: 'task-p3-1', name: 'Load Flow & Short Circuit Study', projectId: 'proj-3', assigneeId: 'user-1', startDate: subDays(today, 12), endDate: subDays(today, 2), dependencies: [] },
    { id: 'task-p3-2', name: 'Coordination Study', projectId: 'proj-3', assigneeId: 'user-3', startDate: subDays(today, 8), endDate: addDays(today, 2), dependencies: [] },
    { id: 'task-p3-3', name: 'Transient Stability Analysis', projectId: 'proj-3', assigneeId: 'user-1', startDate: addDays(today, 4), endDate: addDays(today, 14), dependencies: ['task-p3-1'] },
    
    // Fiona Davis (user-6) has a slightly high workload
    { id: 'task-p3-4', name: 'Tower Spotting & PLS-CADD', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 5), endDate: addDays(today, 6), dependencies: [] },
    { id: 'task-p3-6', name: 'Foundation Design', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 3), endDate: addDays(today, 8), dependencies: ['task-p3-4'] },
    { id: 'task-p3-9', name: 'Access Road Design', projectId: 'proj-3', assigneeId: 'user-6', startDate: subDays(today, 4), endDate: addDays(today, 4), dependencies: [] },
    
    { id: 'task-p3-5', name: 'Structure Loading Trees', projectId: 'proj-3', assigneeId: 'user-3', startDate: addDays(today, 3), endDate: addDays(today, 13), dependencies: ['task-p3-2'] },
    { id: 'task-p3-7', name: 'Conductor & Shield Wire Sizing', projectId: 'proj-3', assigneeId: 'user-1', startDate: addDays(today, 15), endDate: addDays(today, 25), dependencies: ['task-p3-3'] },
    { id: 'task-p3-8', name: 'Fiber Optic Splice Plan', projectId: 'proj-3', assigneeId: 'user-3', startDate: addDays(today, 14), endDate: addDays(today, 24), dependencies: [] },
];
