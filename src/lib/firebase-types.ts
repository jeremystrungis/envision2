
import { Timestamp } from "firebase/firestore";

export interface Team {
  id: string;
  name: string;
}

export interface User {
  id: string;
  authUid?: string; // Firebase Auth User ID, to link member to a login
  name: string;
  teams: string[];
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
