import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== Delete Auth User Edge Function Started ===');
  
  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── AUTH CHECK: Verify caller identity ──────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create a client using the caller's JWT to identify them
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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Only allow users to delete themselves, or admins to delete anyone
    if (caller.id !== userId) {
      // Check if caller is admin
      const { data: adminCheck } = await supabase
        .from('user')
        .select('is_admin')
        .eq('user_id', caller.id)
        .single();

      if (!adminCheck?.is_admin) {
        console.error(`Unauthorized: caller ${caller.id} tried to delete user ${userId}`);
        return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      console.log(`Admin ${caller.id} authorized to delete user ${userId}`);
    }
    // ── END AUTH CHECK ──────────────────────────────────────────────────

    console.log('Request body received:', { userId, hasUserId: !!userId });

    // First check if user exists in auth.users
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    
    if (getUserError) {
      console.log('User not found in auth.users, considering this success:', getUserError);
      return new Response(JSON.stringify({
        success: true,
        message: 'User not found in auth.users (already deleted or never existed)',
        userId
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // First, sign out all sessions for this user
    console.log(`Signing out all sessions for user: ${userId}`);
    try {
      const { error: signOutError } = await supabase.auth.admin.signOut(userId, 'global');
      if (signOutError) {
        console.warn('Error signing out user sessions (continuing anyway):', signOutError);
      } else {
        console.log('Successfully signed out all user sessions');
      }
    } catch (signOutErr) {
      console.warn('Failed to sign out sessions (continuing anyway):', signOutErr);
    }

    // Wait a moment for sessions to clear
    await new Promise(resolve => setTimeout(resolve, 500));

    // Delete user from auth.users table using service role permissions
    console.log(`Attempting to delete user from auth.users: ${userId}`);
    console.log('User exists, proceeding with deletion...');
    
    const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteAuthUserError) {
      console.error('Error deleting user from auth.users:', deleteAuthUserError);
      console.error('Error details:', JSON.stringify(deleteAuthUserError, null, 2));
      
      // Try to get more information about what might be blocking the deletion
      console.log('Checking for remaining user references...');
      
      // Check if user still exists in public.user table
      try {
        const { data: publicUser, error: checkError } = await supabase
          .from('user')
          .select('user_id')
          .eq('user_id', userId)
          .single();
        
        if (publicUser) {
          console.error('FOUND ISSUE: User still exists in public.user table!', publicUser);
        } else {
          console.log('Good: User not found in public.user table');
        }
      } catch (checkErr) {
        console.log('Error checking public.user table:', checkErr);
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to delete auth user: ${deleteAuthUserError.message}`,
        details: {
          message: deleteAuthUserError.message,
          status: deleteAuthUserError.status,
          code: deleteAuthUserError.code,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('Successfully deleted user from auth.users');

    return new Response(JSON.stringify({
      success: true,
      message: 'User successfully deleted from auth.users table',
      userId
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Unexpected error in delete auth user function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});