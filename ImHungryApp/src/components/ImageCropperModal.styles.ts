import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  doneText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA05C',
    textAlign: 'right',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
  },
  instructionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
  },
});
