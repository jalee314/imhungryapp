/**
 * cards/index.tsx
 *
 * Re-exports all card components for convenient imports.
 * Follows Bluesky's pattern of namespace exports for composable components.
 *
 * Usage:
 *   // Default exports for backwards compatibility
 *   import { DealCard, RowCard, SquareCard } from '#/components/cards'
 *
 *   // Namespace imports for composable usage (recommended)
 *   import * as DealCard from '#/components/cards/DealCard'
 *   import * as RowCard from '#/components/cards/RowCard'
 *   import * as SquareCard from '#/components/cards/SquareCard'
 *
 *   // Base card building blocks
 *   import { Card, CardHeader, CardBody, CardFooter } from '#/components/cards'
 */

// ==========================================
// Card Components (New Pattern)
// ==========================================

// DealCard - for deal listings
export { default as DealCard, Deal } from './DealCard'
export * as DealCardComponents from './DealCard'

// RowCard - for horizontal list items
export { default as RowCard, RowCardData } from './RowCard'
export * as RowCardComponents from './RowCard'

// SquareCard - for grid items
export { default as SquareCard, SquareCardData } from './SquareCard'
export * as SquareCardComponents from './SquareCard'

// ==========================================
// Skeleton Components
// ==========================================

export { default as DealCardSkeleton } from './DealCardSkeleton'
export { default as RowCardSkeleton } from './RowCardSkeleton'

// ==========================================
// Base Card Building Blocks
// ==========================================

export { Card, CardHeader, CardBody, CardFooter, CardImage } from './Card'
