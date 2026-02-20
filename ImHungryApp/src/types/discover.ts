export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  logo_image?: string;
  deal_count: number;
  distance_miles: number;
  lat: number;
  lng: number;
}

export interface DiscoverResult {
  success: boolean;
  restaurants: DiscoverRestaurant[];
  count: number;
  error?: string;
}
