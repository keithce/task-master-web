'use client';

import React, { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/task-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PersistenceProviderProps {
  children: React.ReactNode;
}

export const PersistenceProvider: React.FC<PersistenceProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isHydrated, restoreState } = useTaskStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await restoreState();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app state:', error);
        setIsInitialized(true); // Continue with empty state
      }
    };

    initializeApp();
  }, [restoreState]);

  if (!isInitialized || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};