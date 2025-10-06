
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDb } from '@/lib/db';
import { Task } from '@/lib/types';
import { useAuth } from './use-auth';

export function useTasks(projectId?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await getDb();
      let query = 'SELECT * FROM tasks';
      const params: any[] = [];
      if (projectId) {
        query += ' WHERE projectId = ?';
        params.push(projectId);
      }
      const fetchedTasks = await db.select(query, params);
      // Dates are stored as ISO strings, so we convert them to Date objects.
      // Assignments and dependencies would be stored as JSON strings and parsed here.
      setTasks(fetchedTasks.map((task: any) => ({
          ...task,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
          assignments: JSON.parse(task.assignments || '[]'),
          dependencies: JSON.parse(task.dependencies || '[]'),
      })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!user) return;
    try {
      const db = await getDb();
      await db.execute(
        'INSERT INTO tasks (name, description, projectId, startDate, endDate, status, hours, assignments, dependencies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          task.name,
          task.description,
          task.projectId,
          task.startDate,
          task.endDate,
          task.status,
          task.hours,
          JSON.stringify(task.assignments || []),
          JSON.stringify(task.dependencies || []),
        ]
      );
      await fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTask = async (taskId: string, data: Partial<Omit<Task, 'id'>>) => {
    if (!user) return;
    try {
      const db = await getDb();
      const fields = Object.keys(data);
      const values = Object.values(data).map(v => 
        (Array.isArray(v) ? JSON.stringify(v) : v)
      );

      if (fields.length === 0) return;

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      await db.execute(
        `UPDATE tasks SET ${setClause} WHERE id = ?`,
        [...values, taskId]
      );
      await fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      const db = await getDb();
      await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  return { tasks, loading, addTask, updateTask, deleteTask, refreshTasks: fetchTasks };
}
