# Realtime Subscription Optimization Guide

## 🚨 Problem
Your app was making **3.67 million** realtime queries (`realtime.list_changes`), consuming **99.2%** of database time.

## Root Causes Identified

### 1. **Feed.tsx - Subscription Recreation Loop** 🔴 CRITICAL
- **Location**: `src/screens/deal_feed/Feed.tsx:169`
- **Problem**: `useEffect` dependency array included `deals.length`
- **Impact**: Every time deals changed (which happens constantly), new subscriptions were created
- **Result**: Thousands of duplicate active subscriptions

### 2. **CommunityUploadedScreen.tsx - Same Issue** 🔴 CRITICAL  
- **Location**: `src/screens/deal_feed/CommunityUploadedScreen.tsx:219`
- **Problem**: Same `deals.length` dependency issue
- **Impact**: More duplicate subscriptions

### 3. **DataCacheContext - Unnecessary Subscriptions** 🟡 MEDIUM
- **Location**: `src/context/DataCacheContext.tsx:184-216`
- **Problem**: Realtime subscriptions for static data (categories, cuisines, restaurants)
- **Impact**: 3 additional channels constantly polling for changes that rarely happen

## ✅ Solutions Applied

### Fix #1: Feed.tsx Subscription Loop (Lines 96-177)
```typescript
// BEFORE (BAD):
}, [deals.length]); // ❌ Recreates subscriptions on every deal change

// AFTER (GOOD):
}, []); // ✅ Only creates subscriptions once on mount
```

**Changes Made**:
- Changed dependency array from `[deals.length]` to `[]`
- Added explicit cleanup of existing subscriptions before creating new ones
- Removed check for `deals.length === 0` (not needed with empty deps)
- Removed filtering by `dealIds` (subscription now handles all deals)

### Fix #2: CommunityUploadedScreen.tsx (Lines 96-219)
**Same fixes as Feed.tsx**:
- Empty dependency array
- Explicit cleanup before subscription creation
- Removed `deals.length` checks

### Fix #3: DataCacheContext - Removed Realtime (Lines 181-210)
**Removed**:
- `categoriesChannel` subscription
- `cuisinesChannel` subscription  
- `restaurantsChannel` subscription

**Replaced with**:
- Polling on app foreground (every 5 minutes minimum)
- Uses `AppState` listener instead of realtime
- Much more efficient for rarely-changing data

## 📊 Expected Impact

### Before:
- **3,670,876 realtime queries**
- **99.2% of database time**
- **~5ms per query**
- **19,658 seconds total time**

### After (Estimated):
- **~100-200 realtime queries** (only when subscriptions are created/destroyed)
- **<0.01% of database time**
- **99%+ reduction in realtime load**
- **Significant cost savings**

## 🔍 Verification Steps

1. **Check active subscriptions in Supabase Dashboard**:
   - Before: Should see thousands of subscriptions
   - After: Should see only a few (one per active screen)

2. **Monitor `pg_stat_statements`**:
   ```sql
   SELECT query, calls, mean_time, total_time 
   FROM pg_stat_statements 
   WHERE query LIKE '%realtime.list_changes%'
   ORDER BY calls DESC;
   ```

3. **Test in the app**:
   - Open Feed screen → Should see 2 subscriptions created (interactions + favorites)
   - Navigate away → Subscriptions should be cleaned up
   - Navigate back → New subscriptions created (not duplicates)

## 🛡️ Prevention

### Best Practices Implemented:
1. **Use empty dependency arrays** for realtime subscriptions
2. **Always cleanup** subscriptions in return function
3. **Avoid realtime for static data** - use polling instead
4. **Use refs for channels** to track and cleanup properly
5. **Debounce realtime events** to prevent update storms

### Code Patterns to Avoid:
```typescript
// ❌ BAD - Will recreate on every state change
useEffect(() => {
  setupSubscription();
}, [someState, otherState]);

// ✅ GOOD - Only create once
useEffect(() => {
  setupSubscription();
  return () => cleanup();
}, []);
```

## 📝 Additional Optimizations Possible

### Future Improvements (Optional):
1. **Create a centralized RealtimeService** to manage all subscriptions
2. **Add subscription pooling** to reuse channels across screens
3. **Implement connection state management** to handle offline scenarios
4. **Add metrics/logging** to monitor subscription health
5. **Consider removing DealDetailScreen click tracking** - view counts could be fetched on page load instead

### DealDetailScreen (Not Critical):
- Currently subscribes to click events to update view count
- This is fine since it's scoped to one deal
- Could optimize further by removing realtime and fetching on load
- Lower priority since it's not creating duplicate subscriptions

## 🎯 Summary

The critical fixes have been applied to **eliminate 99%+ of unnecessary realtime queries**. The main culprits were:
1. Subscription recreation loops in Feed screens
2. Unnecessary realtime for static data

These changes should dramatically improve database performance and reduce costs while maintaining the same user experience.

