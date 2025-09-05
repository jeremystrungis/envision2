
'use server';
/**
 * @fileOverview A flow to handle importing only teams and members to the main database.
 * This is used to make principals from a JSON file available for selection in the live app
 * without importing the associated projects and tasks.
 *
 * - importPrincipals - A function that handles the data import process.
 * - PrincipalsInputSchema - The Zod schema for the teams and members data structure.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, writeBatch, collection, doc, getDocs, query } from 'firebase/firestore';
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

const PrincipalsInputSchema = z.object({
  userId: z.string().describe("The UID of the user initiating the import."),
  teams: z.array(TeamSchema),
  members: z.array(MemberSchema),
});
export type PrincipalsInput = z.infer<typeof PrincipalsInputSchema>;


export async function importPrincipals(input: PrincipalsInput): Promise<{ success: boolean; teamsAdded: number; membersAdded: number }> {
  return await importPrincipalsFlow(input);
}


const importPrincipalsFlow = ai.defineFlow(
  {
    name: 'importPrincipalsFlow',
    inputSchema: PrincipalsInputSchema,
    outputSchema: z.object({ success: z.boolean(), teamsAdded: z.number(), membersAdded: z.number() }),
  },
  async (input) => {
    const { userId } = input;
    if (!userId) {
        throw new Error("User ID is required to import principals.");
    }
    const workspaceId = userId;
    const batch = writeBatch(db);

    // Fetch existing teams and members to avoid duplicates
    const teamsCollection = collection(db, `workspaces/${workspaceId}/teams`);
    const membersCollection = collection(db, `workspaces/${workspaceId}/members`);
    
    const existingTeamsSnapshot = await getDocs(query(teamsCollection));
    const existingMembersSnapshot = await getDocs(query(membersCollection));

    const existingTeamNames = new Set(existingTeamsSnapshot.docs.map(d => d.data().name));
    const existingMemberNames = new Set(existingMembersSnapshot.docs.map(d => d.data().name));

    let teamsAdded = 0;
    let membersAdded = 0;

    // Import Teams if they don't already exist
    for (const team of input.teams) {
      if (!existingTeamNames.has(team.name)) {
        const newTeamRef = doc(teamsCollection);
        batch.set(newTeamRef, team);
        existingTeamNames.add(team.name); // Add to set to handle duplicates within the same file
        teamsAdded++;
      }
    }
    
    // Import Members if they don't already exist
    for (const member of input.members) {
      if (!existingMemberNames.has(member.name)) {
        const newMemberRef = doc(membersCollection);
        // Omit any 'id' field from the file, as Firestore generates its own.
        const { id, ...memberData } = member as any; 
        batch.set(newMemberRef, memberData);
        existingMemberNames.add(member.name); // Add to set to handle duplicates within the same file
        membersAdded++;
      }
    }

    await batch.commit();

    return { success: true, teamsAdded, membersAdded };
  }
);
