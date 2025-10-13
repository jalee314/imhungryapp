import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log('=== Delete Auth User Edge Function Started ===');
  
  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Environment variables loaded:', {
      supabaseUrl: supabaseUrl ? '✓' : '✗',
      supabaseServiceKey: supabaseServiceKey ? '✓' : '✗'
    });

    const { userId } = await req.json();
    
    console.log('Request body received:', { 
      userId,
      hasUserId: !!userId
    });
    
    if (!userId) {
      console.error('Missing userId');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing userId'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete user from auth.users table using service role permissions
    console.log(`Attempting to delete user from auth.users: ${userId}`);
    
    const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteAuthUserError) {
      console.error('Error deleting user from auth.users:', deleteAuthUserError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to delete auth user: ${deleteAuthUserError.message}`,
        details: deleteAuthUserError
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully deleted user from auth.users');

    return new Response(JSON.stringify({
      success: true,
      message: 'User successfully deleted from auth.users table',
      userId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in delete auth user function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});