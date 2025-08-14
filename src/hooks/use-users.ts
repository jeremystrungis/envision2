
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
      let currentUserInTeam: User | undefined;

      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() } as User;
        if (doc.id === user.uid) {
            currentUserInTeam = userData;
        } else {
            userTeam.push(userData);
        }
      });
      
      if (currentUserInTeam) {
        setUsers([currentUserInTeam, ...userTeam]);
      } else {
         const newUser: User = {
            id: user.uid,
            name: user.displayName || 'Me',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            team: 'Unassigned',
            capacity: 8,
        };
        // Add the new user to the database
        const userRef = doc(db, `users/${user.uid}/team`, user.uid);
        setDoc(userRef, Omit<User, 'id'>(newUser));
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
