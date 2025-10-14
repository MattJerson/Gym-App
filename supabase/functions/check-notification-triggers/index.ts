// @ts-nocheck
// deno-lint-ignore-file
// Supabase Edge Function: check-notification-triggers
// Checks all users for trigger conditions (no login, no workout, no meal, etc.)
// and creates personalized notifications, then sends them via push
// Should be scheduled to run hourly via cron or GitHub Actions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const EXPO_API = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      return new Response('Missing function environment: SUPABASE_URL/SERVICE_ROLE_KEY', {
        status: 500
      });
    }

    // Create admin client (service role to bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    console.log('🔍 Starting notification trigger checks...');

    // Get all users - try multiple approaches for compatibility
    let users = [];
    let usersError = null;

    // Try approach 1: registration_profiles table (only has user_id, not email)
    const { data: profileUsers, error: profileError } = await adminClient
      .from('registration_profiles')
      .select('user_id')
      .eq('account_status', 'active')
      .limit(1000);

    if (profileError) {
      console.error('Error fetching from registration_profiles:', profileError);
      
      // Try approach 2: auth.users directly (may not have email)
      const { data: authUsers, error: authError } = await adminClient
        .from('auth.users')
        .select('id')
        .limit(1000);
      
      if (authError) {
        console.error('Error fetching from auth.users:', authError);
        usersError = authError;
      } else {
        users = authUsers.map(u => ({ user_id: u.id }));
        console.log(`📊 Fetched ${users.length} users from auth.users`);
      }
    } else {
      users = profileUsers;
      console.log(`📊 Fetched ${users.length} users from registration_profiles`);
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No users found in database');
      return new Response(JSON.stringify({ 
        success: true,
        users_checked: 0,
        notifications_created: 0,
        notifications_sent: 0,
        message: 'No users found in database',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`📊 Checking ${users?.length || 0} users for trigger conditions...`);

    const results = {
      users_checked: users?.length || 0,
      notifications_created: 0,
      notifications_sent: 0,
      errors: []
    };

    // Check each user for trigger conditions
    for (const user of users || []) {
      try {
        // Check no login trigger
        const { data: loginCheck, error: loginError } = await adminClient
          .rpc('check_no_login_notification', { p_user_id: user.user_id });

        if (loginError) {
          console.error(`Error checking no_login for user ${user.user_id}:`, loginError);
          results.errors.push({ user_id: user.user_id, trigger: 'no_login', error: loginError.message });
        } else if (loginCheck) {
          results.notifications_created++;
          console.log(`✅ Created no_login notification for user ${user.user_id}`);
        }

        // Check no workout trigger
        const { data: workoutCheck, error: workoutError } = await adminClient
          .rpc('check_no_workout_notification', { p_user_id: user.user_id });

        if (workoutError) {
          console.error(`Error checking no_workout for user ${user.user_id}:`, workoutError);
          results.errors.push({ user_id: user.user_id, trigger: 'no_workout', error: workoutError.message });
        } else if (workoutCheck) {
          results.notifications_created++;
          console.log(`✅ Created no_workout notification for user ${user.user_id}`);
        }

        // Check no meal trigger
        const { data: mealCheck, error: mealError } = await adminClient
          .rpc('check_no_meal_notification', { p_user_id: user.user_id });

        if (mealError) {
          console.error(`Error checking no_meal for user ${user.user_id}:`, mealError);
          results.errors.push({ user_id: user.user_id, trigger: 'no_meal', error: mealError.message });
        } else if (mealCheck) {
          results.notifications_created++;
          console.log(`✅ Created no_meal notification for user ${user.user_id}`);
        }

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        results.errors.push({ user_id: user.user_id, error: String(userError) });
      }
    }

    console.log(`📝 Created ${results.notifications_created} notifications`);

    // Now fetch all draft notifications that need to be sent
    const { data: pendingNotifications, error: notifError } = await adminClient
      .from('notifications')
      .select('id, user_id, title, message, type')
      .eq('status', 'draft')
      .eq('target_audience', 'user')
      .not('user_id', 'is', null);

    if (notifError) {
      console.error('Error fetching pending notifications:', notifError);
      return new Response(JSON.stringify({ 
        ...results, 
        error: 'Failed to fetch pending notifications' 
      }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`📤 Sending ${pendingNotifications?.length || 0} pending notifications...`);

    // Send each notification via push
    for (const notification of pendingNotifications || []) {
      try {
        // Get user's device tokens
        const { data: tokens, error: tokenError } = await adminClient
          .from('device_tokens')
          .select('expo_token')
          .eq('user_id', notification.user_id);

        if (tokenError || !tokens || tokens.length === 0) {
          console.log(`⚠️ No device tokens found for user ${notification.user_id}`);
          // Still mark as sent even if no tokens (user will see it in-app)
          await adminClient
            .from('notifications')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', notification.id);
          continue;
        }

        // Send push notification via Expo
        const expoPushTokens = tokens.map(t => t.expo_token).filter(Boolean);
        
        if (expoPushTokens.length > 0) {
          const pushMessages = expoPushTokens.map(token => ({
            to: token,
            sound: 'default',
            title: notification.title,
            body: notification.message,
            data: { 
              type: notification.type,
              notification_id: notification.id
            }
          }));

          const response = await fetch(EXPO_API, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json'
            },
            body: JSON.stringify(pushMessages)
          });

          const pushResult = await response.json();
          console.log(`📲 Sent push notification to user ${notification.user_id}:`, pushResult);
        }

        // Mark notification as sent
        const { error: updateError } = await adminClient
          .from('notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Error updating notification ${notification.id}:`, updateError);
          results.errors.push({ 
            notification_id: notification.id, 
            error: updateError.message 
          });
        } else {
          results.notifications_sent++;
          console.log(`✅ Marked notification ${notification.id} as sent`);
        }

      } catch (sendError) {
        console.error(`Error sending notification ${notification.id}:`, sendError);
        results.errors.push({ 
          notification_id: notification.id, 
          error: String(sendError) 
        });
      }
    }

    console.log('✅ Notification trigger check complete!');
    console.log('📊 Results:', results);

    return new Response(JSON.stringify({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (e) {
    console.error('Fatal error:', e);
    return new Response(JSON.stringify({
      success: false,
      error: String(e?.message || e)
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
});
