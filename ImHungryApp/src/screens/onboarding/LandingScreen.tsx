import React from 'react';
import { StyleSheet, Pressable, View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.centered}>
      <StatusBar style="dark" />
      <Pressable
        style={styles.fill}
        onPress={() => navigation.navigate('SignUp' as never)}
        accessibilityRole="button"
        accessibilityLabel="Continue to sign up"
        hitSlop={8}
      >
        <Image 
          source={require('../../../img/testimg.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: 365,
    height: 400,
    maxWidth: '90%',
  },
});
