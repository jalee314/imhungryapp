const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Calculate distance in miles using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if a place is actually a restaurant/food establishment
function isFoodRelated(types: string[]): boolean {
  const foodTypes = [
    'restaurant',
    'food',
    'cafe',
    'bar',
    'bakery',
    'meal_takeaway',
    'meal_delivery',
    'fast_food_restaurant',
    'pizza_restaurant',
    'sandwich_shop',
    'coffee_shop',
    'ice_cream_shop',
    'brunch_restaurant',
    'breakfast_restaurant',
    'american_restaurant',
    'chinese_restaurant',
    'italian_restaurant',
    'japanese_restaurant',
    'korean_restaurant',
    'mexican_restaurant',
    'thai_restaurant',
    'vietnamese_restaurant',
    'seafood_restaurant',
    'steak_house',
    'sushi_restaurant',
    'indian_restaurant',
    'mediterranean_restaurant',
    'middle_eastern_restaurant',
    'french_restaurant',
    'greek_restaurant',
    'spanish_restaurant',
    'vegetarian_restaurant',
    'vegan_restaurant',
    'hamburger_restaurant',
    'ramen_restaurant',
    'noodle_house'
  ];
  
  // Check if any of the place's types match our food-related types
  return types.some(type => foodTypes.includes(type.toLowerCase()));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { query, userLat, userLng, radius = 10 } = await req.json();

    // Validate inputs
    if (!query || !userLat || !userLng) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: query, userLat, userLng'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY not set');
      return new Response(JSON.stringify({
        error: 'API configuration error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Convert radius from miles to meters for Google API
    const radiusMeters = radius * 1609.34;
    const googleUrl = 'https://places.googleapis.com/v1/places:searchText';

    // Preprocess query for common restaurant name patterns
    let preprocessedQuery = query.trim();
    
    // Handle common restaurant name variations
    const nameVariations: { [key: string]: string } = {
      'in n out': 'in-n-out burger',
      'in-n-out': 'in-n-out burger',
      'innout': 'in-n-out burger',
      'chick fil a': 'chick-fil-a',
      'chick-fil-a': 'chick-fil-a',
      'chickfila': 'chick-fil-a',
      'mcdonalds': 'mcdonald\'s',
      'mc donalds': 'mcdonald\'s',
      'wendys': 'wendy\'s',
      'arbys': 'arby\'s',
      'dennys': 'denny\'s'
    };
    
    // Check if query matches any known variations (case insensitive)
    const lowerQuery = preprocessedQuery.toLowerCase();
    for (const [variation, canonical] of Object.entries(nameVariations)) {
      if (lowerQuery === variation || lowerQuery.startsWith(variation + ' ')) {
        preprocessedQuery = canonical;
        break;
      }
    }

    // Format query to be more precise
    // Add "restaurant" to the end to help Google understand context
    const formattedQuery = preprocessedQuery + ' restaurant';

    const requestBody = {
      textQuery: formattedQuery,
      locationBias: {
        circle: {
          center: {
            latitude: userLat,
            longitude: userLng
          },
          radius: radiusMeters
        }
      },
      // Request only food-related establishments
      includedType: 'restaurant',
      maxResultCount: 20,
      // Add ranking preference for relevance
      rankPreference: 'RELEVANCE'
    };

    // Call Google Places API (New)
    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types'
      },
      body: JSON.stringify(requestBody)
    });

    const googleData = await googleResponse.json();

    console.log('--- Google Places API Response ---');
    console.log(`Original Query: "${query}"`);
    console.log(`Preprocessed Query: "${preprocessedQuery}"`);
    console.log(`Final Query Sent: "${formattedQuery}"`);
    console.log(`Found ${googleData.places?.length || 0} places`);
    
    // Log first few results for debugging
    if (googleData.places && googleData.places.length > 0) {
      console.log('Top results:');
      googleData.places.slice(0, 5).forEach((place: any, idx: number) => {
        console.log(`  ${idx + 1}. ${place.displayName?.text || 'Unknown'} - Types: ${(place.types || []).join(', ')}`);
      });
    }
    console.log('------------------------------------');

    // Check for errors
    if (!googleResponse.ok) {
      console.error('Google API error:', googleData);
      return new Response(JSON.stringify({
        error: 'Failed to search restaurants',
        details: googleData.error?.message || 'Unknown error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Transform and filter results
    const restaurants = (googleData.places || [])
      .map((place: any) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          place.location.latitude,
          place.location.longitude
        );

        return {
          google_place_id: place.id,
          name: place.displayName?.text || place.displayName || 'Unknown Restaurant',
          address: place.formattedAddress,
          lat: place.location.latitude,
          lng: place.location.longitude,
          distance_miles: Math.round(distance * 10) / 10,
          types: place.types || [],
          _rawPlace: place // Keep for debugging
        };
      })
      .filter((restaurant: any) => {
        // First filter by distance
        if (restaurant.distance_miles > radius) {
          return false;
        }
        
        // Then filter to only include food-related places
        const types = restaurant.types;
        const isFoodPlace = isFoodRelated(types);
        
        if (!isFoodPlace) {
          console.log(`Filtered out non-food place: ${restaurant.name} (types: ${types.join(', ')})`);
        }
        
        return isFoodPlace;
      })
      .map((restaurant: any) => {
        // Remove the raw place object before returning
        const { _rawPlace, ...cleanRestaurant } = restaurant;
        return cleanRestaurant;
      })
      .sort((a: any, b: any) => a.distance_miles - b.distance_miles)
      .slice(0, 20);

    console.log(`Filtered to ${restaurants.length} food-related restaurants within ${radius} miles`);

    return new Response(JSON.stringify({
      success: true,
      restaurants,
      count: restaurants.length
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in search-restaurants function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
