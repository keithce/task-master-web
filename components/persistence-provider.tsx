"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTaskStore } from "@/store/task-store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PersistenceProviderProps {
  children: React.ReactNode;
}

export const PersistenceProvider: React.FC<PersistenceProviderProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const initRef = useRef(false);
  const { isHydrated, restoreState } = useTaskStore();

  // Handle mounting state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prevent double initialization
    if (initRef.current || !mounted) return;

    const initializeApp = async () => {
      try {
        initRef.current = true;

        // Add a small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        await restoreState();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app state:", error);
        setIsInitialized(true); // Continue with empty state
      }
    };

    // Only initialize after mounting
    if (mounted && !isHydrated) {
      initializeApp();
    } else if (mounted && isHydrated) {
      setIsInitialized(true);
    }
  }, [restoreState, mounted, isHydrated]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

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
