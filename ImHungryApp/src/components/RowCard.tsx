/**
 * RowCard.tsx
 *
 * @deprecated This file is deprecated. Import from '#/components/cards/RowCard' instead.
 *
 * This file is kept for backwards compatibility and re-exports from the new location.
 */

export { default, RowCardData } from './cards/RowCard'
export * from './cards/RowCard'
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  textFrame: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    height: 76,
    justifyContent: 'center',
    paddingRight: 8, // Add padding to prevent text from touching arrow
  },
  favoritesTextFrame: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
    paddingRight: 8,
  },
  dealTitle: {
    alignSelf: 'stretch',
  },
  titleText: {
    color: tokens.color.black,
    letterSpacing: -0.35,
    lineHeight: 17,
  },
  exploreTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  restTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  dealDetails: {
    alignSelf: 'stretch',
  },
  subtitleText: {
    color: tokens.color.gray_600,
  },
  exploreSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  restSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  favoritesSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    paddingLeft: 5, // Match Anima CSS padding
    alignSelf: 'stretch',
    minWidth: 20, // Ensure arrow has consistent width
  },
  
  // Variant-specific styles
  'explore-deal-card': {
    height: 96,
  },
  'rest-deal': {
    height: 96,
  },
  'favorites-deal-card': {
    height: 96,
  },
  // User profile styles
  userProfileSection: {
    marginTop: 4,
  },
  userProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userProfileImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  userProfilePlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: tokens.color.gray_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userProfileText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: tokens.color.text_tertiary,
  },
});

export default RowCard;
