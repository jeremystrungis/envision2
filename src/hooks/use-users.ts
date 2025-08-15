
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

    const q = query(collection(db, `users/${user.uid}/members`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTeam: User[] = [];
      querySnapshot.forEach((doc) => {
        userTeam.push({ id: doc.id, ...doc.data() } as User);
      });
      
      const currentUserInTeam = userTeam.find(u => u.id === user.uid);

      if (currentUserInTeam) {
        // Ensure current user is always first in the list
        setUsers([currentUserInTeam, ...userTeam.filter(u => u.id !== user.uid)]);
      } else {
        // Data exists, but not for the current user, just set the team
         setUsers(userTeam);
      }

      setLoading(false);
    }, (error) => {
        console.error("Error fetching team:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addUser = async (newUser: Omit<User, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/members`), newUser);
  };
  
  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>) => {
      if (!user) return;
      const userRef = doc(db, `users/${user.uid}/members`, userId);
      await updateDoc(userRef, data);
  }

  return { users, loading, addUser, updateUser };
}
