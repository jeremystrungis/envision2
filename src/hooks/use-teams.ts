
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Team } from '@/lib/firebase-types';
import { useAuth } from './use-auth';

// All data will be stored under a single workspace for all users.
const WORKSPACE_ID = 'main';

export function useTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setTeams([]);
        setLoading(false);
        return;
    };

    const q = query(collection(db, `workspaces/${WORKSPACE_ID}/teams`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTeams: Team[] = [];
      querySnapshot.forEach((doc) => {
        userTeams.push({ id: doc.id, ...doc.data() } as Team);
      });
      setTeams(userTeams);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTeam = async (newTeam: Omit<Team, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, `workspaces/${WORKSPACE_ID}/teams`), newTeam);
  };
  
  const deleteTeam = async (teamId: string) => {
      if (!user) return;
      const teamRef = doc(db, `workspaces/${WORKSPACE_ID}/teams`, teamId);
      await deleteDoc(teamRef);
  }

  return { teams, loading, addTeam, deleteTeam };
}
