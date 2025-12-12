// Deprecated: LocationContext has been replaced by Zustand store.
// Provide a no-op provider and re-export the hook for a smooth migration.
import React from 'react';
export { useLocation } from '../hooks/useLocation';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn('[Deprecated] LocationProvider is no longer needed. Remove it and use the useLocation hook backed by Zustand.');
  }
  return <>{children}</>;
};