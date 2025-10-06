
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define a simple user type for the local offline application
interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // For a fully offline app, we'll simulate a single, default user.
    // There's no real "login" process. The app just starts with the user "logged in".
    const localUser: User = {
      uid: 'localuser01',
      displayName: 'Local User',
      email: 'user@localhost',
    };
    setUser(localUser);
    setLoading(false);
    
    // Since there's no login page, we can redirect to a default page if needed,
    // but for now, we'll assume the app starts on the main page.
    // We remove the redirect to '/login' as it's no longer applicable.

  }, []);

  // signIn and logout functions are removed as they are tied to Firebase auth.
  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
