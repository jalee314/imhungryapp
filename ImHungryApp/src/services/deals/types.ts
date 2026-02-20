/**
 * @file Deal service types
 *
 * Domain types re-exported from src/types/deal and src/types/image;
 * service-specific types (DealEditData, UpdateDealData, ServiceResult) defined here.
 */

export type { ImageVariants, ImageType } from '../../types/image';
export type { CreateDealData, RankedDealMeta, DatabaseDeal } from '../../types/deal';

// Interface for fetching deal data for editing
export interface DealEditData {
  templateId: string;
  dealId: string;
  title: string;
  description: string | null;
  expirationDate: string | null;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
  images: Array<{
    imageMetadataId: string;
    displayOrder: number;
    isThumbnail: boolean;
    url: string;
  }>;
}

// Interface for updating deal
export interface UpdateDealData {
  title?: string;
  description?: string;
  expirationDate?: string | null;
  isAnonymous?: boolean;
}

// Operation result type
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
