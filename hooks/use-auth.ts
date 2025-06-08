'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string | null;
  isSubscribed: string;
  isVerified: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setAuthToken(token);
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }

    setIsLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthToken(null);
    router.push('/login');
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${authToken}`,
      'key': process.env.NEXT_PUBLIC_API_CLIENT_SECRET!
    };
  };

  return {
    user,
    isLoading,
    authToken,
    isAuthenticated: !!user && !!authToken,
    logout,
    getAuthHeaders,
  };
} 