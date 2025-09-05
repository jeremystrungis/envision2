
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/lib/firebase-types';
import { useAuth } from './use-auth';

export function useTasks(projectId?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const workspaceId = user.uid;

    let q;
    const tasksCollection = collection(db, `workspaces/${workspaceId}/tasks`);
    if (projectId) {
        q = query(tasksCollection, where('projectId', '==', projectId));
    } else {
        q = query(tasksCollection);
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        userTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(userTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, projectId]);

  const addTask = async (task: Omit<Task, 'id' | 'dependencies'>) => {
    if (!user || !projectId) return;
    const workspaceId = user.uid;
    await addDoc(collection(db, `workspaces/${workspaceId}/tasks`), {
        ...task,
        projectId,
        dependencies: [],
        startDate: Timestamp.fromDate(task.startDate as any),
        endDate: Timestamp.fromDate(task.endDate as any),
    });
  };

  const updateTask = async (taskId: string, data: Partial<Omit<Task, 'id'>>) => {
      if (!user) return;
      const workspaceId = user.uid;
      const taskRef = doc(db, `workspaces/${workspaceId}/tasks`, taskId);
      const dataToUpdate = {...data};
      if (data.startDate) {
          dataToUpdate.startDate = Timestamp.fromDate(data.startDate as any);
      }
      if (data.endDate) {
          dataToUpdate.endDate = Timestamp.fromDate(data.endDate as any);
      }
      await updateDoc(taskRef, dataToUpdate);
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const workspaceId = user.uid;
    const taskRef = doc(db, `workspaces/${workspaceId}/tasks`, taskId);
    await deleteDoc(taskRef);
    // Note: dependency cleanup on other tasks would be more complex and is omitted here.
  }

  return { tasks, loading, addTask, updateTask, deleteTask };
}
