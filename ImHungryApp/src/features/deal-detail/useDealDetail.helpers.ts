import {
  Image,
  Linking,
  Platform,
} from 'react-native';

import { supabase } from '../../../lib/supabase';
import type { Deal } from '../../types/deal';
import type { ImageVariants } from '../../types/image';

const FALLBACK_SKELETON_HEIGHT = 250;
const MAX_SKELETON_HEIGHT = 400;

interface ImageVariantsRecord {
  original?: string | null;
  large?: string | null;
  medium?: string | null;
  small?: string | null;
  thumbnail?: string | null;
  public?: string | null;
}

interface TemplateImageMetadata {
  variants?: ImageVariantsRecord | null;
  original_path?: string | null;
}

interface TemplateDealImage {
  display_order?: number | null;
  image_metadata?: TemplateImageMetadata | null;
}

interface TemplateUser {
  display_name?: string | null;
  profile_photo?: string | null;
  image_metadata?: { variants?: ImageVariantsRecord | null } | null;
}

export interface DealTemplateRecord {
  title?: string | null;
  description?: string | null;
  user?: TemplateUser | null;
  image_metadata?: TemplateImageMetadata | null;
  deal_images?: TemplateDealImage[] | null;
}

export interface DealInstanceRecord {
  is_anonymous?: boolean | null;
  end_date?: string | null;
  deal_template?: DealTemplateRecord | null;
}

export interface ProcessedDealImage {
  displayOrder: number;
  variants?: ImageVariantsRecord | null;
  displayUrl: string;
  originalUrl: string;
}

const DEAL_INSTANCE_SELECT = `
  deal_id, template_id, is_anonymous, end_date,
  deal_template!inner(
    title, description, image_metadata_id,
    user:user_id(display_name, profile_photo, image_metadata:profile_photo_metadata_id(variants)),
    image_metadata:image_metadata_id(variants, original_path),
    deal_images(image_metadata_id, display_order, is_thumbnail,
      image_metadata:image_metadata_id(variants, original_path))
  )
`;

const getUrlFromVariants = (variants?: ImageVariantsRecord | null): string => (
  variants?.large || variants?.medium || variants?.original || ''
);

const getOriginalUrlFromVariants = (
  variants?: ImageVariantsRecord | null,
  originalPath?: string | null
): string => (
  originalPath || variants?.public || variants?.original || variants?.large || variants?.medium || ''
);

const getProfilePhotoFromTemplateUser = (
  user?: TemplateUser | null
): string | undefined => (
  user?.image_metadata?.variants?.small
  || user?.image_metadata?.variants?.thumbnail
  || user?.profile_photo
  || undefined
);

export const resolvePrimaryImageUri = (
  image: Deal['image'],
  imageVariants?: Deal['imageVariants']
): string => {
  if (imageVariants) {
    return imageVariants.large || imageVariants.original || '';
  }
  return typeof image === 'string' ? image : '';
};

export const resolveSkeletonHeight = async (
  uri: string,
  screenWidth: number
): Promise<number> => {
  if (!uri) {
    return FALLBACK_SKELETON_HEIGHT;
  }

  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = (height: number) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(height);
    };

    const timeoutId = setTimeout(
      () => finish(FALLBACK_SKELETON_HEIGHT),
      1000
    );

    Image.getSize(
      uri,
      (width, height) => {
        clearTimeout(timeoutId);
        if (!width || !height) {
          finish(FALLBACK_SKELETON_HEIGHT);
          return;
        }
        const calculated = Math.min(
          (height / width) * screenWidth,
          MAX_SKELETON_HEIGHT,
        );
        finish(Number.isFinite(calculated) ? calculated : FALLBACK_SKELETON_HEIGHT);
      },
      () => {
        clearTimeout(timeoutId);
        finish(FALLBACK_SKELETON_HEIGHT);
      },
    );
  });
};

export const fetchDealInstanceRecord = async (
  dealId: string
): Promise<{ instance: DealInstanceRecord | null; error: unknown }> => {
  const { data, error } = await supabase
    .from('deal_instance')
    .select(DEAL_INSTANCE_SELECT)
    .eq('deal_id', dealId)
    .single();

  return {
    instance: (data as DealInstanceRecord | null) || null,
    error,
  };
};

