
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDb } from '@/lib/db';
import { User } from '@/lib/types';
import { useAuth } from './use-auth';

export function useUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await getDb();
      const fetchedUsers = await db.select('SELECT * FROM users');
      
      // Teams are stored as JSON strings, so we parse them.
      const workspaceMembers = fetchedUsers.map((u: any) => ({
          ...u,
          teams: JSON.parse(u.teams || '[]')
      }));

      const currentUserInTeam = workspaceMembers.find((u: User) => u.authUid === user.uid);

      if (currentUserInTeam) {
        setUsers([currentUserInTeam, ...workspaceMembers.filter((u: User) => u.authUid !== user.uid)]);
      } else {
        setUsers(workspaceMembers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = async (newUser: Omit<User, 'id'>) => {
    if (!user) return;
    try {
      const db = await getDb();
      const isFirstUser = users.length === 0;
      const authUid = isFirstUser ? user.uid : newUser.authUid || null;

      await db.execute(
        'INSERT INTO users (name, teams, avatar, capacity, authUid) VALUES (?, ?, ?, ?, ?)',
        [newUser.name, JSON.stringify(newUser.teams || []), newUser.avatar, newUser.capacity, authUid]
      );
      await fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };
  
  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>) => {
    if (!user) return;
    try {
      const db = await getDb();
      const fields = Object.keys(data);
      const values = Object.values(data).map(v => 
        (Array.isArray(v) ? JSON.stringify(v) : v)
      );

      if (fields.length === 0) return;

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      await db.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, userId]
      );
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  return { users, loading, addUser, updateUser, refreshUsers: fetchUsers };
}
