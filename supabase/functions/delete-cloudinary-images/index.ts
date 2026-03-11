import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== Cloudinary Deletion Edge Function Started ===');
  
  try {
    // ── AUTH CHECK: Require authenticated caller ────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();

    if (authError || !caller) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    console.log(`Authenticated caller: ${caller.id}`);
    // ── END AUTH CHECK ──────────────────────────────────────────────────
    // Get Cloudinary credentials
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

    console.log('Environment variables loaded:', {
      cloudName: cloudName ? '✓' : '✗',
      apiKey: apiKey ? '✓' : '✗',
      apiSecret: apiSecret ? '✓' : '✗'
    });

    const { publicIds } = await req.json();
    
    console.log('Request body received:', { 
      publicIds,
      count: publicIds?.length
    });
    
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      console.error('Missing or invalid publicIds array');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing or invalid publicIds array'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Generate signature for Cloudinary API call
    const timestamp = Math.round(Date.now() / 1000);
    
    const results: Array<{ publicId: string; status: string; result?: string; error?: any }> = [];
    const failedDeletions: Array<{ publicId: string; error: any }> = [];

    // Cloudinary's delete_resources API accepts up to 100 public_ids per call.
    // Batch into chunks of 100 for efficiency instead of one-by-one.
    const BATCH_SIZE = 100;
    const batches: string[][] = [];
    for (let i = 0; i < publicIds.length; i += BATCH_SIZE) {
      batches.push(publicIds.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      try {
        // Build the string to sign: public_ids[]=id1&public_ids[]=id2&...&timestamp=T
        const publicIdsParams = batch
          .sort() // Cloudinary requires sorted params for signature
          .map(id => `public_ids[]=${id}`)
          .join('&');
        const stringToSign = `${publicIdsParams}&timestamp=${timestamp}${apiSecret}`;

        const encoder = new TextEncoder();
        const data = encoder.encode(stringToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Build form data with all public_ids in one request
        const formData = new FormData();
        batch.forEach(id => formData.append('public_ids[]', id));
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        console.log(`Batch deleting ${batch.length} Cloudinary images`);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`,
          {
            method: 'DELETE',
            body: formData,
          }
        );

        const cloudinaryResult = await cloudinaryResponse.json();

        // delete_resources returns { deleted: { id: "deleted" | "not_found" }, ... }
        if (cloudinaryResult.deleted) {
          for (const [publicId, status] of Object.entries(cloudinaryResult.deleted)) {
            if (status === 'deleted' || status === 'not_found') {
              results.push({ publicId, status: 'success', result: status as string });
            } else {
              results.push({ publicId, status: 'error', error: status });
              failedDeletions.push({ publicId, error: status });
            }
          }
        } else if (cloudinaryResult.error) {
          // Whole batch failed — fall back to one-by-one for this batch
          console.warn('Batch delete failed, falling back to individual deletes:', cloudinaryResult.error);
          for (const publicId of batch) {
            try {
              const singleStringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
              const singleData = encoder.encode(singleStringToSign);
              const singleHashBuffer = await crypto.subtle.digest('SHA-1', singleData);
              const singleHashArray = Array.from(new Uint8Array(singleHashBuffer));
              const singleSig = singleHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

              const singleForm = new FormData();
              singleForm.append('public_id', publicId);
              singleForm.append('api_key', apiKey);
              singleForm.append('timestamp', timestamp.toString());
              singleForm.append('signature', singleSig);

              const singleResp = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
                { method: 'POST', body: singleForm }
              );
              const singleResult = await singleResp.json();

              if (singleResult.result === 'ok' || singleResult.result === 'not found') {
                results.push({ publicId, status: 'success', result: singleResult.result });
              } else {
                results.push({ publicId, status: 'error', error: singleResult });
                failedDeletions.push({ publicId, error: singleResult });
              }
            } catch (error) {
              results.push({ publicId, status: 'error', error: error.message });
              failedDeletions.push({ publicId, error: error.message });
            }
          }
        }
      } catch (batchError) {
        console.error('Error in batch delete:', batchError);
        batch.forEach(publicId => {
          results.push({ publicId, status: 'error', error: batchError.message });
          failedDeletions.push({ publicId, error: batchError.message });
        });
      }
    }

    console.log(`Deletion complete. Successful: ${results.filter(r => r.status === 'success').length}, Failed: ${failedDeletions.length}`);

    return new Response(JSON.stringify({
      success: failedDeletions.length === 0,
      results,
      failedDeletions,
      summary: {
        total: publicIds.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: failedDeletions.length
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Unexpected error in Cloudinary deletion function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});