/**
 * Contribution Feature Types
 */

export interface Restaurant {
  id: string;
  name: string;
  subtext: string;
  google_place_id?: string;
  lat?: number;
  lng?: number;
  address?: string;
  distance_miles?: number;
}

export interface DealFormData {
  title: string;
  details: string;
  imageUris: string[];
  originalImageUris: string[];
  thumbnailIndex: number;
  expirationDate: string | null;
  selectedCategory: string | null;
  selectedCuisine: string | null;
  selectedRestaurant: Restaurant | null;
  isAnonymous: boolean;
}

export interface UserData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

export interface DealPreviewProps {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
  dealTitle: string;
  dealDetails: string;
  imageUris: string[];
  originalImageUris: string[];
  expirationDate: string | null;
  selectedRestaurant: Restaurant | null;
  selectedCategory: string;
  selectedCuisine: string;
  userData: UserData;
  isPosting: boolean;
}
