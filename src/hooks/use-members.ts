
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/firebase-types';
import { useAuth } from './use-auth';

// All data will be stored under a single workspace for all users.
const WORKSPACE_ID = 'main';

export function useMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setMembers([]);
        setLoading(false);
        return;
    };

    const q = query(collection(db, `workspaces/${WORKSPACE_ID}/members`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workspaceMembers: User[] = [];
      querySnapshot.forEach((doc) => {
        workspaceMembers.push({ id: doc.id, ...doc.data() } as User);
      });
      setMembers(workspaceMembers);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching team members:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addMember = async (newMember: Omit<User, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, `workspaces/${WORKSPACE_ID}/members`), newMember);
  };
  
  const updateMember = async (memberId: string, data: Partial<Omit<User, 'id'>>) => {
      if (!user) return;
      const memberRef = doc(db, `workspaces/${WORKSPACE_ID}/members`, memberId);
      await updateDoc(memberRef, data);
  }
  
  const deleteMember = async (memberId: string) => {
      if (!user) return;
      const memberRef = doc(db, `workspaces/${WORKSPACE_ID}/members`, memberId);
      await deleteDoc(memberRef);
  }

  return { members, loading, addMember, updateMember, deleteMember };
}
