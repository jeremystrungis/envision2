
'use server';
/**
 * @fileOverview A flow to handle importing workspace data from a JSON file.
 *
 * - importWorkspaceData - A function that handles the data import process.
 * - WorkspaceInputSchema - The Zod schema for the entire workspace data structure.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, writeBatch, collection, doc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { User } from '@/lib/firebase-types';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

const TeamSchema = z.object({
    name: z.string(),
});

const MemberSchema = z.object({
  id: z.string(), // Keep ID for mapping
  name: z.string(),
  teams: z.array(z.string()),
  avatar: z.string().url(),
  capacity: z.number(),
  authUid: z.string().optional(),
});

const ProjectSchema = z.object({
  id: z.string(), // Keep ID for mapping
  name: z.string(),
  status: z.enum(['On Track', 'At Risk', 'Off Track']),
});

const AssignmentSchema = z.object({
    assigneeId: z.string(),
    workingDays: z.array(z.number()),
    effort: z.number(),
});

const TaskSchema = z.object({
  id: z.string(), // Keep ID for mapping
  name: z.string(),
  projectId: z.string(),
  assignments: z.array(AssignmentSchema),
  startDate: z.string(), // ISO string
  endDate: z.string(),   // ISO string
  dependencies: z.array(z.string()),
  hours: z.number(),
});

const WorkspaceInputSchema = z.object({
  userId: z.string(), // Added userId to the input
  teams: z.array(TeamSchema),
  members: z.array(MemberSchema),
  projects: z.array(ProjectSchema),
  tasks: z.array(TaskSchema),
});
export type WorkspaceInput = z.infer<typeof WorkspaceInputSchema>;


export async function importWorkspaceData(input: WorkspaceInput): Promise<{ success: boolean }> {
  return await importWorkspaceDataFlow(input);
}


const importWorkspaceDataFlow = ai.defineFlow(
  {
    name: 'importWorkspaceDataFlow',
    inputSchema: WorkspaceInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    const { userId } = input;
    if (!userId) {
        throw new Error("User ID must be provided to import data.");
    }
    const batch = writeBatch(db);

    const oldToNewIdMap = {
        members: {} as Record<string, string>,
        projects: {} as Record<string, string>,
        tasks: {} as Record<string, string>,
    };

    // Import Teams
    for (const team of input.teams) {
        const newTeamRef = doc(collection(db, `workspaces/${userId}/teams`));
        batch.set(newTeamRef, team);
    }
    
    // Import Members
    for (const member of input.members) {
        const newMemberRef = doc(collection(db, `workspaces/${userId}/members`));
        const { id, ...memberData } = member;
        batch.set(newMemberRef, memberData);
        oldToNewIdMap.members[id] = newMemberRef.id;
    }
    
    // Import Projects
    for (const project of input.projects) {
        const newProjectRef = doc(collection(db, `workspaces/${userId}/projects`));
        const { id, ...projectData } = project;
        batch.set(newProjectRef, projectData);
        oldToNewIdMap.projects[id] = newProjectRef.id;
    }

    // First pass for tasks: create tasks with new IDs and map old to new
    for (const task of input.tasks) {
        const newTaskRef = doc(collection(db, `workspaces/${userId}/tasks`));
        oldToNewIdMap.tasks[task.id] = newTaskRef.id;
    }

    // Second pass for tasks: set data with correct new foreign keys
    for (const task of input.tasks) {
        const newTaskId = oldToNewIdMap.tasks[task.id];
        const newTaskRef = doc(db, `workspaces/${userId}/tasks`, newTaskId);
        
        const newProjectId = oldToNewIdMap.projects[task.projectId];
        if (!newProjectId) {
            console.warn(`Could not find new project ID for old project ID: ${task.projectId}. Skipping task: ${task.name}`);
            continue; // or handle error appropriately
        }

        const newAssignments = task.assignments.map(a => {
            const newAssigneeId = oldToNewIdMap.members[a.assigneeId];
            if (!newAssigneeId) {
                 console.warn(`Could not find new member ID for old member ID: ${a.assigneeId}. Skipping assignment for task: ${task.name}`);
                 return null;
            }
            return {
                ...a,
                assigneeId: newAssigneeId,
            };
        }).filter(Boolean) as Assignment[];

        const newDependencies = task.dependencies.map(depId => {
            const newDepId = oldToNewIdMap.tasks[depId];
             if (!newDepId) {
                 console.warn(`Could not find new dependency ID for old ID: ${depId}. Skipping dependency for task: ${task.name}`);
                 return null;
            }
            return newDepId;
        }).filter(Boolean) as string[];

        batch.set(newTaskRef, {
            name: task.name,
            projectId: newProjectId,
            assignments: newAssignments,
            startDate: Timestamp.fromDate(new Date(task.startDate)),
            endDate: Timestamp.fromDate(new Date(task.endDate)),
            dependencies: newDependencies,
            hours: task.hours,
        });
    }

    await batch.commit();

    return { success: true };
  }
);
