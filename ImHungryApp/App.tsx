import { useFonts } from 'expo-font';
import LandingScreen from './src/screens/LandingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Mitr-Bold': require('./assets/fonts/Mitr-Bold.ttf'),
  });

  return fontsLoaded ? <LandingScreen /> : null;
}
