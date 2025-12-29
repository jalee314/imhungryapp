/**
 * screens/admin/AdminReportsScreen.tsx
 *
 * Admin content moderation screen - refactored to use React Query.
 * Uses useAdminReportsQuery + useAdminReportMutations for server state.
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
  RefreshControl,
} from 'react-native'
import { tokens, atoms as a } from '#/ui'
import { useNavigation } from '@react-navigation/native'
import { Report, ReportCounts } from '#/services/adminService'
import { Ionicons } from '@expo/vector-icons'
import { Monicon } from '@monicon/native'
import { useAdminReportsQuery, useAdminReportMutations } from '#/state/queries/admin'

type ReportFilter = 'pending' | 'review' | 'resolved' | 'all'

const STATUS_COLORS: Record<Report['status'], string> = {
  pending: '#FFA05C',
  review: '#3F51B5',
  resolved: '#4CAF50',
}

const STATUS_LABELS: Record<Report['status'], string> = {
  pending: 'Pending',
  review: 'In Review',
  resolved: 'Resolved',
}

const AdminReportsScreen: React.FC = () => {
  const navigation = useNavigation()
  
  // Local UI state
  const [statusFilter, setStatusFilter] = useState<ReportFilter>('pending')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [reasonInput, setReasonInput] = useState('')
  const [suspensionDays, setSuspensionDays] = useState('7')
  const [refreshing, setRefreshing] = useState(false)

  // React Query hooks
  const { reports, counts, isLoading, refetch } = useAdminReportsQuery({ statusFilter })
  const { updateReportStatus, dismissReport, resolveReportWithAction } = useAdminReportMutations()

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleReportPress = useCallback((report: Report) => {
    setSelectedReport(report)
    setActionModalVisible(true)
  }, [])

  const closeActionModal = () => {
    setActionModalVisible(false)
    setSelectedReport(null)
    setReasonInput('')
    setSuspensionDays('7')
  }

  const getCountForFilter = (filter: ReportFilter) => {
    if (filter === 'all') {
      return counts.total
    }
    return counts[filter]
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '—'
    return new Date(timestamp).toLocaleString()
  }

  const statusFilters: Array<{ label: string; value: ReportFilter; countKey: keyof ReportCounts }> = [
    { label: 'Pending', value: 'pending', countKey: 'pending' },
    { label: 'In Review', value: 'review', countKey: 'review' },
    { label: 'Resolved', value: 'resolved', countKey: 'resolved' },
    { label: 'All', value: 'all', countKey: 'total' },
  ]

  const handleDismiss = async () => {
    if (!selectedReport) return

    try {
      await dismissReport.mutateAsync(selectedReport.report_id)
      Alert.alert('Success', 'Report dismissed')
      closeActionModal()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to dismiss report')
    }
  }

  const handleAction = async (action: 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user') => {
    if (!selectedReport) return

    try {
      await resolveReportWithAction.mutateAsync({
        reportId: selectedReport.report_id,
        action,
        dealId: selectedReport.deal_id,
        userId: selectedReport.uploader_user_id,
        reason: reasonInput || undefined,
        suspensionDays: action === 'suspend_user' ? parseInt(suspensionDays, 10) : undefined,
      })
      Alert.alert('Success', `Action completed: ${action.replace('_', ' ')}`)
      closeActionModal()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to perform action')
    }
  }

  const handleWorkflowStatusChange = async (nextStatus: 'pending' | 'review') => {
    if (!selectedReport) return
    const message =
      nextStatus === 'review'
        ? 'Report marked as in review.'
        : 'Report moved back to pending.'

    try {
      await updateReportStatus.mutateAsync({
        reportId: selectedReport.report_id,
        status: nextStatus,
      })
      Alert.alert('Success', message)
      closeActionModal()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update report status')
    }
  }

  const isBusy =
    dismissReport.isPending ||
    resolveReportWithAction.isPending ||
    updateReportStatus.isPending

  const renderReport = ({ item }: { item: Report }) => {
    const badgeColor = STATUS_COLORS[item.status]
    const actionLabel = item.resolution_action
      ? item.resolution_action.replace(/_/g, ' ')
      : null

    return (
      <TouchableOpacity style={styles.reportCard} onPress={() => handleReportPress(item)}>
        <View style={styles.reportHeader}>
          <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}1A` }]}>
            <Text style={[styles.statusText, { color: badgeColor }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
          <Text style={styles.reportDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.reportTitle} numberOfLines={2}>
          {item.deal?.title || 'Unknown Deal'}
        </Text>

        {item.deal?.restaurant_name && (
          <View style={styles.reportInfo}>
            <Text style={styles.reportLabel}>Restaurant:</Text>
            <Text style={styles.reportValue}>{item.deal.restaurant_name}</Text>
          </View>
        )}

        <View style={styles.reportInfo}>
          <Text style={styles.reportLabel}>Reason:</Text>
          <Text style={styles.reportValue}>{item.reason_code?.reason_code || 'Unknown'}</Text>
        </View>

        <View style={styles.reportInfo}>
          <Text style={styles.reportLabel}>Reporter:</Text>
          <Text style={styles.reportValue}>{item.reporter?.display_name || 'Anonymous'}</Text>
        </View>

        <View style={styles.reportInfo}>
          <Text style={styles.reportLabel}>Uploader:</Text>
          <Text style={styles.reportValue}>{item.uploader?.display_name || 'Unknown'}</Text>
        </View>

        {actionLabel && (
          <View style={styles.reportInfo}>
            <Text style={styles.reportLabel}>Action:</Text>
            <Text style={styles.reportValue}>{actionLabel}</Text>
          </View>
        )}

        {item.reason_text && (
          <View style={styles.reasonTextContainer}>
            <Text style={styles.reasonText}>{item.reason_text}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.viewButton} onPress={() => handleReportPress(item)}>
          <Text style={styles.viewButtonText}>Review Report</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  const renderListHeader = () => {
    const activeLabel = statusFilter === 'all' ? 'All' : STATUS_LABELS[statusFilter]
    const activeCount = getCountForFilter(statusFilter)

    return (
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Status Filters</Text>
        <View style={styles.filterContainer}>
          {statusFilters.map((option) => {
            const isActive = statusFilter === option.value
            const count = counts[option.countKey]

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(option.value)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {option.label}
                </Text>
                <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                  <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
        <Text style={styles.filterHelperText}>
          Showing {activeCount} {activeLabel.toLowerCase()} {activeCount === 1 ? 'report' : 'reports'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Moderation</Text>
        <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA05C" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.report_id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={[
            styles.listContent,
            reports.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={styles.emptyText}>
                No{' '}
                {statusFilter === 'all'
                  ? ''
                  : `${STATUS_LABELS[statusFilter].toLowerCase()} `}
                reports!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              tintColor="#FFA05C"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeActionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Report</Text>
              <TouchableOpacity onPress={closeActionModal}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Deal Preview */}
              {selectedReport?.deal?.image_url && (
                <Image
                  source={{ uri: selectedReport.deal.image_url }}
                  style={styles.dealImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.dealInfoSection}>
                <Text style={styles.dealTitle}>{selectedReport?.deal?.title || 'Unknown Deal'}</Text>
                {selectedReport?.deal?.description && (
                  <Text style={styles.dealDescription}>{selectedReport.deal.description}</Text>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="restaurant" size={16} color="#666" />
                  <Text style={styles.infoText}>{selectedReport?.deal?.restaurant_name || 'Unknown'}</Text>
                </View>
              </View>

              {selectedReport && (
                <View style={styles.statusSummarySection}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.statusChipRow}>
                    <View
                      style={[
                        styles.statusChip,
                        { borderColor: STATUS_COLORS[selectedReport.status] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: STATUS_COLORS[selectedReport.status] },
                        ]}
                      >
                        {STATUS_LABELS[selectedReport.status]}
                      </Text>
                    </View>
                    {selectedReport.resolution_action && (
                      <View style={[styles.statusChip, styles.neutralStatusChip]}>
                        <Text style={styles.statusChipText}>
                          {selectedReport.resolution_action.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Report Details */}
              <View style={styles.reportDetailsSection}>
                <Text style={styles.sectionTitle}>Report Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{selectedReport?.reason_code?.reason_code || 'Unknown'}</Text>
                </View>
                {selectedReport?.reason_text && (
                  <View style={styles.reasonTextBox}>
                    <Text style={styles.detailLabel}>Additional Info:</Text>
                    <Text style={styles.reasonText}>{selectedReport.reason_text}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reported by:</Text>
                  <Text style={styles.detailValue}>{selectedReport?.reporter?.display_name || 'Anonymous'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Uploader:</Text>
                  <Text style={styles.detailValue}>{selectedReport?.uploader?.display_name || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport ? new Date(selectedReport.created_at).toLocaleString() : 'Unknown'}
                  </Text>
                </View>
              </View>

              {selectedReport && (
                <View style={styles.lifecycleSection}>
                  <Text style={styles.sectionTitle}>Timeline</Text>
                  <View style={styles.lifecycleRow}>
                    <Text style={styles.lifecycleLabel}>Created</Text>
                    <Text style={styles.lifecycleValue}>{formatTimestamp(selectedReport.created_at)}</Text>
                  </View>
                  <View style={styles.lifecycleRow}>
                    <Text style={styles.lifecycleLabel}>Last Update</Text>
                    <Text style={styles.lifecycleValue}>{formatTimestamp(selectedReport.updated_at)}</Text>
                  </View>
                  <View style={styles.lifecycleRow}>
                    <Text style={styles.lifecycleLabel}>Resolved By</Text>
                    <Text style={styles.lifecycleValue}>{selectedReport.resolved_by || '—'}</Text>
                  </View>
                </View>
              )}

              <View style={styles.workflowSection}>
                <Text style={styles.sectionTitle}>Workflow</Text>
                <Text style={styles.workflowHelperText}>
                  Move reports between queues before taking enforcement action.
                </Text>
                <View style={styles.workflowButtons}>
                  {selectedReport?.status !== 'review' && (
                    <TouchableOpacity
                      style={[
                        styles.workflowButton,
                        isBusy && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleWorkflowStatusChange('review')}
                      disabled={isBusy}
                    >
                      {updateReportStatus.isPending ? (
                        <ActivityIndicator color="#0D47A1" />
                      ) : (
                        <Text style={styles.workflowButtonText}>Mark In Review</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {selectedReport?.status !== 'pending' && (
                    <TouchableOpacity
                      style={[
                        styles.workflowButton,
                        styles.workflowButtonSecondary,
                        isBusy && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleWorkflowStatusChange('pending')}
                      disabled={isBusy}
                    >
                      {updateReportStatus.isPending ? (
                        <ActivityIndicator color="#37474F" />
                      ) : (
                        <Text style={styles.workflowButtonSecondaryText}>Move to Pending</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Actions</Text>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.dismissButton, isBusy && styles.actionButtonDisabled]}
                  onPress={handleDismiss}
                  disabled={isBusy}
                >
                  {dismissReport.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Dismiss Report</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteDealButton, isBusy && styles.actionButtonDisabled]}
                  onPress={() => handleAction('delete_deal')}
                  disabled={isBusy}
                >
                  {resolveReportWithAction.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Monicon name="uil:trash-alt" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Delete Deal</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.warnButton, isBusy && styles.actionButtonDisabled]}
                  onPress={() => handleAction('warn_user')}
                  disabled={isBusy}
                >
                  {resolveReportWithAction.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="warning" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Warn User</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.suspendSection}>
                  <TextInput
                    style={styles.daysInput}
                    value={suspensionDays}
                    onChangeText={setSuspensionDays}
                    keyboardType="number-pad"
                    placeholder="Days"
                    editable={!isBusy}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.suspendButton, isBusy && styles.actionButtonDisabled]}
                    onPress={() => handleAction('suspend_user')}
                    disabled={isBusy}
                  >
                    {resolveReportWithAction.isPending ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="time" size={20} color="#FFF" />
                        <Text style={styles.actionButtonText}>Suspend User</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.reasonInput}
                  value={reasonInput}
                  onChangeText={setReasonInput}
                  placeholder="Reason for ban/suspension (optional)"
                  multiline
                  numberOfLines={3}
                  editable={!isBusy}
                />

                <TouchableOpacity
                  style={[styles.actionButton, styles.banButton, isBusy && styles.actionButtonDisabled]}
                  onPress={() => handleAction('ban_user')}
                  disabled={isBusy}
                >
                  {resolveReportWithAction.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="ban" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Ban User Permanently</Text>
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
  refreshButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
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
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space._2xl,
    gap: tokens.space.md,
  },
  emptyListContent: {
    flexGrow: 1,
    ...a.justify_center,
  },
  listHeader: {
    ...a.bg_white,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    marginBottom: tokens.space.md,
    shadowColor: tokens.color.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterContainer: {
    ...a.flex_row,
    ...a.flex_wrap,
    gap: tokens.space.sm,
    marginTop: tokens.space.md,
  },
  filterChip: {
    ...a.flex_row,
    ...a.align_center,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...a.rounded_full,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.sm,
    ...a.bg_white,
  },
  filterChipActive: {
    ...a.border_primary_500,
    backgroundColor: '#FFF3E6',
  },
  filterChipText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: '#333',
    marginRight: tokens.space.sm,
  },
  filterChipTextActive: {
    color: '#E66F1E',
  },
  filterCountBadge: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...a.rounded_full,
    backgroundColor: '#F0F0F0',
    ...a.align_center,
  },
  filterCountBadgeActive: {
    ...a.bg_primary_500,
  },
  filterCountText: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: '#555',
  },
  filterCountTextActive: {
    ...a.text_white,
  },
  filterHelperText: {
    marginTop: tokens.space.md,
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
  },
  reportCard: {
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
  reportHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    marginBottom: tokens.space.md,
  },
  statusBadge: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
    borderRadius: tokens.space.md,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  statusText: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: '#E66F1E',
  },
  reportDate: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
  },
  reportTitle: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.md,
  },
  reportInfo: {
    ...a.flex_row,
    marginBottom: 6,
  },
  reportLabel: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
    fontWeight: tokens.fontWeight.semibold,
    width: 80,
  },
  reportValue: {
    fontSize: tokens.fontSize.sm,
    ...a.text_black,
    ...a.flex_1,
  },
  reasonTextContainer: {
    ...a.bg_gray_100,
    padding: tokens.space.md,
    borderRadius: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
  viewButton: {
    ...a.bg_primary_500,
    paddingVertical: 10,
    borderRadius: tokens.space.sm,
    ...a.align_center,
    marginTop: tokens.space.md,
  },
  viewButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
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
    maxHeight: '85%',
  },
  modalHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    marginBottom: tokens.space.lg,
    paddingBottom: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  dealImage: {
    width: '100%',
    height: 200,
    borderRadius: tokens.space.md,
    marginBottom: tokens.space.lg,
  },
  dealInfoSection: {
    marginBottom: tokens.space.xl,
  },
  dealTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.sm,
  },
  dealDescription: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
    marginBottom: tokens.space.sm,
    lineHeight: 20,
  },
  infoRow: {
    ...a.flex_row,
    ...a.align_center,
    gap: tokens.space.sm,
    marginTop: tokens.space.xs,
  },
  infoText: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
  },
  reportDetailsSection: {
    ...a.bg_gray_100,
    padding: tokens.space.lg,
    borderRadius: tokens.space.md,
    marginBottom: tokens.space.xl,
  },
  statusSummarySection: {
    marginBottom: tokens.space.xl,
  },
  statusChipRow: {
    ...a.flex_row,
    ...a.flex_wrap,
    gap: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: '#DDD',
    ...a.rounded_full,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 6,
  },
  statusChipText: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.semibold,
    textTransform: 'uppercase',
    color: '#333',
  },
  neutralStatusChip: {
    borderColor: '#BDBDBD',
  },
  sectionTitle: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.md,
  },
  detailRow: {
    ...a.flex_row,
    marginBottom: tokens.space.sm,
  },
  detailLabel: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_gray_500,
    width: 100,
  },
  detailValue: {
    fontSize: tokens.fontSize.sm,
    ...a.text_black,
    ...a.flex_1,
  },
  reasonTextBox: {
    marginVertical: tokens.space.sm,
  },
  reasonText: {
    fontSize: tokens.fontSize.sm,
    color: '#333',
    marginTop: tokens.space.xs,
    lineHeight: 20,
  },
  lifecycleSection: {
    ...a.bg_white,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: tokens.space.xl,
  },
  lifecycleRow: {
    ...a.flex_row,
    ...a.justify_between,
    marginBottom: tokens.space.sm,
  },
  lifecycleLabel: {
    fontSize: 13,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_gray_500,
  },
  lifecycleValue: {
    fontSize: 13,
    ...a.text_black,
  },
  workflowSection: {
    marginBottom: tokens.space.xl,
    ...a.bg_white,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  workflowHelperText: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
    marginBottom: tokens.space.md,
  },
  workflowButtons: {
    ...a.flex_row,
    ...a.flex_wrap,
    gap: tokens.space.md,
  },
  workflowButton: {
    ...a.flex_1,
    paddingVertical: tokens.space.md,
    borderRadius: tokens.space.sm,
    borderWidth: 1,
    borderColor: '#90CAF9',
    ...a.align_center,
    backgroundColor: '#E3F2FD',
  },
  workflowButtonText: {
    color: '#0D47A1',
    fontWeight: tokens.fontWeight.semibold,
  },
  workflowButtonSecondary: {
    borderColor: '#B0BEC5',
    backgroundColor: '#ECEFF1',
  },
  workflowButtonSecondaryText: {
    color: '#37474F',
    fontWeight: tokens.fontWeight.semibold,
  },
  actionsSection: {
    marginBottom: tokens.space.xl,
  },
  actionButton: {
    paddingVertical: tokens.space.md,
    borderRadius: tokens.space.sm,
    ...a.align_center,
    ...a.flex_row,
    ...a.justify_center,
    gap: tokens.space.sm,
    marginBottom: tokens.space.md,
  },
  dismissButton: {
    backgroundColor: '#4CAF50',
  },
  deleteDealButton: {
    backgroundColor: '#F44336',
  },
  warnButton: {
    backgroundColor: '#FF9800',
  },
  suspendButton: {
    backgroundColor: '#FF5722',
    ...a.flex_1,
  },
  banButton: {
    ...a.bg_black,
  },
  actionButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  suspendSection: {
    ...a.flex_row,
    gap: tokens.space.md,
    marginBottom: tokens.space.md,
  },
  daysInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    width: 80,
    ...a.text_center,
    ...a.bg_white,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    minHeight: 80,
    textAlignVertical: 'top',
    ...a.bg_white,
    marginBottom: tokens.space.md,
  },
  modalScrollContent: {
    paddingBottom: tokens.space._3xl,
  },
})

export default AdminReportsScreen
