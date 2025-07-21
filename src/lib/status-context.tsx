import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Provider } from '@/lib/api';

// Status types
export type ModelStatus = 'available' | 'unavailable' | 'limited';
export type ProviderStatus = 'operational' | 'degraded' | 'outage';

// Status data structure
export interface ProviderStatusData {
  status: ProviderStatus;
  models: Record<string, ModelStatus>;
  lastChecked: string;
}

export interface StatusData {
  providers: Record<Provider, ProviderStatusData>;
  lastUpdated: string;
}

// Context interface
interface StatusContextType {
  status: StatusData | null;
  isLoading: boolean;
  error: Error | null;
  refreshStatus: () => Promise<void>;
  getModelStatus: (provider: Provider, modelId: string) => ModelStatus | undefined;
  getProviderStatus: (provider: Provider) => ProviderStatus | undefined;
}

// Create context with default values
const StatusContext = createContext<StatusContextType>({
  status: null,
  isLoading: false,
  error: null,
  refreshStatus: async () => {},
  getModelStatus: () => undefined,
  getProviderStatus: () => undefined,
});

// Provider component
export function StatusProvider({
  children,
  refreshInterval = 60000,
}: {
  children: ReactNode;
  refreshInterval?: number;
}) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch status data
  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/status');

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Error fetching status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get model status
  const getModelStatus = (provider: Provider, modelId: string): ModelStatus | undefined => {
    if (!status || !status.providers[provider]) return undefined;
    return status.providers[provider].models[modelId];
  };

  // Helper function to get provider status
  const getProviderStatus = (provider: Provider): ProviderStatus | undefined => {
    if (!status || !status.providers[provider]) return undefined;
    return status.providers[provider].status;
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    refreshStatus();

    // Set up periodic refresh
    const intervalId = setInterval(refreshStatus, refreshInterval);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return (
    <StatusContext.Provider
      value={{ status, isLoading, error, refreshStatus, getModelStatus, getProviderStatus }}
    >
      {children}
    </StatusContext.Provider>
  );
}

// Custom hook to use the status context
export function useStatus() {
  return useContext(StatusContext);
}
