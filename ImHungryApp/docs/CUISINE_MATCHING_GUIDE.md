# Restaurant Cuisine Matching Guide

This guide explains how to automatically match restaurants with cuisines using Google Places API data.

## Overview

The system uses Google Places API's `types` field and restaurant names to automatically determine the most appropriate cuisine for each restaurant. This solves the problem of restaurants being created without cuisine assignments.

## Components

### 1. Edge Function: `update-restaurant-cuisines`
- **Location**: `supabase/functions/update-restaurant-cuisines/index.ts`
- **Purpose**: Processes restaurants in batches and assigns cuisines based on Google Places API data
- **Key Features**:
  - Uses Google Places API to get restaurant types
  - Maps Google Place types to your cuisine categories
  - Falls back to name pattern matching for generic types
  - Supports dry-run mode for testing
  - Processes restaurants in configurable batches

### 2. Service: `cuisineUpdateService`
- **Location**: `src/services/cuisineUpdateService.ts`
- **Purpose**: React Native service to interact with the edge function
- **Functions**:
  - `updateRestaurantCuisines()` - Run automatic cuisine matching
  - `getRestaurantsWithoutCuisines()` - Get list of unmatched restaurants
  - `assignCuisineToRestaurant()` - Manually assign cuisine
  - `removeCuisineFromRestaurant()` - Remove cuisine assignment

### 3. Admin Screen: `CuisineUpdateScreen`
- **Location**: `src/screens/admin/CuisineUpdateScreen.tsx`
- **Purpose**: Admin interface for managing cuisine assignments
- **Features**:
  - View statistics and unmatched restaurants
  - Run automatic updates with dry-run option
  - Manual cuisine assignment interface
  - Real-time progress and results

## Cuisine Mapping Logic

### 1. Direct Google Place Type Mapping
```javascript
const GOOGLE_TYPE_TO_CUISINE = {
  'american_restaurant': 'American',
  'chinese_restaurant': 'Chinese',
  'italian_restaurant': 'Italian',
  'japanese_restaurant': 'Japanese',
  'korean_restaurant': 'Korean',
  // ... more mappings
};
```

### 2. Restaurant Name Pattern Matching
When Google types are generic (like 'restaurant' or 'food'), the system analyzes restaurant names:
```javascript
const NAME_PATTERNS_TO_CUISINE = {
  'mcdonalds': 'American',
  'panda express': 'Chinese',
  'olive garden': 'Italian',
  'pho': 'Vietnamese',
  'taco bell': 'Mexican',
  // ... more patterns
};
```

### 3. Fallback Strategy
- If no specific cuisine is detected but the place has restaurant-related types, defaults to 'American'
- If no mapping is found, the restaurant remains unassigned for manual review

## Available Cuisines

Based on your database schema, the following cuisines are available:
- American
- Brazilian  
- British
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
- Caribbean

## Usage

### Option 1: Admin Screen (Recommended)
1. Navigate to Admin Panel → Cuisine Management
2. View statistics and restaurants without cuisines
3. Run a dry-run to see what would be updated
4. Execute the actual update
5. Use manual assignment for edge cases

### Option 2: Direct Service Call
```typescript
import { updateRestaurantCuisines } from '../services/cuisineUpdateService';

// Dry run to see what would be updated
const dryRunResult = await updateRestaurantCuisines(50, true);

// Actual update
const updateResult = await updateRestaurantCuisines(50, false);
```

### Option 3: Test Script
```bash
# Set your environment variables
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
node test-cuisine-update.js
```

## Best Practices

### 1. Start with Dry Runs
Always run a dry-run first to see what cuisines would be assigned:
```javascript
const result = await updateRestaurantCuisines(10, true); // dryRun = true
```

### 2. Process in Small Batches
Start with small batch sizes (10-50) to avoid rate limiting and allow for review:
```javascript
const result = await updateRestaurantCuisines(25, false);
```

### 3. Review Results
Check the `details` array in results to see what cuisines were assigned:
```javascript
result.details.forEach(detail => {
  console.log(`${detail.name}: ${detail.detected_cuisine} (${detail.updated ? 'Updated' : 'Skipped'})`);
});
```

### 4. Manual Review for Edge Cases
Use the manual assignment interface for:
- Fusion restaurants
- Regional specialty restaurants  
- Restaurants with unclear names
- Chain restaurants not in the pattern list

## Extending the System

### Adding New Cuisine Mappings
1. Add new Google Place types to `GOOGLE_TYPE_TO_CUISINE` in the edge function
2. Add new name patterns to `NAME_PATTERNS_TO_CUISINE`
3. Test with dry runs before deploying

### Adding New Cuisines
1. Add the cuisine to your database's `cuisine` table
2. Update the mapping dictionaries in the edge function
3. Update this documentation

## Troubleshooting

### Common Issues

**"No restaurants found without cuisines"**
- All restaurants already have cuisine assignments
- Check the `restaurant_cuisine` table

**"Google Places API errors"**
- Verify `GOOGLE_PLACES_API_KEY` is set in edge function environment
- Check API quotas and rate limits
- Ensure the API key has Places API access

**"Many restaurants skipped"**
- Review the `details` array to see why cuisines weren't detected
- Consider adding more name patterns or Google type mappings
- Use manual assignment for difficult cases

**"Invalid supabaseUrl error in test script"**
- Set the `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables
- Ensure the URL includes `https://`

### Monitoring Progress
```javascript
// Check current status
const { count, restaurants } = await getRestaurantsWithoutCuisines();
console.log(`${count} restaurants still need cuisine assignments`);
```

## Performance Considerations

- The system processes one restaurant at a time to avoid Google Places API rate limits
- Each restaurant requires one API call to get place details
- Built-in 100ms delay between requests
- Consider running during off-peak hours for large batches

## Security Notes

- The edge function uses the service role key for database writes
- Admin screen requires admin privileges
- Test script uses the anon key (read-only operations only)
- Google Places API key should be restricted to your Supabase edge functions domain
