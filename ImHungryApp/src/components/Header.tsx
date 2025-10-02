import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onLocationPress?: () => void;
}

const Header: React.FC<HeaderProps> = memo(({ onLocationPress }) => {
  // const [imageLoaded, setImageLoaded] = useState(false);

  // Preload image immediately when component mounts
  // useEffect(() => {
  //   const preloadImage = async () => {
  //     try {
  //       // Use the same preload method as in App.tsx
  //       await Image.prefetch(Image.resolveAssetSource(require('../../img/hungri_logo.png')).uri);
  //       setImageLoaded(true);
  //     } catch (error) {
  //       console.error('Error preloading header image:', error);
  //       setImageLoaded(true); // Still show image even if preload fails
  //     }
  //   };

  //   preloadImage();
  // }, []);

  return (
    <View style={styles.header}>
      <View style={styles.headerBottomFrame}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../img/hungri_logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
            // Remove fadeDuration to prevent flickering
            fadeDuration={0}
            // Add these props for better performance
            cache="force-cache"
            // Show image immediately without waiting for onLoad
            onLoadStart={() => {}}
            onLoad={() => {}}
            onError={() => {}}
          />
        </View>
        <TouchableOpacity onPress={onLocationPress} style={styles.locationIconContainer}>
          <Ionicons name="location-sharp" size={26} color="#1D1B20" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Add display name for debugging
Header.displayName = 'Header';

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  headerBottomFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 19,
  },
  logoContainer: {
    height: 40,
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    // Remove height constraint to let it scale naturally
  },
  locationIconContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Header;