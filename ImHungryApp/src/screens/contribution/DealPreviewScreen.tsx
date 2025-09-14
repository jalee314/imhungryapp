import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface Restaurant {
  id: string;
  name: string;
  subtext: string;
}

interface DealPreviewScreenProps {
    visible: boolean;
    onClose: () => void;
    onPost: () => void;
    dealTitle: string;
    dealDetails: string;
    imageUri: string | null;
    expirationDate: string | null;
    selectedRestaurant: Restaurant | null;
    selectedCategories: string[];
}

const DealPreviewScreen: React.FC<DealPreviewScreenProps> = ({
    visible,
    onClose,
    onPost,
    dealTitle,
    dealDetails,
    imageUri,
    expirationDate,
    selectedRestaurant,
    selectedCategories,
}) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString || dateString === 'Unknown') return 'Not Known';
        const date = new Date(dateString);
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const categoryText = selectedCategories.join(' & ');

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="#404040" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postButton} onPress={onPost}>
                        <Text style={styles.postButtonText}>POST</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        <View style={styles.restaurantHeader}>
                            <View style={styles.restaurantInfo}>
                                <Text style={styles.restaurantName}>{selectedRestaurant?.name}</Text>
                                <Text style={styles.restaurantSubtext}>{categoryText}</Text>
                                <Text style={styles.restaurantSubtext}>{selectedRestaurant?.subtext}</Text>
                                <Text style={styles.restaurantSubtext}>Expires - {formatDate(expirationDate)}</Text>
                            </View>
                            <Ionicons name="navigate-circle-outline" size={24} color="black" />
                        </View>

                        {imageUri && <Image source={{ uri: imageUri }} style={styles.dealImage} />}
                        <Text style={styles.dealTitle}>{dealTitle}</Text>
                        {dealDetails ? <Text style={styles.dealDetails}>{dealDetails}</Text> : null}

                        <View style={styles.sharedByContainer}>
                            <Image source={require('../../../img/Default_pfp.svg.png')} style={styles.pfp} />
                            <View>
                                <Text style={styles.sharedByText}><Text style={{ fontWeight: 'bold' }}>Shared By:</Text> The Hungry Monster</Text>
                                <Text style={styles.sharedByText}>Fullerton, California</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  postButton: {
    backgroundColor: '#FF8C4C',
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContainer: {
    alignItems: 'center',
    padding: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 8,
  },
  restaurantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  restaurantSubtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#555555',
    lineHeight: 18,
  },
  dealImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
  },
  dealTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
  },
  dealDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: '#757575',
  },
  sharedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#EAEAEA',
    marginTop: 8,
  },
  pfp: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sharedByText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.02,
    color: '#000000',
  },
});

export default DealPreviewScreen;