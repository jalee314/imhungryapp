/**
 * Expo and React Native Module Mocks for Tests
 *
 * Provides mocks for native modules that don't work in the Jest environment.
 * Import this in jest.setup.ts to apply all mocks globally.
 */

// expo-image-picker
export const mockImagePicker = {
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file://mock-image.jpg',
        width: 800,
        height: 600,
        type: 'image',
        fileName: 'mock-image.jpg',
        fileSize: 12345,
      },
    ],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file://mock-camera-image.jpg',
        width: 1920,
        height: 1080,
        type: 'image',
        fileName: 'mock-camera-image.jpg',
        fileSize: 54321,
      },
    ],
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  }),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
  UIImagePickerControllerQualityType: {},
  UIImagePickerPresentationStyle: {},
};

// expo-media-library
export const mockMediaLibrary = {
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  getAssetsAsync: jest.fn().mockResolvedValue({
    assets: [],
    endCursor: '',
    hasNextPage: false,
    totalCount: 0,
  }),
  saveToLibraryAsync: jest.fn().mockResolvedValue(undefined),
  createAssetAsync: jest.fn().mockResolvedValue({ id: 'mock-asset-id' }),
};

// expo-file-system
export const mockFileSystem = {
  documentDirectory: 'file://mock-document-directory/',
  cacheDirectory: 'file://mock-cache-directory/',
  downloadAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-downloaded-file',
    status: 200,
  }),
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: true,
    isDirectory: false,
    size: 12345,
    modificationTime: Date.now(),
    uri: 'file://mock-file',
  }),
  readAsStringAsync: jest.fn().mockResolvedValue('mock-file-content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
};

// expo-notifications
export const mockNotifications = {
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({
    data: 'ExponentPushToken[mock-token]',
  }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setBadgeCountAsync: jest.fn().mockResolvedValue(true),
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
    MAX: 5,
    MIN: 1,
    NONE: 0,
  },
};

// expo-linking
export const mockLinking = {
  createURL: jest.fn((path: string) => `exp://mock/${path}`),
  parse: jest.fn((url: string) => ({ path: url, queryParams: {} })),
  openURL: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
  getInitialURL: jest.fn().mockResolvedValue(null),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

// expo-image-manipulator
export const mockImageManipulator = {
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-manipulated-image.jpg',
    width: 800,
    height: 600,
  }),
  FlipType: {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
  },
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
};

// react-native-get-random-values (crypto polyfill)
export const mockGetRandomValues = () => {
  if (typeof global.crypto === 'undefined') {
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
      },
    });
  }
};

// react-native-safe-area-context
export const mockSafeAreaContext = {
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })),
  useSafeAreaFrame: jest.fn(() => ({
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  })),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 375, height: 812 },
    insets: { top: 44, right: 0, bottom: 34, left: 0 },
  },
};

// react-native-gesture-handler
export const mockGestureHandler = {
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  State: {},
  ScrollView: 'ScrollView',
  Slider: 'Slider',
  Switch: 'Switch',
  TextInput: 'TextInput',
  ToolbarAndroid: 'ToolbarAndroid',
  ViewPagerAndroid: 'ViewPagerAndroid',
  DrawerLayoutAndroid: 'DrawerLayoutAndroid',
  WebView: 'WebView',
  NativeViewGestureHandler: 'NativeViewGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  FlingGestureHandler: 'FlingGestureHandler',
  ForceTouchGestureHandler: 'ForceTouchGestureHandler',
  LongPressGestureHandler: 'LongPressGestureHandler',
  PanGestureHandler: 'PanGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  RotationGestureHandler: 'RotationGestureHandler',
  RawButton: 'RawButton',
  BaseButton: 'BaseButton',
  RectButton: 'RectButton',
  BorderlessButton: 'BorderlessButton',
  FlatList: 'FlatList',
  gestureHandlerRootHOC: jest.fn(),
  Directions: {},
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
};

// lucide-react-native icons mock - returns valid React components
// Uses dynamic require to ensure React is available at render time
export const mockLucideReactNative = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        // Return a functional component that requires React at render time
        const MockIcon = function (props: Record<string, unknown>) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const ReactRN = require('react');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { View } = require('react-native');
          return ReactRN.createElement(View, { testID: `lucide-${prop}`, ...props });
        };
        MockIcon.displayName = prop;
        return MockIcon;
      }
      return undefined;
    },
  }
);

// Apply all mocks (call this in jest.setup.ts)
export const applyExpoMocks = () => {
  jest.mock('expo-image-picker', () => mockImagePicker);
  jest.mock('expo-media-library', () => mockMediaLibrary);
  jest.mock('expo-file-system', () => mockFileSystem);
  jest.mock('expo-notifications', () => mockNotifications);
  jest.mock('expo-linking', () => mockLinking);
  jest.mock('expo-image-manipulator', () => mockImageManipulator);
  jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
  jest.mock('react-native-gesture-handler', () => mockGestureHandler);
  jest.mock('lucide-react-native', () => mockLucideReactNative);

  // Apply crypto polyfill
  mockGetRandomValues();
};
