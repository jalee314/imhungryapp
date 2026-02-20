import { StyleSheet } from 'react-native';

import {
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
} from '../../../ui/alf';

export const styles = StyleSheet.create({
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerBorder: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  scrollContent: {
    paddingBottom: SPACING['3xl'],
  },
  dealPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  marginBottomSm: {
    marginBottom: SPACING.sm,
  },
  marginBottomMd: {
    marginBottom: SPACING.md,
  },
  dealDescription: {
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  additionalInfoText: {
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  suspensionDaysInput: {
    borderWidth: BORDER_WIDTH.thin,
    borderColor: GRAY[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    width: 80,
    textAlign: 'center',
    backgroundColor: STATIC.white,
  },
  flexNoMargin: {
    flex: 1,
    marginBottom: 0,
  },
  reasonInput: {
    borderWidth: BORDER_WIDTH.thin,
    borderColor: GRAY[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: STATIC.white,
    marginBottom: SPACING.md,
  },
  detailLabel: {
    width: 100,
  },
  flexFill: {
    flex: 1,
  },
  actionButtonBase: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  enforcementButtonBase: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
});
