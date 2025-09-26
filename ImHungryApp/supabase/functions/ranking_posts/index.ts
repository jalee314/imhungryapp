import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// ------------------- Edge Function Handler -------------------
Deno.serve(async (req)=>{
  const { user_id, location } = await req.json();
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));
  // --- 1. Get Candidate Deals (using updated PostGIS RPC) ---
  const { data: deals, error: dealsError } = await supabase.rpc('nearby_deals', {
    lat: location.latitude,
    long: location.longitude,
    radius_miles: 10
  });
  if (dealsError) {
    return new Response(JSON.stringify({
      error: `RPC Error: ${dealsError.message}`
    }), {
      status: 500
    });
  }
  if (!deals || deals.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  // --- 2. Apply Additional Gates (Flags) ---
  const gatedDeals = await applyFlagGates(deals, user_id, supabase);
  // --- 3. Scoring ---
  const scoredDeals = await Promise.all(gatedDeals.map(async (deal)=>{
    const relevance = await calculatePersonalRelevanceScore(deal, user_id, location, supabase);
    const quality = await calculateQualityScore(deal, supabase);
    const recency = calculateRecencyScore(deal);
    const weightedScore = relevance * 0.3 + quality * 0.4 + recency * 0.2;
    return {
      ...deal,
      weightedScore
    };
  }));
  // --- 4. Rank Deals & Apply Diversity Score ---
  const sortedDeals = scoredDeals.sort((a, b)=>(b.weightedScore || 0) - (a.weightedScore || 0));
  let rankedDeals = applyDiversity(sortedDeals);
  // --- 5. Inject Randomness ---
  const finalFeed = injectRandomness(rankedDeals);
  // --- 6. Return Final Feed ---
  // MODIFICATION: Instead of just the ID, create an object with the ID and title.
  const responseData = finalFeed.map((deal)=>({
      deal_id: deal.deal_id,
      title: deal.deal_template.title
    }));
  return new Response(JSON.stringify(responseData), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
// ------------------- Helper Functions (Typeless Version) -------------------
/**
 * @param {any[]} deals - Array of deal objects.
 * @param {string} user_id
 * @param {any} supabase
 */ async function applyFlagGates(deals, user_id, supabase) {
  const mockReportedDealIds = [
    'reported-deal-id-1',
    'reported-deal-id-2'
  ];
  return deals.filter((deal)=>deal && !mockReportedDealIds.includes(deal.deal_id));
}
/**
 * @param {any} deal - A single deal object from the RPC, now including distance_miles.
 * @param {string} user_id
 * @param {any} location - No longer needed for distance, but kept for consistency.
 * @param {any} supabase
 */ async function calculatePersonalRelevanceScore(deal, user_id, location, supabase) {
  const mockUserCuisines = [
    'cuisine-id-mexican',
    'cuisine-id-italian'
  ];
  const cuisineId = deal?.deal_template?.cuisine_id;
  const hasCuisineMatch = cuisineId ? mockUserCuisines.includes(cuisineId) : false;
  const cuisineScore = hasCuisineMatch ? 1.0 : 0.2;
  // --- MODIFICATION ---
  // Use the pre-calculated distance from the SQL function
  let distanceScore = 0;
  if (deal?.distance_miles !== null && deal?.distance_miles !== undefined) {
    const halfLifeMiles = 5; // The distance at which the score is 50%
    distanceScore = Math.pow(0.5, deal.distance_miles / halfLifeMiles);
  }
  // Final weighted score for relevance
  return cuisineScore * 0.2 + distanceScore * 0.1;
}
/**
 * @param {any} deal
 * @param {any} supabase
 */ async function calculateQualityScore(deal, supabase) {
  if (!deal || !deal.deal_id) return 0;
  const pseudoRandomScore = deal.deal_id.charCodeAt(0) % 10 / 10;
  return pseudoRandomScore;
}
/**
 * @param {any} deal
 */ function calculateRecencyScore(deal) {
  if (!deal?.created_at) return 0;
  const halfLifeHours = 48;
  const dealAgeHours = (new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60);
  return Math.pow(0.5, dealAgeHours / halfLifeHours);
}
/**
 * @param {any[]} deals
 */ function applyDiversity(deals) {
  const restaurantCount = {};
  return deals.map((deal)=>{
    const restaurantId = deal?.deal_template?.restaurant_id;
    if (!restaurantId) return deal;
    restaurantCount[restaurantId] = (restaurantCount[restaurantId] || 0) + 1;
    if (restaurantCount[restaurantId] > 1) {
      const penalty = Math.pow(0.8, restaurantCount[restaurantId] - 1);
      deal.weightedScore = (deal.weightedScore || 0) * penalty;
    }
    return deal;
  });
}
/**
 * @param {any[]} rankedDeals
 */ function injectRandomness(rankedDeals) {
  if (rankedDeals.length < 5) return rankedDeals;
  const lowestScoringDeal = rankedDeals.pop();
  if (lowestScoringDeal) {
    rankedDeals.splice(3, 0, lowestScoringDeal);
  }
  return rankedDeals;
}
