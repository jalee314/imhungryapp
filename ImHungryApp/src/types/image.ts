export type ImageType = 'profile_image' | 'deal_image' | 'restaurant_image' | 'franchise_logo_image';

export interface ImageVariants {
  original?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}

export interface VariantContext {
  devicePixelRatio?: number;
  screenWidth?: number;
  componentType: 'profile' | 'deal' | 'restaurant' | 'franchise_logo';
  displaySize: { width: number; height: number };
  networkType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
}
