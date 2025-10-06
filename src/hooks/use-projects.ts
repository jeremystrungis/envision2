
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDb } from '@/lib/db';
import { Project, Task } from '@/lib/types';
import { useAuth } from './use-auth';

// Note: We will need to define the database schema. For now, we assume tables
// 'projects' and 'tasks' exist with columns matching the 'Project' and 'Task' types.

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await getDb();
      // In a real scenario, dates would be stored as ISO strings or numbers
      // and converted back to Date objects here.
      const fetchedProjects = await db.select('SELECT * FROM projects');
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project: Omit<Project, 'id'>, newTasks: Omit<Task, 'id' | 'projectId' | 'dependencies'>[]) => {
    if (!user) return;
    try {
      const db = await getDb();
      
      // Insert the project and get its ID
      const projectResult = await db.execute(
        'INSERT INTO projects (name, description, startDate, endDate, status) VALUES (?, ?, ?, ?, ?)',
        [project.name, project.description, project.startDate, project.endDate, project.status]
      );
      const newProjectId = projectResult.lastInsertId;

      // Insert associated tasks
      for (const task of newTasks.filter(t => t.name)) {
        await db.execute(
          'INSERT INTO tasks (name, description, projectId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)',
          [task.name, task.description, newProjectId, task.startDate, task.endDate, task.status]
        );
      }
      
      // Refetch projects to update the UI
      await fetchProjects();
    } catch (error) {
      console.error("Error adding project with tasks: ", error);
    }
  };

  const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id'>>) => {
    if (!user) return;
    try {
        const db = await getDb();
        const fields = Object.keys(data);
        const values = Object.values(data);
        
        if (fields.length === 0) return;

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        await db.execute(
            `UPDATE projects SET ${setClause} WHERE id = ?`,
            [...values, projectId]
        );

        // Refetch projects to update the UI
        await fetchProjects();
    } catch (error) {
        console.error("Error updating project:", error);
    }
  }

  return { projects, loading, addProject, updateProject, refreshProjects: fetchProjects };
}
