/**
 * @file CuisineFilterBar — Cuisine pill filter row.
 *
 * Purely presentational. State & callbacks come from useFeed.
 */

import React from 'react';

import CuisineFilter from '../../../components/CuisineFilter';
import type { FeedCuisineFilter } from '../types';

export interface CuisineFilterBarProps {
  cuisineFilter: FeedCuisineFilter;
}

export function CuisineFilterBar({ cuisineFilter }: CuisineFilterBarProps) {
  const {
    selectedCuisineId,
    cuisinesWithDeals,
    cuisinesLoading,
    onFilterSelect,
  } = cuisineFilter;

  if (cuisinesLoading || cuisinesWithDeals.length === 0) return null;

  return (
    <CuisineFilter
      filters={cuisinesWithDeals.map(c => c.name)}
      selectedFilter={
        selectedCuisineId === 'All'
          ? 'All'
          : cuisinesWithDeals.find(c => c.id === selectedCuisineId)?.name || 'All'
      }
      onFilterSelect={onFilterSelect}
    />
  );
}
