import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminService, Report, ReportCounts } from '../../services/adminService';
import { Ionicons } from '@expo/vector-icons';

type ReportFilter = 'pending' | 'review' | 'resolved' | 'all';

const STATUS_COLORS: Record<Report['status'], string> = {
  pending: '#FFA05C',
  review: '#3F51B5',
  resolved: '#4CAF50',
};

const STATUS_LABELS: Record<Report['status'], string> = {
  pending: 'Pending',
  review: 'In Review',
  resolved: 'Resolved',
};

const AdminReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReportFilter>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportCounts, setReportCounts] = useState<ReportCounts>({
    total: 0,
    pending: 0,
    review: 0,
    resolved: 0,
  });

  const loadReports = async (options?: { status?: ReportFilter; showSpinner?: boolean }) => {
    const { status = statusFilter, showSpinner = true } = options || {};
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const normalizedStatus = status === 'all' ? undefined : status;
      const data = await adminService.getReports(normalizedStatus);
      setReports(data);
      return data;
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports.');
      return [];
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const loadCounts = async () => {
    try {
      const counts = await adminService.getReportCounts();
      setReportCounts(counts);
    } catch (error) {
      console.error('Error loading report counts:', error);
    }
  };

  useEffect(() => {
    loadReports({ status: statusFilter });
  }, [statusFilter]);

  useEffect(() => {
    loadCounts();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadReports({ showSpinner: false }), loadCounts()]);
    setRefreshing(false);
  };

  const handleReportPress = (report: Report) => {
    setSelectedReport(report);
    setActionModalVisible(true);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
    setSelectedReport(null);
    setReasonInput('');
    setSuspensionDays('7');
    setActionLoading(null);
  };

  const getCountForFilter = (filter: ReportFilter) => {
    if (filter === 'all') {
      return reportCounts.total;
    }
    return reportCounts[filter];
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString();
  };

  const statusFilters: Array<{ label: string; value: ReportFilter; countKey: keyof ReportCounts }> = [
    { label: 'Pending', value: 'pending', countKey: 'pending' },
    { label: 'In Review', value: 'review', countKey: 'review' },
    { label: 'Resolved', value: 'resolved', countKey: 'resolved' },
    { label: 'All', value: 'all', countKey: 'total' },
  ];

  const handleDismiss = async () => {
    if (!selectedReport) return;
    setActionLoading('dismiss');

    try {
      const result = await adminService.dismissReport(selectedReport.report_id);
      if (result.success) {
        Alert.alert('Success', 'Report dismissed');
        closeActionModal();
        await loadReports({ showSpinner: false });
        await loadCounts();
      } else {
        Alert.alert('Error', result.error || 'Failed to dismiss report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to dismiss report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action: 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user') => {
    if (!selectedReport) return;
    setActionLoading(action);

    try {
      const result = await adminService.resolveReportWithAction(
        selectedReport.report_id,
        action,
        selectedReport.deal_id,
        selectedReport.uploader_user_id,
        reasonInput || undefined,
        action === 'suspend_user' ? parseInt(suspensionDays, 10) : undefined
      );

      if (result.success) {
        Alert.alert('Success', `Action completed: ${action.replace('_', ' ')}`);
        closeActionModal();
        await loadReports({ showSpinner: false });
        await loadCounts();
      } else {
        Alert.alert('Error', result.error || 'Failed to perform action');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWorkflowStatusChange = async (nextStatus: 'pending' | 'review') => {
    if (!selectedReport) return;
    const message =
      nextStatus === 'review'
        ? 'Report marked as in review.'
        : 'Report moved back to pending.';

    const loadingKey = `status-${nextStatus}`;
    setActionLoading(loadingKey);

    try {
      const result = await adminService.updateReportStatus(selectedReport.report_id, nextStatus);
      if (result.success) {
        Alert.alert('Success', message);
        closeActionModal();
        await loadReports({ showSpinner: false });
        await loadCounts();
      } else {
        Alert.alert('Error', result.error || 'Failed to update report status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update report status');
    } finally {
      setActionLoading(null);
    }
  };

  const renderReport = ({ item }: { item: Report }) => {
    const badgeColor = STATUS_COLORS[item.status];
    const actionLabel = item.resolution_action
      ? item.resolution_action.replace(/_/g, ' ')
      : null;

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
    );
  };

  const renderListHeader = () => {
    const activeLabel = statusFilter === 'all' ? 'All' : STATUS_LABELS[statusFilter];
    const activeCount = getCountForFilter(statusFilter);

    return (
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Status Filters</Text>
        <View style={styles.filterContainer}>
          {statusFilters.map((option) => {
            const isActive = statusFilter === option.value;
            const count = reportCounts[option.countKey];

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
            );
          })}
        </View>
        <Text style={styles.filterHelperText}>
          Showing {activeCount} {activeLabel.toLowerCase()} {activeCount === 1 ? 'report' : 'reports'}
        </Text>
      </View>
    );
  };

  const isBusy = Boolean(actionLoading);

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

      {loading ? (
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
                      {actionLoading === 'status-review' ? (
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
                      {actionLoading === 'status-pending' ? (
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
                  {actionLoading === 'dismiss' ? (
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
                  {actionLoading === 'delete_deal' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Delete Deal</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.warnButton, isBusy && styles.actionButtonDisabled]}
                  onPress={() => handleAction('warn_user')}
                  disabled={isBusy}
                >
                  {actionLoading === 'warn_user' ? (
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
                    {actionLoading === 'suspend_user' ? (
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
                  {actionLoading === 'ban_user' ? (
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
    paddingVertical: 16,
    backgroundColor: '#FFF',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
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
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listHeader: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    borderColor: '#FFA05C',
    backgroundColor: '#FFF3E6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  filterChipTextActive: {
    color: '#E66F1E',
  },
  filterCountBadge: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  filterCountBadgeActive: {
    backgroundColor: '#FFA05C',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  filterCountTextActive: {
    color: '#FFF',
  },
  filterHelperText: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E66F1E',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  reportInfo: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reportLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 80,
  },
  reportValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  reasonTextContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewButton: {
    backgroundColor: '#FFA05C',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  dealImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  dealInfoSection: {
    marginBottom: 20,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  reportDetailsSection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusSummarySection: {
    marginBottom: 20,
  },
  statusChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#333',
  },
  neutralStatusChip: {
    borderColor: '#BDBDBD',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  reasonTextBox: {
    marginVertical: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  lifecycleSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 20,
  },
  lifecycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lifecycleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  lifecycleValue: {
    fontSize: 13,
    color: '#000',
  },
  workflowSection: {
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  workflowHelperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  workflowButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workflowButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  workflowButtonText: {
    color: '#0D47A1',
    fontWeight: '600',
  },
  workflowButtonSecondary: {
    borderColor: '#B0BEC5',
    backgroundColor: '#ECEFF1',
  },
  workflowButtonSecondaryText: {
    color: '#37474F',
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
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
    flex: 1,
  },
  banButton: {
    backgroundColor: '#000',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  suspendSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  daysInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#FFF',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  modalScrollContent: {
    paddingBottom: 32,
  },
});

export default AdminReportsScreen;

