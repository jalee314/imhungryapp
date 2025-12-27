/**
 * screens/admin/AdminDealsScreen.tsx
 *
 * Admin deal management screen - refactored to use React Query.
 * Uses useAdminDealsQuery + useAdminDealMutations for server state.
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { Deal } from '#/services/adminService'
import { processImageWithEdgeFunction } from '#/services/imageProcessingService'
import { Ionicons } from '@expo/vector-icons'
import { Monicon } from '@monicon/native'
import { useAdminDealsQuery, useAdminDealMutations } from '#/state/queries/admin'

const AdminDealsScreen: React.FC = () => {
  const navigation = useNavigation()
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedImageUri, setEditedImageUri] = useState<string | null>(null)
  const [imageChanged, setImageChanged] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // React Query hooks
  const { deals, isLoading, refetch } = useAdminDealsQuery({ searchQuery })
  const { deleteDeal, updateDeal } = useAdminDealMutations()

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput)
  }, [searchInput])

  const handleDealPress = useCallback((deal: Deal) => {
    setSelectedDeal(deal)
    setEditedTitle(deal.title)
    setEditedDescription(deal.description || '')
    setEditedImageUri(deal.image_url)
    setImageChanged(false)
    setEditModalVisible(true)
  }, [])

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setEditedImageUri(result.assets[0].uri)
        setImageChanged(true)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const removeImage = () => {
    setEditedImageUri(null)
    setImageChanged(true)
  }

  const handleDeleteDeal = () => {
    if (!selectedDeal) return

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this deal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeal.mutateAsync(selectedDeal.deal_instance_id)
              Alert.alert('Success', 'Deal deleted')
              setEditModalVisible(false)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete deal')
            }
          },
        },
      ]
    )
  }

  const handleUpdateDeal = async () => {
    if (!selectedDeal) return

    setIsUpdating(true)
    try {
      // Handle image upload if changed
      let imageMetadataId: string | null | undefined = undefined
      if (imageChanged) {
        if (editedImageUri) {
          // Upload new image
          const imageResult = await processImageWithEdgeFunction(editedImageUri, 'deal_image')
          if (imageResult.success && imageResult.metadataId) {
            imageMetadataId = imageResult.metadataId
          }
        } else {
          // Remove image
          imageMetadataId = null
        }
      }

      await updateDeal.mutateAsync({
        dealId: selectedDeal.deal_instance_id,
        title: editedTitle,
        description: editedDescription,
        imageMetadataId,
      })

      Alert.alert('Success', 'Deal updated')
      setEditModalVisible(false)
    } catch (error: any) {
      console.error('Error updating deal:', error)
      Alert.alert('Error', error.message || 'Failed to update deal')
    } finally {
      setIsUpdating(false)
    }
  }

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity style={styles.dealCard} onPress={() => handleDealPress(item)}>
      <View style={styles.dealHeader}>
        <Text style={styles.dealDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.dealTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.dealInfo}>
        <Ionicons name="restaurant" size={14} color="#666" />
        <Text style={styles.dealInfoText}>{item.restaurant_name}</Text>
      </View>

      {item.category_name && (
        <View style={styles.dealInfo}>
          <Ionicons name="pricetag" size={14} color="#666" />
          <Text style={styles.dealInfoText}>{item.category_name}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deal Management</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search deals by title..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA05C" />
        </View>
      ) : deals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fast-food" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No deals found</Text>
        </View>
      ) : (
        <FlatList
          data={deals}
          renderItem={renderDeal}
          keyExtractor={(item) => item.deal_instance_id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Deal</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Deal Image</Text>
              {editedImageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: editedImageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text style={styles.imagePickerText}>Add Photo</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={editedTitle}
                onChangeText={setEditedTitle}
                multiline
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedDescription}
                onChangeText={setEditedDescription}
                multiline
                numberOfLines={4}
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.updateButton]}
                  onPress={handleUpdateDeal}
                  disabled={isUpdating || updateDeal.isPending}
                >
                  {isUpdating || updateDeal.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteDeal}
                  disabled={deleteDeal.isPending}
                >
                  {deleteDeal.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Monicon name="uil:trash-alt" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Delete Deal</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

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
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#FFA05C',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  listContent: {
    padding: 12,
  },
  dealCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dealDate: {
    fontSize: 12,
    color: '#666',
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  dealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  dealInfoText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  imagePickerButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
})

export default AdminDealsScreen
