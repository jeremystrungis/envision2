
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDb } from '@/lib/db';
import { Team } from '@/lib/types';
import { useAuth } from './use-auth';

export function useTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await getDb();
      const fetchedTeams = await db.select('SELECT * FROM teams');
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const addTeam = async (newTeam: Omit<Team, 'id'>) => {
    if (!user) return;
    try {
      const db = await getDb();
      await db.execute('INSERT INTO teams (name) VALUES (?)', [newTeam.name]);
      await fetchTeams();
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };
  
  const deleteTeam = async (teamId: string) => {
    if (!user) return;
    try {
      const db = await getDb();
      await db.execute('DELETE FROM teams WHERE id = ?', [teamId]);
      await fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  }

  return { teams, loading, addTeam, deleteTeam, refreshTeams: fetchTeams };
}
