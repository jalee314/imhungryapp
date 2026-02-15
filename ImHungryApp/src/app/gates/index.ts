/**
 * Gates Module
 *
 * Exports gate components for controlling app startup flow.
 * Gates block or overlay content based on loading states.
 *
 * - FontGate: Blocks rendering until fonts are loaded
 * - SplashGate: Displays animated splash overlay during loading
 */

export { FontGate, default } from './FontGate';
export type { FontGateProps } from './FontGate';

export { SplashGate } from './SplashGate';
export type { SplashGateProps } from './SplashGate';
