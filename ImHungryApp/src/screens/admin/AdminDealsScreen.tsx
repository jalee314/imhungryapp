import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import type { Deal } from '../../services/admin/types';
import { processImageWithEdgeFunction } from '../../services/imageProcessingService';
import { BRAND, GRAY, STATIC, SPACING, RADIUS } from '../../ui/alf';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';

import AdminHeader from '../../features/admin/sections/AdminHeader';
import AdminLoadingState from '../../features/admin/sections/AdminLoadingState';
import DealCard from '../../features/admin/sections/DealCard';
import DealEditModal from '../../features/admin/sections/DealEditModal';

const AdminDealsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedImageUri, setEditedImageUri] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);

  const loadDeals = async (query?: string) => {
    setLoading(true);
    try {
      const data = await adminService.getDeals(query);
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDeals(); }, []);

  const handleSearch = () => { loadDeals(searchQuery); };

  const handleDealPress = (deal: Deal) => {
    setSelectedDeal(deal);
    setEditedTitle(deal.title);
    setEditedDescription(deal.description || '');
    setEditedImageUri(deal.image_url);
    setImageChanged(false);
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setEditedImageUri(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setEditedImageUri(null);
    setImageChanged(true);
  };

  const handleDeleteDeal = async () => {
    if (!selectedDeal) return;
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this deal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await adminService.deleteDeal(selectedDeal.deal_instance_id);
          if (result.success) {
            Alert.alert('Success', 'Deal deleted');
            setEditModalVisible(false);
            loadDeals(searchQuery);
          } else {
            Alert.alert('Error', result.error || 'Failed to delete deal');
          }
        },
      },
    ]);
  };

  const handleUpdateDeal = async () => {
    if (!selectedDeal) return;
    try {
      let imageMetadataId: string | null | undefined = undefined;
      if (imageChanged) {
        if (editedImageUri) {
          const imageResult = await processImageWithEdgeFunction(editedImageUri, 'deal_image');
          if (imageResult.success && imageResult.metadataId) {
            imageMetadataId = imageResult.metadataId;
          }
        } else {
          imageMetadataId = null;
        }
      }
      const result = await adminService.updateDeal(selectedDeal.deal_instance_id, {
        title: editedTitle,
        description: editedDescription,
        image_metadata_id: imageMetadataId,
      });
      if (result.success) {
        Alert.alert('Success', 'Deal updated');
        setEditModalVisible(false);
        loadDeals(searchQuery);
      } else {
        Alert.alert('Error', result.error || 'Failed to update deal');
      }
    } catch (error) {
      console.error('Error updating deal:', error);
      Alert.alert('Error', 'Failed to update deal');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
      <AdminHeader title="Deal Management" showBack />

      {/* Search */}
      <Box
        row
        px="lg"
        py="md"
        bg={STATIC.white}
        gap="sm"
        borderWidth={1}
        borderColor={GRAY[300]}
        style={{ borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: GRAY[100],
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            fontSize: 14,
          }}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search deals by title..."
          placeholderTextColor={GRAY[500]}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={{
            backgroundColor: BRAND.accent,
            width: 40,
            height: 40,
            borderRadius: RADIUS.md,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="search" size={20} color={STATIC.white} />
        </TouchableOpacity>
      </Box>

      {loading ? (
        <AdminLoadingState />
      ) : deals.length === 0 ? (
        <Box flex={1} center>
          <Ionicons name="fast-food" size={64} color={GRAY[350]} />
          <Text size="lg" color={GRAY[600]} style={{ marginTop: SPACING.lg }}>No deals found</Text>
        </Box>
      ) : (
        <FlatList
          data={deals}
          renderItem={({ item }) => <DealCard deal={item} onPress={handleDealPress} />}
          keyExtractor={(item) => item.deal_instance_id}
          contentContainerStyle={{ padding: SPACING.md }}
        />
      )}

      <DealEditModal
        visible={editModalVisible}
        imageUri={editedImageUri}
        title={editedTitle}
        description={editedDescription}
        onClose={() => setEditModalVisible(false)}
        onTitleChange={setEditedTitle}
        onDescriptionChange={setEditedDescription}
        onPickImage={pickImage}
        onRemoveImage={removeImage}
        onSave={handleUpdateDeal}
        onDelete={handleDeleteDeal}
      />
    </SafeAreaView>
  );
};

export default AdminDealsScreen;
