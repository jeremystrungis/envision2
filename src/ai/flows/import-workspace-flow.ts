
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
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

// Helper function to get the current user's UID from the server context
const getCurrentUserId = () => {
    const auth = getAuth(app);
    // This is a placeholder for server-side auth context.
    // In a real Genkit/Firebase server environment, you'd get the UID
    // from the authenticated request context. For now, we simulate this
    // by assuming a known user or passing it explicitly.
    // This part of the code IS NOT ROBUST and depends on how the flow is invoked.
    // Let's assume for Studio, we can get it from the session.
    // Since Genkit flows on Next.js run in the same context, we can get auth state.
    // A more robust solution might involve passing the uid as an argument.
    const user = auth.currentUser;
    if (!user) throw new Error("User must be authenticated to import data.");
    return user.uid;
}

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
    const userId = getCurrentUserId();
    const batch = writeBatch(db);

    const oldToNewIdMapping: Record<string, string> = {};

    // Import Teams
    for (const team of input.teams) {
        const newTeamRef = doc(collection(db, `users/${userId}/teams`));
        batch.set(newTeamRef, team);
    }
    
    // Import Members
    for (const member of input.members) {
        const newMemberRef = doc(collection(db, `users/${userId}/members`));
        batch.set(newMemberRef, member);
    }
    
    // Import Projects
    for (const project of input.projects) {
        // We assume project IDs in tasks are just references by name/order for now.
        // A robust implementation would map old IDs to new IDs.
        // For simplicity, we just create new projects.
        const newProjectRef = doc(collection(db, `workspaces/main/projects`));
        // Need to associate project with the user who created it
        batch.set(newProjectRef, { ...project, ownerUid: userId });
        // Let's assume tasks reference projects by name for simplicity, since IDs change.
        oldToNewIdMapping[project.name] = newProjectRef.id;
    }

    // Import Tasks
    // This is tricky because task assignments and dependencies use IDs that will change on import.
    // A truly robust import would require a mapping of old IDs to new IDs.
    // For this implementation, we will make a simplifying assumption:
    // - Project IDs in tasks will be mapped by project *name*.
    // - Assignee IDs will be mapped by member *name*.
    // - Dependencies are reset on import because mapping them is complex.

    const newMembersSnapshot = await getDocs(query(collection(db, `users/${userId}/members`)));
    const memberNameIdMap: Record<string, string> = {};
    newMembersSnapshot.forEach(doc => {
        const member = doc.data() as Omit<User, 'id'>;
        memberNameIdMap[member.name] = doc.id;
    });

    for (const task of input.tasks) {
        const newProject_ = oldToNewIdMapping[task.projectId];

        const newTaskRef = doc(collection(db, `workspaces/main/tasks`));
        
        // This is a simplified mapping. A real-world scenario would be more complex.
        const newAssignments = task.assignments.map(a => ({
            ...a,
            // We assume the assigneeId in the JSON is the *name* of the member for mapping.
            assigneeId: memberNameIdMap[a.assigneeId] || a.assigneeId,
        })).filter(a => a.assigneeId in memberNameIdMap); // Only keep assignments we can map

        batch.set(newTaskRef, {
            ...task,
            projectId: newProject_ || task.projectId, // Fallback to old name if not found
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
