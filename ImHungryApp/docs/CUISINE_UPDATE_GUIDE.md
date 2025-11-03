# Restaurant Cuisine Update Guide

This guide explains how to automatically assign cuisines to restaurants using the Google Places API.

## Overview

The system uses Google Places API data to automatically match restaurants with appropriate cuisines from your database. It analyzes both the Google Place types and restaurant names to make intelligent cuisine assignments.

## Available Cuisines

Your database supports these cuisines:
- American
- Brazilian  
- British
- Caribbean
- Chinese
- Cuban
- Ethiopian
- Filipino
- French
- German
- Greek
- Indian
- Israeli
- Italian
- Japanese
- Korean
- Mexican
- Middle Eastern
- Polish
- Russian
- Thai
- Vietnamese

## How It Works

### 1. Google Place Types Analysis
The system first looks at the `types` field from Google Places API:
- `chinese_restaurant` → Chinese
- `italian_restaurant` → Italian  
- `mexican_restaurant` → Mexican
- `pizza_restaurant` → Italian
- `sushi_restaurant` → Japanese
- And many more...

### 2. Restaurant Name Pattern Matching
If Google types don't provide clear cuisine info, it analyzes restaurant names:
- "Panda Express" → Chinese
- "Olive Garden" → Italian
- "Taco Bell" → Mexican
- "Pho" (in name) → Vietnamese
- "Pad Thai" (in name) → Thai
- And hundreds more patterns...

### 3. Default Fallback
If no specific cuisine is detected, it defaults to "American" for general restaurants.

## Usage

### Option 1: Admin Screen (Recommended)
1. Navigate to the Cuisine Update admin screen in your app
2. Review the statistics showing restaurants without cuisines
3. Set your batch size (default: 50)
4. Run a **Dry Run** first to see what would be updated
5. If results look good, run **Update Now** to apply changes

### Option 2: Direct API Call
```javascript
import { updateRestaurantCuisines } from '../services/cuisineUpdateService';

// Dry run - see what would be updated without making changes
const dryRunResult = await updateRestaurantCuisines(50, true);
console.log(dryRunResult.summary);

// Actual update
const updateResult = await updateRestaurantCuisines(50, false);
console.log(updateResult.summary);
```

### Option 3: Test Script
Use the provided test script:
```bash
# Set your environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-anon-key"

# Run the test
node test-cuisine-update.js
```

## Edge Function Details

### update-restaurant-cuisines
**Endpoint**: `supabase/functions/update-restaurant-cuisines`

**Parameters**:
- `batchSize` (number, default: 50): How many restaurants to process
- `dryRun` (boolean, default: false): Whether to actually update or just simulate

**Response**:
```javascript
{
  success: true,
  processed: 50,
  updated: 32,
  skipped: 18,
  errors: 0,
  summary: "Processed 50 restaurants, updated 32, skipped 18, errors 0",
  details: [
    {
      restaurant_id: "uuid",
      name: "Restaurant Name",
      google_place_id: "google_id",
      types: ["restaurant", "chinese_restaurant"],
      detected_cuisine: "Chinese",
      updated: true
    }
    // ... more results
  ]
}
```

## Manual Assignment

For restaurants that can't be automatically categorized, use the manual assignment feature:

1. Go to the "Manual Assignment" tab in the admin screen
2. Select the appropriate cuisine for each restaurant
3. The assignment is immediate

Or use the service directly:
```javascript
import { assignCuisineToRestaurant } from '../services/cuisineUpdateService';

await assignCuisineToRestaurant(restaurantId, cuisineId);
```

## Best Practices

1. **Always run a dry run first** to see what would be updated
2. **Process in small batches** (50-100 restaurants) to avoid timeouts
3. **Review the results** before running large updates
4. **Monitor for errors** and handle failed restaurants manually
5. **Update regularly** as you add new restaurants

## Troubleshooting

### Common Issues:

1. **No Google Place ID**: Some restaurants don't have Google Place IDs
   - Solution: The system will try name pattern matching
   - Manual assignment may be needed

2. **Generic Types**: Some restaurants only return generic types like "restaurant"
   - Solution: The system analyzes the name for cuisine clues
   - May default to "American" if nothing specific is found

3. **Rate Limiting**: Google Places API has rate limits
   - Solution: The system includes small delays between requests
   - Process in smaller batches if needed

4. **Ambiguous Names**: Some restaurant names don't clearly indicate cuisine
   - Solution: Use manual assignment for these cases

### Monitoring Updates:

Check the results object for:
- `errors > 0`: Some restaurants failed to update
- `skipped`: Restaurants where no cuisine could be determined
- `details`: Individual restaurant results for debugging

## Database Schema

The system uses these tables:
- `restaurant`: Main restaurant data
- `cuisine`: Available cuisine types  
- `restaurant_cuisine`: Many-to-many relationship table

Restaurants can have multiple cuisines if needed (though the current implementation assigns one primary cuisine).

## Future Enhancements

Possible improvements:
1. Support for multiple cuisines per restaurant
2. Machine learning-based cuisine detection
3. User feedback to improve accuracy
4. Integration with menu analysis
5. Support for fusion cuisines

## Support

If you encounter issues:
1. Check the function logs in Supabase dashboard
2. Run with `dryRun: true` to debug without making changes
3. Use the test script to verify the function works
4. Review the `details` array in responses for specific restaurant issues
