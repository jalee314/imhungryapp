/**
 * Shell Tests
 * 
 * Tests for the Shell component structure to verify:
 * - Shell component exports correctly
 * - TabBar component exports correctly
 * - Module structure is correct
 */

import { Shell } from '../src/view/shell';
import ShellDefault from '../src/view/shell';
import { TabBar } from '../src/view/shell/TabBar';
import TabBarDefault from '../src/view/shell/TabBar';
import {
  RoutesContainer,
  OnboardingNavigator,
  AppNavigator,
  AdminNavigator,
} from '../src/Navigation';

describe('Shell Module', () => {
  describe('Exports', () => {
    it('should export Shell component from index', () => {
      expect(Shell).toBeDefined();
      expect(typeof Shell).toBe('function');
    });

    it('should export default Shell from index', () => {
      expect(ShellDefault).toBeDefined();
      expect(typeof ShellDefault).toBe('function');
    });
  });
});

describe('TabBar Module', () => {
  describe('Exports', () => {
    it('should export TabBar component', () => {
      expect(TabBar).toBeDefined();
      expect(typeof TabBar).toBe('function');
    });

    it('should export default TabBar', () => {
      expect(TabBarDefault).toBeDefined();
      expect(typeof TabBarDefault).toBe('function');
    });
  });
});

describe('Shell Component Structure', () => {
  it('should be a React functional component', () => {
    expect(typeof Shell).toBe('function');
    expect(Shell.name).toBe('Shell');
  });

  it('should have Navigation dependencies available', () => {
    expect(RoutesContainer).toBeDefined();
    expect(OnboardingNavigator).toBeDefined();
    expect(AppNavigator).toBeDefined();
    expect(AdminNavigator).toBeDefined();
  });
});

describe('View Directory Structure', () => {
  it('should have shell directory with index.tsx', () => {
    expect(Shell).toBeDefined();
  });

  it('should have shell directory with TabBar.tsx', () => {
    expect(TabBar).toBeDefined();
  });
});
