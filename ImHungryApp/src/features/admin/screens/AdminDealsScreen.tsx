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
import { tokens, atoms as a } from '#/ui'
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
    ...a.flex_1,
    ...a.bg_gray_100,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.lg,
    ...a.bg_white,
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
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  searchContainer: {
    ...a.flex_row,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    ...a.bg_white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: tokens.space.sm,
  },
  searchInput: {
    ...a.flex_1,
    ...a.bg_gray_100,
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    fontSize: tokens.fontSize.sm,
  },
  searchButton: {
    ...a.bg_primary_500,
    width: 40,
    height: 40,
    borderRadius: tokens.space.sm,
    ...a.justify_center,
    ...a.align_center,
  },
  loadingContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    ...a.text_gray_500,
    marginTop: tokens.space.lg,
  },
  listContent: {
    padding: tokens.space.md,
  },
  dealCard: {
    ...a.bg_white,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    marginBottom: tokens.space.md,
    shadowColor: tokens.color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    marginBottom: tokens.space.md,
  },
  dealDate: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
  },
  dealTitle: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.sm,
  },
  dealInfo: {
    ...a.flex_row,
    ...a.align_center,
    marginBottom: tokens.space.xs,
    gap: 6,
  },
  dealInfoText: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
  },
  modalOverlay: {
    ...a.flex_1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...a.justify_end,
  },
  modalContent: {
    ...a.bg_white,
    borderTopLeftRadius: tokens.space.xl,
    borderTopRightRadius: tokens.space.xl,
    padding: tokens.space.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    marginBottom: tokens.space.xl,
  },
  modalTitle: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  label: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: '#333',
    marginBottom: tokens.space.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
    fontSize: tokens.fontSize.sm,
    marginBottom: tokens.space.lg,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    gap: tokens.space.md,
    marginTop: tokens.space.sm,
  },
  actionButton: {
    ...a.flex_row,
    ...a.align_center,
    ...a.justify_center,
    paddingVertical: tokens.space.md,
    borderRadius: tokens.space.sm,
    gap: tokens.space.sm,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
  },
  imagePreviewContainer: {
    ...a.relative,
    ...a.w_full,
    height: 200,
    marginBottom: tokens.space.lg,
    borderRadius: tokens.space.sm,
    ...a.overflow_hidden,
  },
  imagePreview: {
    ...a.w_full,
    height: '100%',
  },
  removeImageButton: {
    ...a.absolute,
    top: tokens.space.sm,
    right: tokens.space.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: tokens.space.md,
  },
  imagePickerButton: {
    ...a.bg_gray_100,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: tokens.space.sm,
    padding: tokens.space._3xl,
    ...a.align_center,
    ...a.justify_center,
    marginBottom: tokens.space.lg,
  },
  imagePickerText: {
    marginTop: tokens.space.sm,
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
  },
})

export default AdminDealsScreen
