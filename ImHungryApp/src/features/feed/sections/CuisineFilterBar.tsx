/**
 * @file CuisineFilterBar — Cuisine pill filter row.
 *
 * Purely presentational. State & callbacks come from useFeed.
 */

import React, { memo, useMemo } from 'react';

import CuisineFilter from '../../../components/CuisineFilter';
import type { FeedCuisineFilter } from '../types';

export interface CuisineFilterBarProps {
  cuisineFilter: FeedCuisineFilter;
}

function CuisineFilterBarComponent({ cuisineFilter }: CuisineFilterBarProps) {
  const {
    selectedCuisineId,
    cuisinesWithDeals,
    cuisinesLoading,
    onFilterSelect,
  } = cuisineFilter;
  const filterNames = useMemo(
    () => cuisinesWithDeals.map((cuisine) => cuisine.name),
    [cuisinesWithDeals],
  );
  const selectedFilterName = useMemo(() => {
    if (selectedCuisineId === 'All') return 'All';
    return cuisinesWithDeals.find((cuisine) => cuisine.id === selectedCuisineId)?.name || 'All';
  }, [selectedCuisineId, cuisinesWithDeals]);

  if (cuisinesLoading || cuisinesWithDeals.length === 0) return null;

  return (
    <CuisineFilter
      filters={filterNames}
      selectedFilter={selectedFilterName}
      onFilterSelect={onFilterSelect}
    />
  );
}

export const CuisineFilterBar = memo(CuisineFilterBarComponent);
