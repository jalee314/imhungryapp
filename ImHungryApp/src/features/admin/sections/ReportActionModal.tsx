import React from 'react';
import { Modal } from 'react-native';

import {
  STATIC,
  ALPHA_COLORS,
} from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import type { Report } from '../types';

import {
  ReportHeader,
  ReportActionBody,
  type ReportActionEnforcement,
} from './ReportActionModal.sections';
import { styles } from './ReportActionModal.styles';

interface ReportActionModalProps {
  visible: boolean;
  report: Report | null;
  reasonInput: string;
  suspensionDays: string;
  actionLoading: string | null;
  onClose: () => void;
  onReasonChange: (text: string) => void;
  onSuspensionDaysChange: (text: string) => void;
  onDismiss: () => void;
  onAction: (action: ReportActionEnforcement) => void;
  onWorkflowStatusChange: (status: 'pending' | 'review') => void;
}

const ReportActionModal: React.FC<ReportActionModalProps> = ({
  visible,
  report,
  reasonInput,
  suspensionDays,
  actionLoading,
  onClose,
  onReasonChange,
  onSuspensionDaysChange,
  onDismiss,
  onAction,
  onWorkflowStatusChange,
}) => {
  const isBusy = Boolean(actionLoading);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box flex={1} bg={ALPHA_COLORS.blackOverlay80} justify="flex-end" style={styles.modalBackdrop}>
        <Box bg={STATIC.white} rounded="xl" p="xl" maxH="85%" style={styles.modalSheet}>
          <ReportHeader onClose={onClose} />
          <ReportActionBody
            report={report}
            actionLoading={actionLoading}
            suspensionDays={suspensionDays}
            reasonInput={reasonInput}
            isBusy={isBusy}
            onDismiss={onDismiss}
            onAction={onAction}
            onWorkflowStatusChange={onWorkflowStatusChange}
            onSuspensionDaysChange={onSuspensionDaysChange}
            onReasonChange={onReasonChange}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default ReportActionModal;
