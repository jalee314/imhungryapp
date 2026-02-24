export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageMetadataId?: string;
  brandId?: string;
}

export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
  types: string[];
}

export interface RestaurantSearchResult {
  success: boolean;
  restaurants: GooglePlaceResult[];
  count: number;
  error?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Cuisine {
  id: string;
  name: string;
}
