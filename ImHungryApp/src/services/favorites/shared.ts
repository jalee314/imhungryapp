import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';
import type { ImageVariants as DealImageVariants } from '../../types/image';

export type FavoriteEntity = FavoriteDeal | FavoriteRestaurant;

type RawImageVariants = {
  medium?: string | null;
  small?: string | null;
  large?: string | null;
  thumbnail?: string | null;
};

export type ImageSource = {
  deal_images?: Array<{
    display_order?: number | null;
    is_thumbnail?: boolean | null;
    image_metadata?: { variants?: RawImageVariants | null } | null;
  }> | null;
  image_metadata?: { variants?: RawImageVariants | null } | Array<{ variants?: RawImageVariants | null }> | null;
  image_url?: string | null;
};

const sanitizeVariants = (variants?: RawImageVariants | null): DealImageVariants | undefined => {
  if (!variants) {
    return undefined;
  }
  return {
    medium: variants.medium || undefined,
    small: variants.small || undefined,
    large: variants.large || undefined,
    thumbnail: variants.thumbnail || undefined,
  };
};

const getVariantsFromDealImages = (source: ImageSource): DealImageVariants | undefined => {
  const dealImages = source.deal_images || [];
  const sortedDealImages = [...dealImages].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  );

  const firstImageByOrder = sortedDealImages.find((img) => sanitizeVariants(img.image_metadata?.variants));
  const orderedVariants = sanitizeVariants(firstImageByOrder?.image_metadata?.variants);
  if (orderedVariants) {
    return orderedVariants;
  }

  const thumbnailImage = dealImages.find(
    (img) => img.is_thumbnail && sanitizeVariants(img.image_metadata?.variants)
  );
  return sanitizeVariants(thumbnailImage?.image_metadata?.variants);
};

const getVariantsFromTemplateMetadata = (source: ImageSource): DealImageVariants | undefined => {
  const imageMetadata = Array.isArray(source.image_metadata)
    ? source.image_metadata[0]
    : source.image_metadata;
  return sanitizeVariants(imageMetadata?.variants);
};

const getImageUrlFromVariants = (variants: DealImageVariants, fallback: string): string => (
  variants.medium || variants.small || variants.large || fallback
);

export const getPreferredImageUrl = (
  source: ImageSource | null | undefined,
  fallback: string
): { imageUrl: string; imageVariants?: DealImageVariants } => {
  if (!source) {
    return { imageUrl: fallback };
  }

  const dealImageVariants = getVariantsFromDealImages(source);
  if (dealImageVariants) {
    return {
      imageUrl: getImageUrlFromVariants(dealImageVariants, fallback),
      imageVariants: dealImageVariants,
    };
  }

  const metadataVariants = getVariantsFromTemplateMetadata(source);
  if (metadataVariants) {
    return {
      imageUrl: getImageUrlFromVariants(metadataVariants, fallback),
      imageVariants: metadataVariants,
    };
  }

  return {
    imageUrl: source.image_url || fallback,
  };
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
