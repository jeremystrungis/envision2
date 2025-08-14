
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLogo from '@/components/app-logo';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (loading || user) {
    return <div className="flex items-center justify-center min-h-screen bg-muted/40">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <AppLogo className="h-10 w-10 text-primary" />
                 <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
                    ENTRUST PMvision
                </h1>
            </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signInWithGoogle} className="w-full">
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
