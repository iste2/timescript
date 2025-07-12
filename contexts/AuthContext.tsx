'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signOut } from '@/lib/server/auth-actions';

interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, any>;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  // Simplified auth methods
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      // Call API route to get current user from server session
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(); // This will redirect, so we won't reach the next lines
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for getting user ID
export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.$id || null;
}