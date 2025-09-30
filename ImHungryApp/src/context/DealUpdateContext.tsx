import React, { createContext, useContext, useState, useCallback } from 'react';
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

  const updateDeal = useCallback((deal: Deal) => {
    setUpdatedDeals(prev => {
      const newMap = new Map(prev);
      newMap.set(deal.id, deal);
      return newMap;
    });
  }, []);

  const getUpdatedDeal = useCallback((dealId: string) => {
    return updatedDeals.get(dealId);
  }, [updatedDeals]);

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
