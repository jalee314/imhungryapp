import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';

import LandingScreen from './src/screens/LandingScreen';
import SignUp from './src/screens/SignUp';
import UsernameScreen from './src/screens/UsernameScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Mitr-Bold': require('./assets/fonts/Mitr-Bold.ttf'),
    'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
  }); 
  
  const [timeoutReached, setTimeoutReached] = React.useState(false);



  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
      console.log('Loading timeout');
    }, 3000);

    if (fontsLoaded) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (fontError) {
    console.log('Font loading error:', fontError);
  }

  if (!fontsLoaded && !fontError && !timeoutReached) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Username" component={UsernameScreen} />
        {/* <Stack.Screen name= "Profile Photo" component={ProfilePhoto}/> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}