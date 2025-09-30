import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Deal } from '../components/DealCard';

interface DealUpdateContextType {
  updateDeal: (deal: Deal) => void;
  getUpdatedDeal: (dealId: string) => Deal | undefined;
  clearUpdatedDeal: (dealId: string) => void;
}

const DealUpdateContext = createContext<DealUpdateContextType | undefined>(undefined);

export const DealUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store updated deals by ID
  const [updatedDeals, setUpdatedDeals] = useState<Map<string, Deal>>(new Map());
  
  // Use ref to access latest state without triggering re-renders
  const updatedDealsRef = useRef<Map<string, Deal>>(new Map());
  
  // Keep ref in sync with state
  updatedDealsRef.current = updatedDeals;

  const updateDeal = useCallback((deal: Deal) => {
    setUpdatedDeals(prev => {
      const newMap = new Map(prev);
      newMap.set(deal.id, deal);
      return newMap;
    });
  }, []);

  // Access ref instead of state - stable reference
  const getUpdatedDeal = useCallback((dealId: string) => {
    return updatedDealsRef.current.get(dealId);
  }, []); // No dependencies - stable reference

  const clearUpdatedDeal = useCallback((dealId: string) => {
    setUpdatedDeals(prev => {
      const newMap = new Map(prev);
      newMap.delete(dealId);
      return newMap;
    });
  }, []);

  return (
    <DealUpdateContext.Provider value={{ updateDeal, getUpdatedDeal, clearUpdatedDeal }}>
      {children}
    </DealUpdateContext.Provider>
  );
};

export const useDealUpdate = () => {
  const context = useContext(DealUpdateContext);
  if (!context) {
    throw new Error('useDealUpdate must be used within a DealUpdateProvider');
  }
  return context;
};
