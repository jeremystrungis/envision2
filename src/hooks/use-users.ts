
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
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

    const q = query(collection(db, `users/${user.uid}/team`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTeam: User[] = [];
      querySnapshot.forEach((doc) => {
        userTeam.push({ id: doc.id, ...doc.data() } as User);
      });
      
      // Ensure the logged-in user is first if they exist, or create them
      const currentUserInTeam = userTeam.find(u => u.id === user.uid);
      if (currentUserInTeam) {
        // Move current user to the front
        const otherUsers = userTeam.filter(u => u.id !== user.uid);
        setUsers([currentUserInTeam, ...otherUsers]);
      } else {
        // If the user is not in the team collection, add them.
        // This can happen for a new account.
        const newUser = {
            id: user.uid,
            name: user.displayName || 'Me',
            email: user.email,
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            team: 'Unassigned',
            capacity: 8,
        }
        addDoc(collection(db, `users/${user.uid}/team`), newUser);
        setUsers([newUser as any, ...userTeam]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addUser = async (newUser: Omit<User, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/team`), newUser);
  };
  
  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>) => {
      if (!user) return;
      const userRef = doc(db, `users/${user.uid}/team`, userId);
      await updateDoc(userRef, data);
  }

  return { users, loading, addUser, updateUser };
}
