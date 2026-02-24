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
    // Core food types
    'restaurant',
    'food',
    'cafe',
    'bar',
    'bakery',
    'meal_takeaway',
    'meal_delivery',
    // Quick service / fast food
    'fast_food_restaurant',
    'pizza_restaurant',
    'sandwich_shop',
    'hamburger_restaurant',
    // Beverages & desserts
    'coffee_shop',
    'ice_cream_shop',
    'dessert_shop',
    'donut_shop',
    'juice_shop',
    'bubble_tea_store',
    'tea_house',
    // Bars & nightlife (food often served)
    'wine_bar',
    'cocktail_bar',
    'sports_bar',
    'night_club',
    'pub',
    'beer_garden',
    'brewery',
    'winery',
    'distillery',
    // Meal types
    'brunch_restaurant',
    'breakfast_restaurant',
    // Cuisine-specific restaurants
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
    'ramen_restaurant',
    'noodle_house',
    'bbq_restaurant',
    'soul_food_restaurant',
    'cajun_restaurant',
    'caribbean_restaurant',
    'cuban_restaurant',
    'peruvian_restaurant',
    'brazilian_restaurant',
    'argentinian_restaurant',
    'turkish_restaurant',
    'lebanese_restaurant',
    'ethiopian_restaurant',
    'african_restaurant',
    'british_restaurant',
    'german_restaurant',
    'polish_restaurant',
    'russian_restaurant',
    'indonesian_restaurant',
    'malaysian_restaurant',
    'filipino_restaurant',
    'hawaiian_restaurant'
  ];

  // Check if any of the place's types match our food-related types
  return types.some(type => foodTypes.includes(type.toLowerCase()));
}

// Calculate Levenshtein distance between two strings (for typo tolerance)
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store distances
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// Calculate relevance score for a restaurant name given a search query
// Higher score = more relevant
function calculateRelevanceScore(
  restaurantName: string,
  query: string,
  distanceMiles: number,
  maxRadius: number
): number {
  const name = restaurantName.toLowerCase().trim();
  const searchQuery = query.toLowerCase().trim();

  let score = 0;

  // 1. Exact match (highest priority)
  if (name === searchQuery) {
    score = 1000;
  }
  // 2. Name starts with query (prefix match)
  else if (name.startsWith(searchQuery)) {
    score = 500;
  }
  // 3. Any word in the name starts with the query (word-start match)
  else {
    const words = name.split(/[\s\-'.,&]+/);
    const queryWords = searchQuery.split(/[\s\-'.,&]+/);

    // Check if any word starts with any query word
    let hasWordStartMatch = false;
    let hasContainsMatch = false;

    for (const qWord of queryWords) {
      if (qWord.length < 2) continue; // Skip very short query words

      for (const word of words) {
        if (word.startsWith(qWord)) {
          hasWordStartMatch = true;
          break;
        }
        if (word.includes(qWord)) {
          hasContainsMatch = true;
        }
      }
      if (hasWordStartMatch) break;
    }

    if (hasWordStartMatch) {
      score = 200;
    }
    // 4. Name contains query anywhere
    else if (name.includes(searchQuery) || hasContainsMatch) {
      score = 100;
    }
    // 5. Typo tolerance - check for fuzzy matches
    else {
      // Only apply fuzzy matching for queries with at least 3 characters
      if (searchQuery.length >= 3) {
        // Check each word in the restaurant name
        for (const word of words) {
          if (word.length < 2) continue;

          // Allow 1 typo for short words, 2 for longer words
          const maxTypos = word.length <= 4 ? 1 : 2;
          const distance = levenshteinDistance(word.substring(0, searchQuery.length), searchQuery);

          if (distance <= maxTypos) {
            score = 50;
            break;
          }
        }
      }
    }
  }

  // Add a small distance bonus as a tiebreaker (0-31 points based on distance)
  // Closer restaurants get higher bonus, but it's small enough not to override text relevance
  const distanceBonus = Math.max(0, maxRadius - distanceMiles);
  score += distanceBonus;

  return score;
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

    // Use the preprocessed query directly - don't append "restaurant" 
    // so cafes, bars, and other food establishments can be found
    const formattedQuery = preprocessedQuery;

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
      // Don't restrict to 'restaurant' type - let isFoodRelated() filter results
      // This allows cafes, bars, bakeries, etc. to appear in search
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
        // Remove the raw place object before returning but keep types for cuisine matching
        const { _rawPlace, ...cleanRestaurant } = restaurant;
        return cleanRestaurant;
      })
      .sort((a: any, b: any) => {
        // Use hybrid relevance scoring: prioritize text match, use distance as tiebreaker
        const scoreA = calculateRelevanceScore(a.name, query, a.distance_miles, radius);
        const scoreB = calculateRelevanceScore(b.name, query, b.distance_miles, radius);
        return scoreB - scoreA; // Higher score = more relevant, so sort descending
      })
      .slice(0, 20);

    // Log relevance scores for debugging
    console.log('--- Relevance Scores ---');
    restaurants.slice(0, 5).forEach((r: any, idx: number) => {
      const score = calculateRelevanceScore(r.name, query, r.distance_miles, radius);
      console.log(`  ${idx + 1}. ${r.name} - Score: ${score.toFixed(1)}, Distance: ${r.distance_miles}mi`);
    });
    console.log('------------------------');

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
