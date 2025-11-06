// Deprecated: FavoritesContext has been replaced by Zustand store.
// This shim ensures any lingering imports won't break during the refactor.
import React from 'react';
export { useFavorites } from '../hooks/useFavorites';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn('[Deprecated] FavoritesProvider is no longer needed. Remove it and use the useFavorites hook backed by Zustand.');
  }
  return <>{children}</>;
};
