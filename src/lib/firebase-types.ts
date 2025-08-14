
import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  team: 'System Planning' | 'Protection & Control' | 'Substation Engineering' | 'Transmission Line Design';
  avatar: string;
  capacity: number; // hours per day
}

export interface Assignment {
  assigneeId: string;
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  effort: number; // Percentage of task hours
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  assignments: Assignment[];
  startDate: Timestamp;
  endDate: Timestamp;
  dependencies: string[];
  hours: number;
}

export interface Project {
  id: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
}
