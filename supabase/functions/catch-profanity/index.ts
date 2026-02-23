// Located at: supabase/functions/profanity-filter/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Filter } from 'npm:glin-profanity@2.3.8';
console.log('Profanity filter function (using glin-profanity) has been initialized.');
serve(async (req)=>{
  // CORS preflight request handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }
  try {
    // Get the text from the request body
    const { text } = await req.json();
    // Validate the input
    if (!text) {
      return new Response(JSON.stringify({
        error: 'The "text" field is required.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Create a new Filter instance with balanced detection
    const filter = new Filter({
      allLanguages: true,
      caseSensitive: false,
      wordBoundaries: true,
      allowObfuscatedMatch: true,
      fuzzyToleranceLevel: 0.6,
      severityLevels: true
    });
    // Get detailed results to ensure consistency
    const detailedResult = filter.checkProfanity(text);
    // Base isClean on the actual detailed results, not isProfane() method
    // If there are no profane words AND containsProfanity is false, then it's clean
    const isActuallyClean = !detailedResult.containsProfanity && detailedResult.profaneWords.length === 0;
    // Prepare the response data - only return isClean as requested
    const responseData = {
      isClean: isActuallyClean
    };
    // Send the successful response back
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    // Error handling
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
