import { StyleSheet } from 'react-native';

import { BRAND, STATIC, GRAY, SEMANTIC } from '../../ui/alf';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC.white,
  },
  header: {
    flexDirection: 'column',
    backgroundColor: STATIC.white,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY[325],
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  directionsButton: {
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  directionsButtonText: {
    color: STATIC.black,
    fontWeight: '400',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 15,
    textAlign: 'center',
  },
  restaurantInfoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: STATIC.white,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '600',
    color: STATIC.black,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  heartButton: {
    backgroundColor: STATIC.white,
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favorited: {
    // Intentionally no visual background change for favorited state.
  },
  restaurantDetailsContainer: {
    flexDirection: 'column',
  },
  restaurantDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: STATIC.black,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  cuisineText: {
    color: STATIC.black,
  },
  distanceText: {
    color: STATIC.black,
  },
  separator: {
    color: STATIC.black,
    fontWeight: '300',
    marginHorizontal: 4,
  },
  addressText: {
    color: STATIC.black,
    marginLeft: 4,
  },
  dealsContainer: {
    flex: 1,
    backgroundColor: STATIC.white,
  },
  dealsList: {
    paddingVertical: 8,
    paddingBottom: 64,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: GRAY[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: SEMANTIC.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: STATIC.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: GRAY[600],
    textAlign: 'center',
  },
});
