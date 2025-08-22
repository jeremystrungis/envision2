
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
  name: z.string(),
  teams: z.array(z.string()),
  avatar: z.string().url(),
  capacity: z.number(),
  authUid: z.string().optional(),
});

const ProjectSchema = z.object({
  name: z.string(),
  status: z.enum(['On Track', 'At Risk', 'Off Track']),
});

const AssignmentSchema = z.object({
    assigneeId: z.string(),
    workingDays: z.array(z.number()),
    effort: z.number(),
});

const TaskSchema = z.object({
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

    const oldToNewIdMapping: Record<string, string> = {};

    // Import Teams
    for (const team of input.teams) {
        const newTeamRef = doc(collection(db, `workspaces/main/teams`));
        batch.set(newTeamRef, team);
    }
    
    // Import Members
    for (const member of input.members) {
        const newMemberRef = doc(collection(db, `workspaces/main/members`));
        batch.set(newMemberRef, member);
    }
    
    // Import Projects
    for (const project of input.projects) {
        const newProjectRef = doc(collection(db, `workspaces/main/projects`));
        batch.set(newProjectRef, { ...project });
        oldToNewIdMapping[project.name] = newProjectRef.id;
    }

    // Import Tasks
    const membersSnapshot = await getDocs(query(collection(db, `workspaces/main/members`)));
    const memberNameIdMap: Record<string, string> = {};
    membersSnapshot.forEach(doc => {
        const member = doc.data() as Omit<User, 'id'>;
        memberNameIdMap[member.name] = doc.id;
    });

    for (const task of input.tasks) {
        const newProjectId = oldToNewIdMapping[task.projectId];

        const newTaskRef = doc(collection(db, `workspaces/main/tasks`));
        
        const newAssignments = task.assignments.map(a => ({
            ...a,
            assigneeId: memberNameIdMap[a.assigneeId] || a.assigneeId,
        })).filter(a => Object.values(memberNameIdMap).includes(a.assigneeId));

        batch.set(newTaskRef, {
            ...task,
            projectId: newProjectId || task.projectId,
            startDate: Timestamp.fromDate(new Date(task.startDate)),
            endDate: Timestamp.fromDate(new Date(task.endDate)),
            dependencies: [], // Reset dependencies
            assignments: newAssignments
        });
    }

    await batch.commit();

    return { success: true };
  }
);