export const mergeDealWithTemplate = (
  previousDeal: Deal,
  instance: DealInstanceRecord,
  template: DealTemplateRecord
): Deal => {
  const isAnonymous = instance.is_anonymous ?? false;
  const userProfilePhotoUrl = getProfilePhotoFromTemplateUser(template.user);

  return {
    ...previousDeal,
    title: template.title || previousDeal.title,
    details: template.description ?? previousDeal.details,
    isAnonymous,
    author: isAnonymous
      ? 'Anonymous'
      : (template.user?.display_name || previousDeal.author),
    userDisplayName: template.user?.display_name || previousDeal.userDisplayName,
    userProfilePhoto: userProfilePhotoUrl || previousDeal.userProfilePhoto,
    expirationDate: instance.end_date ?? previousDeal.expirationDate,
  };
};

export const buildTemplateImages = (
  template?: DealTemplateRecord | null
): ProcessedDealImage[] => {
  const imagesFromDealImages = (template?.deal_images || [])
    .map((img) => {
      const variants = img?.image_metadata?.variants;
      const originalPath = img?.image_metadata?.original_path;
      return {
        displayOrder: img.display_order ?? 0,
        variants,
        displayUrl: getUrlFromVariants(variants),
        originalUrl: getOriginalUrlFromVariants(variants, originalPath),
      };
    })
    .filter((item) => item.displayUrl && item.originalUrl)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (imagesFromDealImages.length > 0) {
    return imagesFromDealImages;
  }

  const metadataVariants = template?.image_metadata?.variants;
  if (!metadataVariants) {
    return [];
  }

  const displayUrl = getUrlFromVariants(metadataVariants);
  const originalUrl = getOriginalUrlFromVariants(
    metadataVariants,
    template?.image_metadata?.original_path
  );

  if (!displayUrl || !originalUrl) {
    return [];
  }

  return [{
    displayOrder: 0,
    variants: metadataVariants,
    displayUrl,
    originalUrl,
  }];
};

export const toDealImageVariants = (
  variants?: ImageVariantsRecord | null
): ImageVariants | undefined => {
  if (!variants) {
    return undefined;
  }
  return {
    original: variants.original || undefined,
    large: variants.large || undefined,
    medium: variants.medium || undefined,
    small: variants.small || undefined,
    thumbnail: variants.thumbnail || undefined,
  };
};

export const toOriginalVariantUri = (uri: string): string => {
  if (!uri || typeof uri !== 'string' || uri.startsWith('https://res.cloudinary.com/')) {
    return uri;
  }

  return uri
    .replace('/large/', '/original/')
    .replace('/medium/', '/original/')
    .replace('/small/', '/original/')
    .replace('/thumbnail/', '/original/')
    .replace('large/', 'original/')
    .replace('medium/', 'original/')
    .replace('small/', 'original/')
    .replace('thumbnail/', 'original/');
};

export const formatDealDate = (dateString: string | null): string => {
  if (!dateString || dateString === 'Unknown') {
    return 'Not Known';
  }

  const date = new Date(dateString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const removeZipCode = (address: string): string => (
  address.replace(/,?\s*\d{5}(-\d{4})?$/, '').trim()
);

const resolveEncodedAddress = (dealData: Deal): string => {
  const address = dealData.restaurantAddress || dealData.restaurant;
  return encodeURIComponent(address);
};

export const openAppleMaps = async (dealData: Deal): Promise<void> => {
  const encodedAddress = resolveEncodedAddress(dealData);
  const nativeUrl = `maps://?daddr=${encodedAddress}`;
  const canOpenNative = await Linking.canOpenURL(nativeUrl);
  const fallbackUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
  await Linking.openURL(canOpenNative ? nativeUrl : fallbackUrl);
};

export const openGoogleMaps = async (dealData: Deal): Promise<void> => {
  const encodedAddress = resolveEncodedAddress(dealData);

  if (Platform.OS === 'ios') {
    const iosNative = `comgooglemaps://?daddr=${encodedAddress}`;
    const canOpenNative = await Linking.canOpenURL(iosNative);
    const fallbackUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
    await Linking.openURL(canOpenNative ? iosNative : fallbackUrl);
    return;
  }

  const navigationUrl = `google.navigation:q=${encodedAddress}`;
  const canOpenNavigation = await Linking.canOpenURL(navigationUrl);
  if (canOpenNavigation) {
    await Linking.openURL(navigationUrl);
    return;
  }

  const geoUrl = `geo:0,0?q=${encodedAddress}`;
  const canOpenGeo = await Linking.canOpenURL(geoUrl);
  if (canOpenGeo) {
    await Linking.openURL(geoUrl);
    return;
  }

  await Linking.openURL(`https://maps.google.com/maps?daddr=${encodedAddress}`);
};
