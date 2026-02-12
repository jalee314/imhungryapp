import '@testing-library/jest-native/extend-expect';
import {
  mockSupabase,
  resetSupabaseMocks,
} from './src/test-utils/mocks/supabaseMock';
import {
  mockImagePicker,
  mockMediaLibrary,
  mockFileSystem,
  mockNotifications,
  mockLinking,
  mockImageManipulator,
  mockSafeAreaContext,
  mockGestureHandler,
  mockLucideReactNative,
  mockGetRandomValues,
} from './src/test-utils/mocks/expoMocks';

// Apply crypto polyfill for react-native-get-random-values
mockGetRandomValues();

// Mock Supabase client
jest.mock('./lib/supabase', () => ({
  supabase: mockSupabase,
  clearAuthStorage: jest.fn().mockResolvedValue(undefined),
}));

// Reset Supabase mocks between tests
afterEach(() => {
  resetSupabaseMocks();
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({ uri: 'mock-uri' })),
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 37.7749, longitude: -122.4194 },
    })
  ),
  watchPositionAsync: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => mockImagePicker);

// Mock expo-media-library
jest.mock('expo-media-library', () => mockMediaLibrary);

// Mock expo-file-system
jest.mock('expo-file-system', () => mockFileSystem);

// Mock expo-notifications
jest.mock('expo-notifications', () => mockNotifications);

// Mock expo-linking
jest.mock('expo-linking', () => mockLinking);

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => mockImageManipulator);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => mockGestureHandler);

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => mockLucideReactNative);

// Mock react-native-get-random-values
jest.mock('react-native-get-random-values', () => ({}));

// Only silence React Native require cycle warnings
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Require cycle:')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global test timeout
jest.setTimeout(10000);
