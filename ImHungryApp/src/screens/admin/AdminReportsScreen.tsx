import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import type { Report, ReportCounts } from '../../services/admin/types';
import { BRAND, GRAY, SEMANTIC, SPACING } from '../../ui/alf';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';

import AdminHeader from '../../features/admin/sections/AdminHeader';
import AdminLoadingState from '../../features/admin/sections/AdminLoadingState';
import ReportFilterBar, { type ReportFilter } from '../../features/admin/sections/ReportFilterBar';
import ReportCard from '../../features/admin/sections/ReportCard';
import ReportActionModal from '../../features/admin/sections/ReportActionModal';

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
    total: 0, pending: 0, review: 0, resolved: 0,
  });

  const loadReports = async (options?: { status?: ReportFilter; showSpinner?: boolean }) => {
    const { status = statusFilter, showSpinner = true } = options || {};
    if (showSpinner) setLoading(true);
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
      if (showSpinner) setLoading(false);
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

  useEffect(() => { loadReports({ status: statusFilter }); }, [statusFilter]);
  useEffect(() => { loadCounts(); }, []);

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
    } catch {
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
    } catch {
      Alert.alert('Error', 'Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWorkflowStatusChange = async (nextStatus: 'pending' | 'review') => {
    if (!selectedReport) return;
    const message = nextStatus === 'review'
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
    } catch {
      Alert.alert('Error', 'Failed to update report status');
    } finally {
      setActionLoading(null);
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', review: 'In Review', resolved: 'Resolved',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
      <AdminHeader
        title="Content Moderation"
        showBack
        rightIcon="refresh"
        rightColor={GRAY[900]}
        onRightPress={handleManualRefresh}
      />

      {loading ? (
        <Box flex={1} center>
          <AdminLoadingState />
        </Box>
      ) : (
        <FlatList
          data={reports}
          renderItem={({ item }) => <ReportCard report={item} onPress={handleReportPress} />}
          keyExtractor={(item) => item.report_id}
          ListHeaderComponent={
            <ReportFilterBar
              activeFilter={statusFilter}
              counts={reportCounts}
              onFilterChange={setStatusFilter}
            />
          }
          contentContainerStyle={[
            { paddingHorizontal: SPACING.md, paddingBottom: SPACING['2xl'] },
            reports.length === 0 && { flexGrow: 1, justifyContent: 'center' },
          ]}
          ListEmptyComponent={
            <Box flex={1} center>
              <Ionicons name="checkmark-circle" size={64} color={SEMANTIC.success} />
              <Text size="lg" color={GRAY[600]} style={{ marginTop: SPACING.lg }}>
                No{' '}
                {statusFilter === 'all'
                  ? ''
                  : `${(STATUS_LABELS[statusFilter] || '').toLowerCase()} `}
                reports!
              </Text>
            </Box>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} tintColor={BRAND.accent} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <ReportActionModal
        visible={actionModalVisible}
        report={selectedReport}
        reasonInput={reasonInput}
        suspensionDays={suspensionDays}
        actionLoading={actionLoading}
        onClose={closeActionModal}
        onReasonChange={setReasonInput}
        onSuspensionDaysChange={setSuspensionDays}
        onDismiss={handleDismiss}
        onAction={handleAction}
        onWorkflowStatusChange={handleWorkflowStatusChange}
      />
    </SafeAreaView>
  );
};

export default AdminReportsScreen;
