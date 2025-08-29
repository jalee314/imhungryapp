# ImHungry App

A React Native app with a beautiful linear gradient background from #FFF5AB to #FFE100.

## Features

- Linear gradient background using react-native-linear-gradient
- Clean, modern UI design
- Cross-platform (iOS & Android)
- TypeScript support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Navigate to the project directory:
   ```bash
   cd ImHungryApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

#### For iOS:
```bash
npm run ios
```

#### For Android:
```bash
npm run android
```

#### For Web:
```bash
npm run web
```

#### Using Expo Go (for testing on physical devices):
```bash
npx expo start
```

## Project Structure

- `App.tsx` - Main application component with gradient background
- `app.json` - Expo configuration
- `package.json` - Dependencies and scripts

## Gradient Configuration

The app uses a linear gradient from:
- Start color: #FFF5AB (light yellow)
- End color: #FFE100 (bright yellow)

The gradient flows from top to bottom, creating a warm, appetizing background perfect for a food-related app.

## Customization

To modify the gradient colors, edit the `colors` prop in `App.tsx`:

```typescript
<LinearGradient
  colors={['#FFF5AB', '#FFE100']} // Change these colors
  style={styles.container}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
>
```

## Dependencies

- `react-native-linear-gradient` - For creating the gradient background
- `expo` - Development platform
- `react-native` - Core framework

## Building for Production

### iOS
```bash
npx expo build:ios
```

### Android
```bash
npx expo build:android
```

## License

This project is open source and available under the MIT License.
