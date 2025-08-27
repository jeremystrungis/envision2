
'use server';
/**
 * @fileOverview A flow to handle importing workspace data from a JSON file.
 *
 * - importWorkspaceData - A function that handles the data import process.
 * - WorkspaceInputSchema - The Zod schema for the entire workspace data structure.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, writeBatch, collection, doc, Timestamp } from 'firebase/firestore';
import { Assignment } from '@/lib/firebase-types';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
});

const MemberSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  teams: z.array(z.string()),
  avatar: z.string().url(),
  capacity: z.number(),
  authUid: z.string().optional(),
});

const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  status: z.enum(['On Track', 'At Risk', 'Off Track']),
});

const AssignmentSchema = z.object({
    assigneeId: z.string(), // This will be a name when importing from JSON
    workingDays: z.array(z.number()),
    effort: z.number(),
});

const TaskSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  projectId: z.string(), // This will be a name when importing from JSON
  assignments: z.array(AssignmentSchema),
  startDate: z.string(), // ISO string
  endDate: z.string(),   // ISO string
  dependencies: z.array(z.string()),
  hours: z.number(),
});

const WorkspaceInputSchema = z.object({
  userId: z.string(),
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
    
    // Determine if this is an old or new format based on presence of IDs
    const isNewFormat = input.projects.every(p => p.id) && input.members.every(m => m.id) && input.tasks.every(t => t.id);

    const batch = writeBatch(db);
    const workspaceId = 'main';

    const idMaps = {
        members: {} as Record<string, string>,
        projects: {} as Record<string, string>,
        tasks: {} as Record<string, string>,
    };
    
    // Name-based maps for linking, which is more robust for exported/imported files
    const nameMaps = {
        members: {} as Record<string, string>,
        projects: {} as Record<string, string>,
    }

    // Import Teams (global, no dependencies)
    for (const team of input.teams) {
        const { id, ...teamData } = team;
        const newTeamRef = id ? doc(db, `workspaces/${workspaceId}/teams`, id) : doc(collection(db, `workspaces/${workspaceId}/teams`));
        batch.set(newTeamRef, teamData);
    }
    
    // Import Members and create mappings
    for (const member of input.members) {
        const { id, ...memberData } = member;
        const newMemberRef = id ? doc(db, `workspaces/${workspaceId}/members`, id) : doc(collection(db, `workspaces/${workspaceId}/members`));
        batch.set(newMemberRef, memberData);
        if (id) {
            idMaps.members[id] = newMemberRef.id;
        }
        nameMaps.members[member.name] = newMemberRef.id;
    }
    
    // Import Projects and create mappings
    for (const project of input.projects) {
        const { id, ...projectData } = project;
        const newProjectRef = id ? doc(db, `workspaces/${workspaceId}/projects`, id) : doc(collection(db, `workspaces/${workspaceId}/projects`));
        batch.set(newProjectRef, projectData);
        if (id) {
            idMaps.projects[id] = newProjectRef.id;
        }
        nameMaps.projects[project.name] = newProjectRef.id;
    }

    // First pass for tasks: create task references for dependency mapping
    for (const task of input.tasks) {
        if (task.id) {
            const newTaskRef = doc(db, `workspaces/${workspaceId}/tasks`, task.id);
            idMaps.tasks[task.id] = newTaskRef.id;
        }
    }

    // Second pass for tasks: set data with correct new foreign keys
    for (const task of input.tasks) {
        const { id, ...taskData } = task;
        const newTaskRef = id ? doc(db, `workspaces/${workspaceId}/tasks`, id) : doc(collection(db, `workspaces/${workspaceId}/tasks`));
        
        // Use the name map to find the new project ID
        const newProjectId = nameMaps.projects[task.projectId];

        if (!newProjectId) {
            console.warn(`Could not find new project ID for project name: ${task.projectId}. Skipping task: ${task.name}`);
            continue;
        }
        
        const newAssignments = task.assignments.map(a => {
            // Use the name map to find the new member ID
            const newAssigneeId = nameMaps.members[a.assigneeId];
            if (!newAssigneeId) {
                 console.warn(`Could not find new member ID for member name: ${a.assigneeId}. Skipping assignment for task: ${task.name}`);
                 return null;
            }
            return { ...a, assigneeId: newAssigneeId };
        }).filter((a): a is Assignment => a !== null);


        const newDependencies = (task.dependencies || []).map(depId => {
            // Dependencies only supported if original IDs were present
            const newDepId = idMaps.tasks[depId];
             if (!newDepId) {
                 console.warn(`Could not find new dependency ID for old ID: ${depId}. Skipping dependency for task: ${task.name}`);
                 return null;
            }
            return newDepId;
        }).filter((d): d is string => d !== null);

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
