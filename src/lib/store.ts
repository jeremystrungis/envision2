
'use client';

import { useState, useEffect } from 'react';
import { projects as initialProjects, tasks as initialTasks, users as initialUsers, Project, Task, User } from './data';
import { isWithinInterval, differenceInBusinessDays } from 'date-fns';

// In-memory store
let projects: Project[] = [...initialProjects];
let tasks: Task[] = [...initialTasks];
let users: User[] = [...initialUsers];

type Store = {
  projects: Project[];
  tasks: Task[];
  users: User[];
  getOverloadedUsers: () => User[];
}

let listeners: (() => void)[] = [];

const emitChange = () => {
  for (let listener of listeners) {
    listener();
  }
}

// Data access and modification functions
export const store = {
  getSnapshot: (): Store => {
    return {
      projects,
      tasks,
      users,
      getOverloadedUsers: () => {
        const today = new Date();
        const allocation: Record<string, { workHours: number }> = {};
        users.forEach(u => allocation[u.id] = { workHours: 0 });

        tasks.forEach(task => {
            if (isWithinInterval(today, { start: task.startDate, end: task.endDate })) {
                const taskDuration = differenceInBusinessDays(task.endDate, task.startDate) + 1;
                const dailyHours = task.hours / taskDuration;

                task.assigneeIds.forEach(assigneeId => {
                    if (allocation[assigneeId]) {
                        allocation[assigneeId].workHours += dailyHours;
                    }
                });
            }
        });

        return users.filter(user => (allocation[user.id]?.workHours || 0) > user.capacity);
      }
    };
  },
  
  subscribe: (listener: () => void): (() => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  addProject: (project: Omit<Project, 'id'>, newTasks: Omit<Task, 'id' | 'projectId' | 'dependencies'>[]) => {
    const newProject = { ...project, id: `proj-${Date.now()}` };
    projects = [...projects, newProject];
    
    const tasksToAdd: Task[] = newTasks
      .filter(task => task.name) // Only add tasks that have a name
      .map(task => ({
        ...task,
        id: `task-${Date.now()}-${Math.random()}`,
        projectId: newProject.id,
        dependencies: []
    }));

    tasks = [...tasks, ...tasksToAdd];
    emitChange();
  },

  updateProject: (projectId: string, updatedProject: Omit<Project, 'id'>) => {
    projects = projects.map(p => p.id === projectId ? { ...p, ...updatedProject } : p);
    emitChange();
  },

  addTask: (task: Omit<Task, 'id' | 'dependencies'>) => {
      const newTask: Task = { ...task, id: `task-${Date.now()}`, dependencies: [] };
      tasks = [...tasks, newTask];
      emitChange();
  },
  
  updateTask: (taskId: string, updatedTask: Omit<Task, 'id' | 'projectId' | 'dependencies'>) => {
    tasks = tasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t);
    emitChange();
  },

  deleteTask: (taskId: string) => {
    tasks = tasks.filter(t => t.id !== taskId);
    // Also remove any dependencies on this task
    tasks = tasks.map(t => ({ ...t, dependencies: t.dependencies.filter(depId => depId !== taskId) }));
    emitChange();
  },

  addUser: (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user-${Date.now()}` };
    users = [...users, newUser];
    emitChange();
  },

  updateUser: (userId: string, updatedUser: Omit<User, 'id'>) => {
      users = users.map(u => u.id === userId ? { ...u, ...updatedUser } : u);
      emitChange();
  }
};

// Custom hook to use the store
export const useStore = (): Store => {
    const [snapshot, setSnapshot] = useState(store.getSnapshot());

    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setSnapshot(store.getSnapshot());
        });
        return unsubscribe;
    }, []);

    return snapshot;
}
