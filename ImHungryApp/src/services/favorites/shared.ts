import type { ImageVariants } from '../../types/image';

export interface FavoriteDealRow {
  deal_id: string | null;
  created_at: string;
}

export interface FavoriteRestaurantRow {
  restaurant_id: string | null;
  created_at: string;
}

export interface DealInstanceRow {
  deal_id: string;
  template_id: string;
  start_date?: string | null;
  end_date?: string | null;
  is_anonymous?: boolean | null;
}

export interface RestaurantRow {
  restaurant_id: string;
  name: string;
  address: string;
  restaurant_image_metadata?: string | null;
}

export interface CuisineRow {
  cuisine_id: string;
  cuisine_name: string;
}

export interface CategoryRow {
  category_id: string;
  category_name: string;
}

export interface DistanceRow {
  restaurant_id: string | null;
  distance_miles: number | null;
}

export interface DealCountRow {
  restaurant_id: string;
  deal_count: number;
}

export interface UpvoteCountRow {
  deal_id: string | null;
  upvote_count: number | string | null;
}

export interface ImageMetadataRow {
  variants?: ImageVariants | null;
  original_path?: string | null;
}

export interface DealImageRow {
  image_metadata_id?: string | null;
  display_order?: number | null;
  is_thumbnail?: boolean | null;
  image_metadata?: RelationValue<ImageMetadataRow>;
}

export interface UserRow {
  display_name?: string | null;
  profile_photo?: string | null;
  profile_photo_metadata_id?: string | null;
  image_metadata?: RelationValue<ImageMetadataRow>;
}

export interface DealTemplateRow {
  template_id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_metadata_id?: string | null;
  restaurant_id: string;
  cuisine_id?: string | null;
  category_id?: string | null;
  user_id?: string | null;
  is_anonymous?: boolean | null;
  restaurant?: RelationValue<RestaurantRow>;
  cuisine?: RelationValue<CuisineRow>;
  category?: RelationValue<CategoryRow>;
  image_metadata?: RelationValue<ImageMetadataRow>;
  deal_images?: DealImageRow[] | null;
  user?: RelationValue<UserRow>;
}

export interface RestaurantCuisineRow {
  restaurant_id: string;
  cuisine?: RelationValue<CuisineRow>;
}

export interface MostLikedDealRow {
  restaurant_id: string;
  template_id: string;
  image_url?: string | null;
  image_metadata_id?: string | null;
  image_metadata?: RelationValue<ImageMetadataRow>;
  deal_images?: DealImageRow[] | null;
  upvote_count: number;
}

export interface PerfSpanLike {
  recordRoundTrip: (metadata: Record<string, unknown>) => void;
}

export type RelationValue<T> = T | T[] | null | undefined;

export const getSingleRelation = <T>(value: RelationValue<T>): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

export const formatDistance = (distanceMiles?: number | null): string => {
  if (distanceMiles === null || distanceMiles === undefined || Number.isNaN(distanceMiles)) {
    return 'Unknown';
  }
  if (distanceMiles < 1) {
    return `${Math.round(distanceMiles * 1609)}m`;
  }
  return `${distanceMiles.toFixed(1)}mi`;
};

export const buildDistanceMap = (rows: DistanceRow[] | null | undefined): Map<string, number | null> => {
  const map = new Map<string, number | null>();
  (rows ?? []).forEach((row) => {
    if (row.restaurant_id) {
      map.set(row.restaurant_id, row.distance_miles ?? null);
    }
  });
  return map;
};

export const buildDealCountMap = (rows: DealCountRow[] | null | undefined): Map<string, number> => {
  const map = new Map<string, number>();
  (rows ?? []).forEach((row) => {
    if (row.restaurant_id) {
      map.set(row.restaurant_id, Number(row.deal_count) || 0);
    }
  });
  return map;
};

const findPreferredDealImage = (dealImages: DealImageRow[] | null | undefined): DealImageRow | null => {
  const sortedDealImages = [...(dealImages ?? [])].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999),
  );
  const firstByDisplayOrder = sortedDealImages.find((img) => {
    const imageMetadata = getSingleRelation(img.image_metadata);
    return Boolean(imageMetadata?.variants);
  });
  if (firstByDisplayOrder) {
    return firstByDisplayOrder;
  }
  return (
    (dealImages ?? []).find((img) => {
      const imageMetadata = getSingleRelation(img.image_metadata);
      return Boolean(img.is_thumbnail && imageMetadata?.variants);
    }) ?? null
  );
};

export const getImageVariantsForDeal = (
  dealImages: DealImageRow[] | null | undefined,
  fallbackImageMetadata: RelationValue<ImageMetadataRow>,
): ImageVariants | undefined => {
  const selectedDealImage = findPreferredDealImage(dealImages);
  const selectedMetadata = getSingleRelation(selectedDealImage?.image_metadata);
  if (selectedMetadata?.variants) {
    return selectedMetadata.variants;
  }
  const fallbackMetadata = getSingleRelation(fallbackImageMetadata);
  return fallbackMetadata?.variants ?? undefined;
};

export const getFavoriteDealImageData = (
  dealImages: DealImageRow[] | null | undefined,
  fallbackImageMetadata: RelationValue<ImageMetadataRow>,
): { imageUrl: string; imageVariants?: ImageVariants } => {
  const variants = getImageVariantsForDeal(dealImages, fallbackImageMetadata);
  const imageUrl = variants?.medium || variants?.small || variants?.large || 'placeholder';
  return {
    imageUrl,
    imageVariants: variants,
  };
};

export const getFavoriteRestaurantImageUrl = (
  dealImages: DealImageRow[] | null | undefined,
  fallbackImageMetadata: RelationValue<ImageMetadataRow>,
  fallbackImageUrl?: string | null,
): string => {
  const variants = getImageVariantsForDeal(dealImages, fallbackImageMetadata);
  if (variants) {
    return variants.medium || variants.small || variants.large || '';
  }
  return fallbackImageUrl || '';
};

export const getUserProfilePhotoUrl = (
  user: RelationValue<UserRow>,
  isAnonymous: boolean,
): string | null => {
  if (isAnonymous) {
    return null;
  }

  const userRow = getSingleRelation(user);
  if (!userRow) {
    return null;
  }

  const metadata = getSingleRelation(userRow.image_metadata);
  if (metadata?.variants) {
    return metadata.variants.small || metadata.variants.thumbnail || null;
  }

  return null;
};

export const isRpcUnavailableError = (error: unknown): boolean => {
  const maybeError = error as { code?: string; message?: string } | null;
  const code = maybeError?.code ?? '';
  const message = (maybeError?.message ?? '').toLowerCase();

  return (
    code === '42883' ||
    code === 'PGRST202' ||
    message.includes('could not find the function') ||
    message.includes('does not exist')
  );
};

