
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
  assigneeIds: string[];
  startDate: Date;
  endDate: Date;
  dependencies: string[];
  hours: number;
}

export interface Project {
  id: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
}

export const users: User[] = [];

export const projects: Project[] = [];

const today = new Date();

export const tasks: Task[] = [];
