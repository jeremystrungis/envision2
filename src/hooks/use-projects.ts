
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Project, Task } from '@/lib/firebase-types';
import { useAuth } from './use-auth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    };

    const q = query(collection(db, `users/${user.uid}/projects`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        userProjects.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(userProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addProject = async (project: Omit<Project, 'id'>, newTasks: Omit<Task, 'id' | 'projectId' | 'dependencies'>[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      const projectRef = doc(collection(db, `users/${user.uid}/projects`));
      batch.set(projectRef, project);

      const tasksToAdd: Omit<Task, 'id'>[] = newTasks
        .filter(task => task.name)
        .map(task => ({
          ...task,
          projectId: projectRef.id,
          dependencies: [],
          startDate: Timestamp.fromDate(task.startDate as any),
          endDate: Timestamp.fromDate(task.endDate as any),
        }));

      tasksToAdd.forEach(task => {
        const taskRef = doc(collection(db, `users/${user.uid}/tasks`));
        batch.set(taskRef, task);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error adding project with tasks: ", error);
    }
  };

  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id'>>) => {
      if (!user) return;
      const projectRef = doc(db, `users/${user.uid}/projects`, projectId);
      await setDoc(projectRef, data, { merge: true });
  }

  return { projects, loading, addProject, updateProject };
}
