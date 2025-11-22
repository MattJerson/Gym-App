// @ts-nocheck
// deno-lint-ignore-file
// Deno Deploy (Supabase Edge Function): notify
// Sends Expo push notifications for a user or broadcast, and records admin audit if desired.
// Expects JSON: { user_id?: string, title: string, body: string, data?: Record<string, unknown> }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const EXPO_API = "https://exp.host/--/api/v2/push/send";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405,
        headers: corsHeaders
      });
    }

  // Supabase clients via environment variables (configured in Function settings)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response('Missing function environment: SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY', { 
      status: 500,
      headers: corsHeaders
    });
  }

    // Auth: must be an authenticated admin caller
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders
      });
    }

    // Admin check via RLS-safe query to caller's registration profile
    const { data: profile, error: profErr } = await authClient
      .from('registration_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    if (profErr || !profile?.is_admin) {
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders
      });
    }

    const body = await req.json();
    const title = String(body?.title || '').slice(0, 150);
    const message = String(body?.body || '').slice(0, 1000);
    const meta = body?.data && typeof body.data === 'object' ? body.data : {};
    const userId: string | null = body?.user_id ? String(body.user_id) : null;
    const notificationId = body?.notification_id || null; // Optional notification_id from admin panel

    if (!title || !message) {
      return new Response('Invalid payload', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Resolve target tokens AND user IDs
    let tokens: string[] = [];
    let targetUserIds: string[] = [];
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    
    if (userId) {
      // Single user target
      const { data } = await adminClient.from('device_tokens').select('expo_token, user_id').eq('user_id', userId);
      tokens = (data || []).map((r: any) => r.expo_token);
      targetUserIds = [userId];
    } else {
      // Broadcast to all users
      const { data } = await adminClient.from('device_tokens').select('expo_token, user_id');
      tokens = (data || []).map((r: any) => r.expo_token);
      
      // Get all unique user IDs for notification_logs from auth.users
      const { data: allUsers, error: usersError } = await adminClient
        .from('profiles')
        .select('id');
      
      if (usersError) {
        console.error('Error fetching users for broadcast:', usersError.message);
      }
      
      targetUserIds = (allUsers || []).map((u: any) => u.id);
      console.log(`Broadcast: Found ${targetUserIds.length} users to notify`);
    }

    if (tokens.length === 0 && targetUserIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, results: [], logged: 0 }), { 
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // Create notification_logs entries for each target user (so they can see in inbox)
    let loggedCount = 0;
    if (targetUserIds.length > 0) {
      console.log(`Creating notification_logs for ${targetUserIds.length} users`);
      
      const notificationLogs = targetUserIds.map((uid: string) => ({
        user_id: uid,
        title: title,
        message: message,
        type: meta.type || 'info',
        sent_at: new Date().toISOString(),
        metadata: {
          notification_id: notificationId, // Link to original notification if available
          sent_from: 'admin_panel'
        }
      }));

      const { data: insertedLogs, error: logError } = await adminClient
        .from('notification_logs')
        .insert(notificationLogs)
        .select('id');

      if (logError) {
        console.error('Error creating notification_logs:', logError.message, logError);
        // Return error details so admin can see what went wrong
        return new Response(JSON.stringify({ 
          sent: 0, 
          logged: 0, 
          error: `Failed to create notification_logs: ${logError.message}`,
          details: logError
        }), { 
          status: 200, // Still return 200 to avoid breaking admin UI
          headers: { ...corsHeaders, 'content-type': 'application/json' }
        });
      } else {
        loggedCount = insertedLogs?.length || 0;
        console.log(`Successfully created ${loggedCount} notification_logs`);
      }
    } else {
      console.log('No target users found - targetUserIds.length is 0');
    }

    // Chunk tokens per Expo recommendations (up to ~100 per request)
    const chunk = <T>(arr: T[], size: number) => arr.reduce((acc: T[][], _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), [] as T[][]);
    const batches = chunk(tokens, 100);

    const results: any[] = [];
    for (const batch of batches) {
      const res = await fetch(EXPO_API, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(batch.map((token) => ({ to: token, sound: 'default', title, body: message, data: meta }))),
      });
      const json = await res.json();
      results.push(json);
    }

    return new Response(JSON.stringify({ sent: tokens.length, results, logged: loggedCount }), { 
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { 
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
