import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log('=== Edge Function Started ===');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Cloudinary credentials
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

    console.log('Environment variables loaded:', {
      supabaseUrl: supabaseUrl ? '✓' : '✗',
      supabaseKey: supabaseKey ? '✓' : '✗',
      cloudName: cloudName ? '✓' : '✗',
      apiKey: apiKey ? '✓' : '✗',
      apiSecret: apiSecret ? '✓' : '✗'
    });

    const { tempPath, bucket, userId, type } = await req.json();
    
    console.log('Request body received:', { 
      tempPath, 
      bucket, 
      userId, 
      type,
      hasTempPath: !!tempPath,
      hasBucket: !!bucket,
      hasUserId: !!userId,
      hasType: !!type
    });
    
    if (!tempPath || !bucket || !userId || !type) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Download the image from Supabase Storage
    console.log('=== Starting Download ===');
    console.log('Attempting to download from bucket:', bucket);
    console.log('Attempting to download path:', tempPath);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(tempPath);
    
    console.log('Download result:', {
      hasData: !!fileData,
      hasError: !!downloadError,
      errorMessage: downloadError?.message,
      errorCode: downloadError?.statusCode,
      errorDetails: downloadError
    });
    
    if (downloadError || !fileData) {
      console.error('Download failed:', {
        error: downloadError,
        errorMessage: downloadError?.message,
        errorCode: downloadError?.statusCode,
        hasFileData: !!fileData
      });
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to download image: ${downloadError?.message || 'Unknown error'}`
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('=== File Downloaded Successfully ===');
    console.log('File data details:', {
      size: fileData.size,
      type: fileData.type,
      hasSize: fileData.size > 0,
      sizeInKB: Math.round(fileData.size / 1024),
      sizeInMB: Math.round(fileData.size / (1024 * 1024) * 100) / 100
    });
    
    if (fileData.size === 0) {
      console.error('=== EMPTY FILE DETECTED ===');
      console.error('File size is 0 bytes');
      console.error('This suggests the upload to temp folder failed or the file was corrupted');
      
      // Let's try to list files in the temp folder to see what's there
      console.log('=== Checking temp folder contents ===');
      const { data: listData, error: listError } = await supabase.storage
        .from(bucket)
        .list('temp');
      
      console.log('Temp folder listing:', {
        hasListData: !!listData,
        listError: listError,
        fileCount: listData?.length || 0,
        files: listData?.map(f => ({ name: f.name, size: f.metadata?.size, updated: f.updated_at }))
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Downloaded image is empty - check upload process'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert blob to base64 for Cloudinary upload
    console.log('=== Converting to Base64 ===');
    const arrayBuffer = await fileData.arrayBuffer();
    console.log('ArrayBuffer details:', {
      byteLength: arrayBuffer.byteLength,
      hasData: arrayBuffer.byteLength > 0
    });
    
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const dataURI = `data:${fileData.type};base64,${base64}`;
    
    console.log('Base64 conversion complete:', {
      base64Length: base64.length,
      dataURILength: dataURI.length,
      hasBase64: base64.length > 0,
      mimeType: fileData.type
    });

    // Upload to Cloudinary
    console.log('=== Uploading to Cloudinary ===');
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `imhungri/${type}`;
    const publicId = `${type}_${userId}_${timestamp}`;
    const eager = 'c_fill,w_1200,h_1200,q_90|c_fill,w_800,h_800,q_85|c_fill,w_400,h_400,q_80|c_fill,w_200,h_200,q_75|c_fill,w_100,h_100,q_70';
    const format = 'webp';
    
    console.log('Cloudinary upload params:', {
      cloudName,
      folder,
      publicId,
      timestamp,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret
    });
    
    // Create signature for authenticated upload
    // IMPORTANT: Include ALL parameters (except file, api_key, resource_type, cloud_name)
    // and sort them alphabetically
    const stringToSign = `eager=${eager}&folder=${folder}&format=${format}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    
    console.log('String to sign:', stringToSign.replace(apiSecret, '[SECRET]'));
    
    const signature = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(stringToSign)
    );
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const formData = new FormData();
    formData.append('file', dataURI);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signatureHex);
    formData.append('folder', folder);
    formData.append('public_id', publicId);
    
    // Optional: Add eager transformations to generate variants immediately
    formData.append('eager', eager);
    formData.append('format', format); // Convert to WebP

    console.log('Sending request to Cloudinary...');
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('Cloudinary response:', {
      status: cloudinaryResponse.status,
      statusText: cloudinaryResponse.statusText,
      ok: cloudinaryResponse.ok,
      headers: Object.fromEntries(cloudinaryResponse.headers.entries())
    });

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary upload failed:', {
        status: cloudinaryResponse.status,
        statusText: cloudinaryResponse.statusText,
        errorText
      });
      throw new Error(`Cloudinary upload failed: ${cloudinaryResponse.status} - ${errorText}`);
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log('=== Cloudinary Upload Successful ===');
    console.log('Cloudinary response data:', {
      public_id: cloudinaryData.public_id,
      secure_url: cloudinaryData.secure_url,
      format: cloudinaryData.format,
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      bytes: cloudinaryData.bytes
    });

    // Build variant URLs (Cloudinary transformations)
    const variants = {
      original: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1200,h_1200,q_90,f_webp/${cloudinaryData.public_id}`,
      large: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_800,q_85,f_webp/${cloudinaryData.public_id}`,
      medium: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_400,h_400,q_80,f_webp/${cloudinaryData.public_id}`,
      small: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_200,h_200,q_75,f_webp/${cloudinaryData.public_id}`,
      thumbnail: `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_100,h_100,q_70,f_webp/${cloudinaryData.public_id}`,
      public: cloudinaryData.secure_url, // Original uploaded URL
      cloudinary_id: cloudinaryData.public_id // Store this for future transformations
    };

    // Store metadata in database
    console.log('=== Storing Metadata ===');
    const { data: metadataResult, error: metadataError } = await supabase
      .from('image_metadata')
      .insert({
        image_type: type,
        original_path: cloudinaryData.secure_url, // Add this - use Cloudinary URL as the original path
        variants: variants,
        cloudinary_public_id: cloudinaryData.public_id,
        created_at: new Date().toISOString(),
        user_id: userId
      })
      .select()
      .single();

    if (metadataError) {
      console.error('Metadata storage error:', metadataError);
    } else {
      console.log('Metadata stored successfully:', {
        metadataId: metadataResult?.image_metadata_id
      });
    }

    // Clean up temp file from Supabase Storage
    console.log('=== Cleaning Up Temp File ===');
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([tempPath]);
    
    if (deleteError) {
      console.warn('Failed to delete temp file:', deleteError);
    } else {
      console.log('Temp file deleted successfully');
    }

    console.log('=== Function Completed Successfully ===');
    return new Response(JSON.stringify({
      success: true,
      metadataId: metadataResult?.image_metadata_id,
      variants: variants,
      cloudinaryId: cloudinaryData.public_id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('=== Function Failed ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({
      success: false,
      error: error.message || String(error)
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});