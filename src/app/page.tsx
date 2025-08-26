
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth state is determined
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to the new default page
        router.push('/teams');
      } else {
        // If user is not logged in, redirect to the login page
        router.push('/login');
      }
    }
  }, [loading, user, router]);

  // Render a loading state while the redirection logic is running
  return (
    <div className="flex items-center justify-center min-h-screen">
      Loading...
    </div>
  );
}
