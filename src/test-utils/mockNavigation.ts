/**
 * Mock navigation utilities for testing
 */

export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();
export const mockReset = jest.fn();
export const mockSetOptions = jest.fn();
export const mockSetParams = jest.fn();
export const mockAddListener = jest.fn(() => jest.fn());
export const mockRemoveListener = jest.fn();
export const mockIsFocused = jest.fn(() => true);
export const mockCanGoBack = jest.fn(() => true);
export const mockGetParent = jest.fn();
export const mockGetState = jest.fn(() => ({
  routes: [],
  index: 0,
}));

/**
 * Mock navigation object for useNavigation hook
 */
export const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  reset: mockReset,
  setOptions: mockSetOptions,
  setParams: mockSetParams,
  addListener: mockAddListener,
  removeListener: mockRemoveListener,
  isFocused: mockIsFocused,
  canGoBack: mockCanGoBack,
  getParent: mockGetParent,
  getState: mockGetState,
  dispatch: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
};

/**
 * Mock route object for useRoute hook
 */
export const createMockRoute = <T extends Record<string, unknown>>(
  name: string,
  params?: T
) => ({
  key: `${name}-key`,
  name,
  params: params || {},
});

/**
 * Reset all navigation mocks - call in beforeEach or afterEach
 */
export const resetNavigationMocks = () => {
  mockNavigate.mockClear();
  mockGoBack.mockClear();
  mockReset.mockClear();
  mockSetOptions.mockClear();
  mockSetParams.mockClear();
  mockAddListener.mockClear();
  mockRemoveListener.mockClear();
  mockIsFocused.mockClear();
  mockCanGoBack.mockClear();
  mockGetParent.mockClear();
  mockGetState.mockClear();
};

/**
 * Jest mock for @react-navigation/native
 * Usage: jest.mock('@react-navigation/native', () => require('./test-utils/mockNavigation').reactNavigationMock);
 */
export const reactNavigationMock = {
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => createMockRoute('MockScreen'),
  useFocusEffect: (callback: () => void) => callback(),
  useIsFocused: () => true,
};
