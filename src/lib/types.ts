// This file defines the core data structures for the application.

export interface Team {
  id: string;
  name: string;
}

export interface User {
  id: string;
  authUid?: string;
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
  description: string;
  projectId: string;
  assignments: Assignment[];
  startDate: string; // ISO 8601 date string
  endDate: string;   // ISO 8601 date string
  dependencies: string[];
  hours: number;
  status: 'Todo' | 'In Progress' | 'Done';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO 8601 date string
  endDate: string;   // ISO 8601 date string
  status: 'On Track' | 'At Risk' | 'Off Track';
}
