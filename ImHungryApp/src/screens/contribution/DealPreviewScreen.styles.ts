import { StyleSheet, Dimensions } from 'react-native';

import {
  BRAND,
  GRAY,
  STATIC,
  ALPHA_COLORS,
  SPACING,
  RADIUS,
  OPACITY,
  BORDER_WIDTH,
  FONT_SIZE,
} from '../../ui/alf';

export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BASE_WIDTH = 393;
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

export const PILL_WIDTH = scale(85);
export const PILL_HEIGHT = scale(28);
export const ARROW_SIZE = Math.round(scale(18));

const CAROUSEL_SIDE_PADDING = 48;
export const CAROUSEL_ITEM_WIDTH = screenWidth - CAROUSEL_SIDE_PADDING;
const PROFILE_IMAGE_SIZE = 58;

export const styles = StyleSheet.create({
  fadeOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  modalPanel: {
    flex: 1,
    backgroundColor: STATIC.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: STATIC.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.circle,
  },
  shareButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: ALPHA_COLORS.brandPrimary80,
    borderRadius: RADIUS.card,
    minWidth: 90,
  },
  shareButtonDisabled: {
    opacity: OPACITY.disabled + 0.1,
  },
  shareButtonEnabled: {
    opacity: OPACITY.full,
  },
  shareButtonText: {
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
  },
  restaurantInfoBlock: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  restaurantName: {
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  metaSeparator: {
    fontFamily: 'Inter',
    fontWeight: '300',
    color: STATIC.black,
  },
  categoryItemText: {
    fontFamily: 'Inter',
    fontSize: FONT_SIZE.xs,
    fontWeight: '400',
    color: STATIC.black,
  },
  categorySeparatorText: {
    fontFamily: 'Inter',
    fontSize: FONT_SIZE.xs,
    fontWeight: '300',
    color: STATIC.black,
  },
  sectionDivider: {
    alignSelf: 'stretch',
    height: BORDER_WIDTH.hairline,
    backgroundColor: GRAY[250],
    width: '100%',
  },
  dealTitle: {
    alignSelf: 'stretch',
    fontFamily: 'Inter',
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  carouselList: {
    height: 350,
  },
  carouselItemTouchable: {
    width: CAROUSEL_ITEM_WIDTH,
  },
  carouselImage: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 350,
    backgroundColor: GRAY[200],
    borderRadius: RADIUS.md,
    alignSelf: 'center',
  },
  paginationDotActive: {
    width: 10,
    height: 10,
    backgroundColor: BRAND.accent,
  },
  paginationDotInactive: {
    width: 8,
    height: 8,
    backgroundColor: GRAY[325],
  },
  voteCountText: {
    fontFamily: 'Inter',
    fontSize: scale(10),
    fontWeight: '400',
    color: STATIC.black,
    marginLeft: scale(4),
  },
  stretchContainer: {
    alignSelf: 'stretch',
  },
  detailsHeading: {
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 10,
  },
  detailsText: {
    fontFamily: 'Inter',
    lineHeight: 18,
    fontWeight: '400',
  },
  profileImage: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
  },
  sharedByText: {
    fontFamily: 'Inter',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  sharedBySubline: {
    letterSpacing: 0.2,
  },
  sharedByUsername: {
    fontFamily: 'Inter',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  absolutePosition: {
    position: 'absolute',
  },
  imageViewerScroll: {
    flex: 1,
    width: '100%',
  },
  imageViewerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: screenWidth,
    height: screenHeight,
  },
});
