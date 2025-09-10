import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OutlinedText from '../../components/OutlinedText';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['rgba(255, 245, 171, 0.5)', 'rgba(255, 225, 0, 0.5)']}
      style={styles.centered}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="dark" />
      <Pressable
        style={styles.fill}
        onPress={() => navigation.navigate('SignUp' as never)}
        accessibilityRole="button"
        accessibilityLabel="Continue to sign up"
        hitSlop={8}
      >
        <OutlinedText />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
