
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/firebase-types';
import { useAuth } from './use-auth';

export function useUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setUsers([]);
        setLoading(false);
        return;
    };
    
    const workspaceId = user.uid;
    const q = query(collection(db, `workspaces/${workspaceId}/members`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workspaceMembers: User[] = [];
      querySnapshot.forEach((doc) => {
        workspaceMembers.push({ id: doc.id, ...doc.data() } as User);
      });
      
      const currentUserInTeam = workspaceMembers.find(u => u.authUid === user.uid);

      if (currentUserInTeam) {
        // Ensure current user is always first in the list for UI purposes (e.g., "(Me)" badge)
        setUsers([currentUserInTeam, ...workspaceMembers.filter(u => u.authUid !== user.uid)]);
      } else {
         setUsers(workspaceMembers);
      }

      setLoading(false);
    }, (error) => {
        console.error("Error fetching team members:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addUser = async (newUser: Omit<User, 'id'>) => {
    if (!user) return;
    const workspaceId = user.uid;
    // If this is the very first user being added, associate them with the logged-in auth user.
    const isFirstUser = users.length === 0;
    const userData = {
        ...newUser,
        ...(isFirstUser && { authUid: user.uid })
    };
    await addDoc(collection(db, `workspaces/${workspaceId}/members`), userData);
  };
  
  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>) => {
      if (!user) return;
      const workspaceId = user.uid;
      const userRef = doc(db, `workspaces/${workspaceId}/members`, userId);
      await updateDoc(userRef, data);
  }

  return { users, loading, addUser, updateUser };
}
