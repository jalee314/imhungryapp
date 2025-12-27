/**
 * cards/index.tsx
 *
 * Re-exports all card components for convenient imports.
 *
 * Usage:
 *   import { DealCard, RowCard, SquareCard } from '#/components/cards'
 */

// Legacy exports - these still use old styles
// Will be gradually migrated to use ui atoms
export { default as DealCard } from '../DealCard'
export { default as RowCard } from '../RowCard'
export { default as SquareCard } from '../SquareCard'

// New card components using ui system
export { Card, CardHeader, CardBody, CardFooter } from './Card'
