// Jest setup file

// Mock react-native
jest.mock('react-native', () => {
  return {
    View: 'View',
    Text: 'Text',
    StyleSheet: {
      create: (styles) => styles,
    },
    ActivityIndicator: 'ActivityIndicator',
    TouchableOpacity: 'TouchableOpacity',
    Image: 'Image',
    Dimensions: {
      get: () => ({ width: 393, height: 852 }),
    },
    Platform: {
      OS: 'ios',
      select: (obj) => obj.ios,
    },
    NativeModules: {
      BlobModule: {},
      StatusBarManager: { getHeight: jest.fn() },
    },
    TurboModuleRegistry: {
      get: jest.fn(() => null),
      getEnforcing: jest.fn(() => ({})),
    },
  };
});

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => {});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  TextInput: 'TextInput',
  Button: 'Button',
  Provider: ({ children }) => children,
}));

// Mock expo modules
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'imhungri://'),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  cacheDirectory: '/mock/cache/directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 0, longitude: 0 } })),
  watchPositionAsync: jest.fn(),
  Accuracy: { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 },
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('@monicon/native', () => ({
  Monicon: 'Monicon',
}));

jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  Heart: 'Heart',
  Search: 'Search',
  Plus: 'Plus',
  User: 'User',
  MapPin: 'MapPin',
  Clock: 'Clock',
  Star: 'Star',
  Trash2: 'Trash2',
  Edit: 'Edit',
  Settings: 'Settings',
  LogOut: 'LogOut',
  AlertCircle: 'AlertCircle',
  Check: 'Check',
  X: 'X',
}));

jest.mock('react-native-calendars', () => ({
  Calendar: 'Calendar',
  CalendarList: 'CalendarList',
  Agenda: 'Agenda',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// Mock supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null })),
    })),
  },
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

// Mock stores
jest.mock('./src/stores/AuthStore', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
  })),
  useInitializeAuth: jest.fn(),
}));

jest.mock('./src/stores/AdminStore', () => ({
  useAdminStore: jest.fn(() => ({
    isAdminMode: false,
  })),
  useInitializeAdmin: jest.fn(),
}));

jest.mock('./src/stores/DataCacheStore', () => ({
  useDataCacheStore: jest.fn(() => ({})),
  useInitializeDataCache: jest.fn(),
}));

jest.mock('./src/stores/LocationStore', () => ({
  useLocationStore: jest.fn(() => ({})),
  useInitializeLocation: jest.fn(),
}));

// Mock hooks
jest.mock('./src/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    isPasswordResetMode: false,
  }),
}));

jest.mock('./src/hooks/useAdmin', () => ({
  useAdmin: () => ({
    isAdminMode: false,
  }),
}));

// Silence console logs during tests (optional)
if (process.env.SILENCE_LOGS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
