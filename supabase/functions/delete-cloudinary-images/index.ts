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
    
    const results = [];
    const failedDeletions = [];

    // Delete images one by one (Cloudinary's bulk delete has limits)
    for (const publicId of publicIds) {
      try {
        console.log(`Deleting Cloudinary image: ${publicId}`);
        
        // Create the string to sign
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        
        // Generate SHA-1 signature
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Make API call to Cloudinary
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: 'POST',
            body: formData
          }
        );

        const cloudinaryResult = await cloudinaryResponse.json();
        
        if (cloudinaryResult.result === 'ok' || cloudinaryResult.result === 'not found') {
          console.log(`Successfully deleted or not found: ${publicId}`);
          results.push({ publicId, status: 'success', result: cloudinaryResult.result });
        } else {
          console.error(`Failed to delete ${publicId}:`, cloudinaryResult);
          failedDeletions.push({ publicId, error: cloudinaryResult });
          results.push({ publicId, status: 'error', error: cloudinaryResult });
        }
      } catch (error) {
        console.error(`Error deleting ${publicId}:`, error);
        failedDeletions.push({ publicId, error: error.message });
        results.push({ publicId, status: 'error', error: error.message });
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