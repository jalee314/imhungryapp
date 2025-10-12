import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// ------------------- Gating & Filtering Functions -------------------
async function applyBlockedGates(deals, user_id, supabase) {
  if (!deals || deals.length === 0) return [];
  const { data: blockedUsers, error } = await supabase.rpc('get_blocked_user_ids', {
    p_user_id: user_id
  });
  if (error) {
    console.error('Error fetching blocked user IDs:', error.message);
    return deals;
  }
  if (!blockedUsers || blockedUsers.length === 0) return deals;
  const blockedUserSet = new Set(blockedUsers.map((record)=>record.user_id));
  const filteredDeals = deals.filter((deal)=>{
    const authorId = deal.deal_template?.user_id;
    return !blockedUserSet.has(authorId);
  });
  console.log(`Removed ${deals.length - filteredDeals.length} deal(s) from blocked users.`);
  return filteredDeals;
}
async function applyReportGates(deals, user_id, supabase) {
  if (!deals || deals.length === 0) return [];
  const dealIds = deals.map((deal)=>deal.deal_id);
  const { data: reportCounts, error: reportCountsError } = await supabase.rpc('get_deal_report_counts', {
    deal_ids: dealIds
  });
  if (reportCountsError) {
    console.error('Error fetching report counts via RPC:', reportCountsError.message);
    return deals;
  }
  const reportCountMap = new Map();
  if (reportCounts) {
    for (const report of reportCounts){
      if (report.deal_id && typeof report.report_count === 'number') {
        reportCountMap.set(report.deal_id, report.report_count);
      }
    }
  }
  const { data: userReportedDeals, error: userReportsError } = await supabase.from('user_report').select('deal_id').in('deal_id', dealIds).eq('reporter_user_id', user_id);
  if (userReportsError) {
    console.error('Error fetching user-specific reports:', userReportsError.message);
    return deals;
  }
  const userReportedSet = new Set(userReportedDeals?.map((r)=>r.deal_id) || []);
  return deals.filter((deal)=>{
    const totalReports = reportCountMap.get(deal.deal_id) || 0;
    const isReportedByUser = userReportedSet.has(deal.deal_id);
    return !(totalReports >= 2 || isReportedByUser);
  });
}
// ------------------- Scoring Component Functions -------------------
function calculatePersonalRelevanceScore(deal, userCuisineSet, market) {
  const cuisineId = deal?.deal_template?.cuisine_id;
  // If user has no cuisine preferences (skipped selection), remove cuisine influence entirely
  let cuisineScore;
  if (userCuisineSet.size === 0) {
    cuisineScore = 0; // No cuisine influence at all for users who skipped
  } else {
    const hasCuisineMatch = cuisineId ? userCuisineSet.has(cuisineId) : false;
    cuisineScore = hasCuisineMatch ? 1.0 : 0.5;
  }
  const marketRules = {
    NYC: {
      halfLife: 2.5,
      cutoff: 5
    },
    OC: {
      halfLife: 5,
      cutoff: 10
    },
    DEFAULT: {
      halfLife: 5,
      cutoff: 10
    }
  };
  const rules = marketRules[market] || marketRules.DEFAULT;
  let distanceScore = 0;
  if (deal?.distance_miles !== null && deal?.distance_miles !== undefined) {
    if (deal.distance_miles > rules.cutoff) {
      distanceScore = 0;
    } else {
      distanceScore = Math.pow(0.5, deal.distance_miles / rules.halfLife);
    }
  }
  // Adjust weighting based on whether user has cuisine preferences
  let weightedCuisineScore, weightedDistanceScore;
  if (userCuisineSet.size === 0) {
    // For users without cuisine preferences, give full weight to distance
    weightedCuisineScore = 0;
    weightedDistanceScore = distanceScore;
  } else {
    // For users with preferences, use the original 2:1 ratio
    weightedCuisineScore = cuisineScore * (2 / 3);
    weightedDistanceScore = distanceScore * (1 / 3);
  }
  const finalRelevanceScore = weightedCuisineScore + weightedDistanceScore;
  return {
    relevance: finalRelevanceScore,
    cuisineScore: weightedCuisineScore,
    distanceScore: weightedDistanceScore
  };
}
const INTERACTION_WEIGHTS = {
  save: 3.0,
  share: 3.0,
  'click-through': 2.5,
  'click-open': 1.5,
  upvote: 1.0,
  downvote: -2.0,
  report: -3.0,
  view: 0.0
};
function applyTimeDecay(daysAgo, halfLife = 15) {
  if (daysAgo < 0) return 1.0;
  return Math.pow(0.5, daysAgo / halfLife);
}
function getWeightedInteractions(interactions) {
  let weightedPositives = 0;
  let weightedNegatives = 0;
  for (const action of interactions){
    const weight = INTERACTION_WEIGHTS[action.interaction_type] || 0;
    const daysAgo = (new Date().getTime() - new Date(action.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = applyTimeDecay(daysAgo);
    const decayedWeight = weight * decayFactor;
    if (decayedWeight > 0) {
      weightedPositives += decayedWeight;
    } else {
      weightedNegatives += decayedWeight;
    }
  }
  return {
    weightedPositives,
    weightedNegatives
  };
}
function calculateGlobalAvgEfficiency(deals, interactionsByDeal, viewsByDeal) {
  let totalEfficiencySum = 0;
  if (deals.length === 0) return 0;
  for (const deal of deals){
    const dealInteractions = interactionsByDeal.get(deal.deal_id) || [];
    const { weightedPositives, weightedNegatives } = getWeightedInteractions(dealInteractions);
    const totalViews = viewsByDeal.get(deal.deal_id) || 0;
    const denominator = totalViews + Math.abs(weightedNegatives) + 1e-6;
    totalEfficiencySum += weightedPositives / denominator;
  }
  return totalEfficiencySum / deals.length;
}
function findPriorStrength(deals, interactionsByDeal, viewsByDeal) {
  if (!deals || deals.length === 0) return 50; // Default C value if no deals
  const evidenceArray = deals.map((deal)=>{
    const dealInteractions = interactionsByDeal.get(deal.deal_id) || [];
    const { weightedNegatives } = getWeightedInteractions(dealInteractions);
    const totalViews = viewsByDeal.get(deal.deal_id) || 0;
    return totalViews + Math.abs(weightedNegatives);
  });
  evidenceArray.sort((a, b)=>a - b);
  const mid = Math.floor(evidenceArray.length / 2);
  return evidenceArray.length % 2 !== 0 ? evidenceArray[mid] : (evidenceArray[mid - 1] + evidenceArray[mid]) / 2;
}
function calculateSmoothedBehScore(interactions, totalViews, m, C) {
  const { weightedPositives, weightedNegatives } = getWeightedInteractions(interactions);
  const epsilon = 1e-6;
  const denominator = totalViews + Math.abs(weightedNegatives) + epsilon;
  const observedEfficiency = weightedPositives / denominator;
  const evidence = totalViews + Math.abs(weightedNegatives);
  // Prevent division by zero if C and evidence are both 0
  const smoothingDenominator = C + evidence;
  const smoothedEfficiency = smoothingDenominator > 0 ? (C * m + evidence * observedEfficiency) / smoothingDenominator : 0;
  const logFactor = Math.log10(1 + totalViews);
  return smoothedEfficiency * logFactor;
}
async function calculateQualityScore(deals, supabase) {
  if (!deals || deals.length === 0) return {
    normalizedScores: new Map(),
    m: 0,
    c: 0
  };
  const dealIds = deals.map((deal)=>deal.deal_id);
  const { data: interactions, error } = await supabase.from('interaction').select('deal_id, interaction_type, created_at').in('deal_id', dealIds);
  if (error) {
    console.error('Error fetching interactions:', error.message);
    return {
      normalizedScores: new Map(deals.map((d)=>[
          d.deal_id,
          0
        ])),
      m: 0,
      c: 0
    };
  }
  const interactionsByDeal = new Map();
  const viewsByDeal = new Map();
  deals.forEach((deal)=>{
    interactionsByDeal.set(deal.deal_id, []);
    viewsByDeal.set(deal.deal_id, deal.view_count || 0);
  });
  interactions.forEach((interaction)=>{
    if (interactionsByDeal.has(interaction.deal_id)) {
      interactionsByDeal.get(interaction.deal_id).push(interaction);
    }
  });
  const m = calculateGlobalAvgEfficiency(deals, interactionsByDeal, viewsByDeal);
  const c = findPriorStrength(deals, interactionsByDeal, viewsByDeal);
  const behScores = new Map();
  for (const deal of deals){
    const dealId = deal.deal_id;
    const dealInteractions = interactionsByDeal.get(dealId) || [];
    const totalViews = viewsByDeal.get(dealId) || 0;
    const score = calculateSmoothedBehScore(dealInteractions, totalViews, m, c);
    behScores.set(dealId, score);
  }
  const scoresArray = Array.from(behScores.values());
  const minScore = Math.min(...scoresArray);
  const maxScore = Math.max(...scoresArray);
  const scoreRange = maxScore - minScore;
  const normalizedScores = new Map();
  for (const [dealId, score] of behScores.entries()){
    const normalized = scoreRange < 1e-6 ? 0 : (score - minScore) / scoreRange;
    normalizedScores.set(dealId, normalized);
  }
  return {
    normalizedScores,
    m,
    c
  };
}
function calculateRecencyScore(deal) {
  if (!deal?.created_at) return 0;
  const halfLifeHours = 48;
  const dealAgeHours = (new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60);
  return Math.pow(0.5, dealAgeHours / halfLifeHours);
}
// ------------------- Ranking & Post-Processing Functions -------------------
function applyDiversity(deals) {
  const restaurantCount = {};
  return deals.map((deal)=>{
    const restaurantId = deal?.deal_template?.restaurant_id;
    if (!restaurantId || !deal.weightedScore) return deal;
    restaurantCount[restaurantId] = (restaurantCount[restaurantId] || 0) + 1;
    if (restaurantCount[restaurantId] > 1) {
      const penalty = Math.pow(0.8, restaurantCount[restaurantId] - 1);
      deal.weightedScore *= penalty;
    }
    return deal;
  });
}
function injectRandomness(rankedDeals) {
  if (rankedDeals.length < 5) return rankedDeals;
  const lowestScoringDeal = rankedDeals.pop();
  if (lowestScoringDeal) {
    rankedDeals.splice(3, 0, lowestScoringDeal);
  }
  return rankedDeals;
}
// ------------------- Edge Function Handler -------------------
Deno.serve(async (req)=>{
  try {
    const { user_id, location } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // 1. Fetch Candidate Deals
    let candidateDeals = [];
    let radiusMiles = 10;
    let attempts = 0;
    while(candidateDeals.length === 0 && attempts < 4){
      const { data, error } = await supabase.rpc('nearby_deals', {
        lat: location.latitude,
        long: location.longitude,
        radius_miles: radiusMiles
      });
      if (error) throw new Error(`RPC Error on attempt ${attempts + 1}: ${error.message}`);
      if (data && data.length > 0) {
        candidateDeals = data;
      } else {
        radiusMiles *= 2;
        attempts++;
      }
    }
    if (candidateDeals.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // 2. Apply Gates & Filters
    const dealsWithoutBlocked = await applyBlockedGates(candidateDeals, user_id, supabase);
    const gatedDeals = await applyReportGates(dealsWithoutBlocked, user_id, supabase);
    if (gatedDeals.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // 3. Score Deals
    const { data: preferredCuisines } = await supabase.rpc('get_user_cuisine_preferences', {
      p_user_id: user_id
    });
    const userCuisineSet = new Set(preferredCuisines?.map((p)=>p.cuisine_id) || []);
    const userMarket = 'OC'; // Example market
    const { normalizedScores: qualityScores, m, c } = await calculateQualityScore(gatedDeals, supabase);
    const scoredDeals = gatedDeals.map((deal)=>{
      const relevanceInfo = calculatePersonalRelevanceScore(deal, userCuisineSet, userMarket);
      const quality = qualityScores.get(deal.deal_id) || 0;
      const recency = calculateRecencyScore(deal);
      const weightedScore = (relevanceInfo.relevance * 0.3 + quality * 0.4 + recency * 0.2) / 0.9;
      return {
        ...deal,
        relevance: relevanceInfo.relevance,
        quality,
        recency,
        weightedScore,
        cuisineScore: relevanceInfo.cuisineScore,
        distanceScore: relevanceInfo.distanceScore,
        distanceUsertoRes: deal.distance_miles
      };
    });
    // 4. Log Scores for Debugging
    const scoreLogs = scoredDeals.map((deal)=>({
        deal_title: deal.deal_template?.title || 'Untitled Deal',
        deal_id: deal.deal_id,
        scores: {
          relevance: deal.relevance ? parseFloat(deal.relevance.toFixed(3)) : 0,
          quality: deal.quality ? parseFloat(deal.quality.toFixed(3)) : 0,
          recency: deal.recency ? parseFloat(deal.recency.toFixed(3)) : 0,
          final_score: deal.weightedScore ? parseFloat(deal.weightedScore.toFixed(3)) : 0
        }
      }));
    const logObject = {
      message: `Scoring analysis for ${scoredDeals.length} deals`,
      qualityScoreParams: {
        m_globalAvgEfficiency: parseFloat(m.toFixed(5)),
        c_priorStrength: parseFloat(c.toFixed(5))
      },
      analysis: scoreLogs
    };
    console.log(JSON.stringify(logObject, null, 2));
    // 5. Apply Final Ranking Adjustments
    let rankedDeals = applyDiversity(scoredDeals);
    rankedDeals.sort((a, b)=>(b.weightedScore || 0) - (a.weightedScore || 0));
    const finalFeed = injectRandomness(rankedDeals);
    // 6. Return Final Response
    const responseData = finalFeed.map((deal)=>({
        deal_id: deal.deal_id,
        title: deal.deal_template?.title || 'Untitled Deal',
        distance: deal.distance_miles
      }));
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Critical Error in Edge Function:', error.message, error.stack);
    return new Response(JSON.stringify({
      error: 'An internal server error occurred.',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
