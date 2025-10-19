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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminService, Report } from '../../services/adminService';
import { Ionicons } from '@expo/vector-icons';

const AdminReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports('pending');
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleReportPress = (report: Report) => {
    setSelectedReport(report);
    setActionModalVisible(true);
  };

  const handleDismiss = async () => {
    if (!selectedReport) return;

    try {
      const result = await adminService.dismissReport(selectedReport.report_id);
      if (result.success) {
        Alert.alert('Success', 'Report dismissed');
        setActionModalVisible(false);
        loadReports();
      } else {
        Alert.alert('Error', result.error || 'Failed to dismiss report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to dismiss report');
    }
  };

  const handleAction = async (action: 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user') => {
    if (!selectedReport) return;

    try {
      const result = await adminService.resolveReportWithAction(
        selectedReport.report_id,
        action,
        selectedReport.deal_id,
        selectedReport.uploader_user_id,
        reasonInput || undefined,
        action === 'suspend_user' ? parseInt(suspensionDays) : undefined
      );

      if (result.success) {
        Alert.alert('Success', `Action completed: ${action.replace('_', ' ')}`);
        setActionModalVisible(false);
        setReasonInput('');
        setSuspensionDays('7');
        loadReports();
      } else {
        Alert.alert('Error', result.error || 'Failed to perform action');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to perform action');
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity style={styles.reportCard} onPress={() => handleReportPress(item)}>
      <View style={styles.reportHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.reportDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.reportTitle} numberOfLines={2}>
        {item.deal?.title || 'Unknown Deal'}
      </Text>

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

      {item.reason_text && (
        <View style={styles.reasonTextContainer}>
          <Text style={styles.reasonText}>{item.reason_text}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.viewButtonText}>Review Report</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Moderation</Text>
        <TouchableOpacity onPress={loadReports} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA05C" />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          <Text style={styles.emptyText}>No pending reports!</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.report_id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Report</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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

              {/* Actions */}
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Actions</Text>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.dismissButton]}
                  onPress={handleDismiss}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Dismiss Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteDealButton]}
                  onPress={() => handleAction('delete_deal')}
                >
                  <Ionicons name="trash" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Delete Deal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.warnButton]}
                  onPress={() => handleAction('warn_user')}
                >
                  <Ionicons name="warning" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Warn User</Text>
                </TouchableOpacity>

                <View style={styles.suspendSection}>
                  <TextInput
                    style={styles.daysInput}
                    value={suspensionDays}
                    onChangeText={setSuspensionDays}
                    keyboardType="number-pad"
                    placeholder="Days"
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.suspendButton]}
                    onPress={() => handleAction('suspend_user')}
                  >
                    <Ionicons name="time" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Suspend User</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.reasonInput}
                  value={reasonInput}
                  onChangeText={setReasonInput}
                  placeholder="Reason for ban/suspension (optional)"
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.actionButton, styles.banButton]}
                  onPress={() => handleAction('ban_user')}
                >
                  <Ionicons name="ban" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Ban User Permanently</Text>
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
    padding: 12,
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
    backgroundColor: '#FFA05C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
});

export default AdminReportsScreen;

