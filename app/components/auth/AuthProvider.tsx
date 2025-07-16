'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTokenManager, UseTokenManagerReturn } from '@/app/hooks/useTokenManager';

interface AuthContextType extends UseTokenManagerReturn {
  // Add any additional auth-related state or methods here
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const tokenManager = useTokenManager();

  // Initialize auto-refresh when the provider mounts
  useEffect(() => {
    if (tokenManager.isAuthenticated) {
      tokenManager.setupAutoRefresh();
    }

    return () => {
      tokenManager.clearAutoRefresh();
    };
  }, [tokenManager]);

  const contextValue: AuthContextType = {
    ...tokenManager,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for pages that require authentication
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  const WithAuthComponent = (props: P) => {
    const { isAuthenticated, isRefreshing } = useAuth();

    // Show loading state while checking authentication
    if (isRefreshing) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Redirect happens at middleware level, so this should not be reached
    // But we can add a fallback just in case
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthComponent;
}