"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserInfo = {
  userId: string;
  username: string;
  email: string;
  tenantId: string;
  tenantName?: string;
  roles: string[];
  permissions: string[];
};

type AuthContextType = {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = (user: UserInfo | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => user?.roles?.includes(role)) ?? false;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const logout = () => {
    setUser(null);
    // Clear localStorage
    localStorage.removeItem('accessToken');
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      hasRole, 
      hasAnyRole, 
      hasPermission, 
      logout,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


