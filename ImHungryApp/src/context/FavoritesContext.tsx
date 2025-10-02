import React, { createContext, useContext, useState, useCallback } from 'react';

interface FavoritesContextType {
  // Global state for unfavorited items
  unfavoritedItems: Set<string>;
  unfavoritedRestaurants: Set<string>;
  
  // Actions
  markAsUnfavorited: (id: string, type: 'deal' | 'restaurant') => void;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  clearUnfavorited: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unfavoritedItems, setUnfavoritedItems] = useState<Set<string>>(new Set());
  const [unfavoritedRestaurants, setUnfavoritedRestaurants] = useState<Set<string>>(new Set());

  const markAsUnfavorited = useCallback((id: string, type: 'deal' | 'restaurant') => {
    if (type === 'deal') {
      setUnfavoritedItems(prev => new Set(prev).add(id));
    } else {
      setUnfavoritedRestaurants(prev => new Set(prev).add(id));
    }
  }, []);

  const isUnfavorited = useCallback((id: string, type: 'deal' | 'restaurant') => {
    if (type === 'deal') {
      return unfavoritedItems.has(id);
    } else {
      return unfavoritedRestaurants.has(id);
    }
  }, [unfavoritedItems, unfavoritedRestaurants]);

  const clearUnfavorited = useCallback(() => {
    setUnfavoritedItems(new Set());
    setUnfavoritedRestaurants(new Set());
  }, []);

  return (
    <FavoritesContext.Provider value={{
      unfavoritedItems,
      unfavoritedRestaurants,
      markAsUnfavorited,
      isUnfavorited,
      clearUnfavorited,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
