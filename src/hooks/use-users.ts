
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

    const q = query(collection(db, `users/${user.uid}/team`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTeam: User[] = [];
      querySnapshot.forEach((doc) => {
        userTeam.push({ id: doc.id, ...doc.data() } as User);
      });
      
      const currentUserInTeam = userTeam.find(u => u.id === user.uid);

      if (currentUserInTeam) {
        // Ensure current user is always first in the list
        setUsers([currentUserInTeam, ...userTeam.filter(u => u.id !== user.uid)]);
      } else if (querySnapshot.docs.length > 0 || userTeam.length > 0) {
        // Data exists, but not for the current user, so add them.
         const newUser: User = {
            id: user.uid,
            name: user.displayName || 'Me',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            team: 'Unassigned',
            capacity: 8,
        };
        const userRef = doc(db, `users/${user.uid}/team`, user.uid);
        // setDoc doesn't need Omit, it just needs the data payload.
        const { id, ...userData } = newUser;
        setDoc(userRef, userData);
      } else if (querySnapshot.empty) {
        // Collection is empty, create the first user (me)
        const newUser: User = {
            id: user.uid,
            name: user.displayName || 'Me',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            team: 'Unassigned',
            capacity: 8,
        };
        const userRef = doc(db, `users/${user.uid}/team`, user.uid);
        const { id, ...userData } = newUser;
        setDoc(userRef, userData);
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
    await addDoc(collection(db, `users/${user.uid}/team`), newUser);
  };
  
  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>) => {
      if (!user) return;
      const userRef = doc(db, `users/${user.uid}/team`, userId);
      await updateDoc(userRef, data);
  }

  return { users, loading, addUser, updateUser };
}
