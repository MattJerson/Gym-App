// @ts-nocheck
// deno-lint-ignore-file
// Deno Deploy (Supabase Edge Function): auto-notify
// Automatically sends notifications based on user behavior and triggers
// Runs on a schedule (cron job) to check conditions and send personalized notifications

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const EXPO_API = "https://exp.host/--/api/v2/push/send";

// Helper: Send Expo push notification
async function sendExpoPush(tokens: string[], title: string, body: string, data: any = {}) {
  if (tokens.length === 0) return { sent: 0, results: [] };

  // Chunk tokens (max 100 per request per Expo recommendations)
  const chunk = <T>(arr: T[], size: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const batches = chunk(tokens, 100);
  const results: any[] = [];

  for (const batch of batches) {
    try {
      const res = await fetch(EXPO_API, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(
          batch.map((token) => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: { ...data, automated: true }
          }))
        ),
      });
      const json = await res.json();
      results.push(json);
    } catch (err) {
      console.error('Expo push error:', err);
      results.push({ error: String(err) });
    }
  }

  return { sent: tokens.length, results };
}

// Helper: Get user's device tokens
async function getUserTokens(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('device_tokens')
    .select('expo_token')
    .eq('user_id', userId);
  return (data || []).map((r: any) => r.expo_token).filter((t: string) => t);
}

// Helper: Check if notification should be sent to user (respects cooldown)
async function shouldSendToUser(supabase: any, userId: string, trigger: any): Promise<boolean> {
  const { data, error } = await supabase.rpc('should_send_notification', {
    p_user_id: userId,
    p_trigger_id: trigger.id,
    p_frequency_type: trigger.frequency_type || 'daily',
    p_frequency_value: trigger.frequency_value || 1,
    p_frequency_unit: trigger.frequency_unit || 'days'
  });

  if (error) {
    console.error('Error checking cooldown:', error);
    return false; // Fail safe - don't send if error
  }

  return data === true;
}

// Helper: Record that notification was sent to user
async function recordSend(supabase: any, userId: string, triggerId: string) {
  const { error } = await supabase.rpc('record_notification_send', {
    p_user_id: userId,
    p_trigger_id: triggerId
  });

  if (error) {
    console.error('Error recording send:', error);
  }
}

// Helper: Log notification send
async function logNotification(supabase: any, userId: string, triggerId: string, title: string, message: string, type: string) {
  const { data, error } = await supabase.from('notification_logs').insert({
    user_id: userId,
    trigger_id: triggerId,
    title,
    message,
    type,
    sent_at: new Date().toISOString()
  });
  
  if (error) {
    console.error('❌ Failed to log notification:', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId,
      triggerId
    });
    throw error;
  }
  
  console.log('✅ Logged notification for user:', userId);
  return data;
}

serve(async (req) => {
  try {
    // This function can be called via HTTP POST or scheduled cron
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceKey) {
      return new Response('Missing environment variables', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    });

    console.log('🤖 Auto-notify started at', new Date().toISOString());

    // Get all active triggers
    const { data: triggers, error: triggerError } = await supabase
      .from('notification_triggers')
      .select('*')
      .eq('is_active', true);

    if (triggerError) {
      console.error('Error fetching triggers:', triggerError);
      return new Response(JSON.stringify({ error: 'Failed to fetch triggers' }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    console.log(`📋 Found ${triggers?.length || 0} active triggers`);

    let totalSent = 0;
    let totalSkipped = 0;
    const results: any[] = [];
    const errors: any[] = []; // Track all errors

    // Process each trigger
    for (const trigger of triggers || []) {
      console.log(`\n🔍 Processing trigger: ${trigger.trigger_type}`);
      console.log(`   Frequency: ${trigger.frequency_type} (every ${trigger.frequency_value} ${trigger.frequency_unit})`);
      
      let targetUsers: any[] = [];

      // Determine which users should receive this notification
      switch (trigger.trigger_type) {
        case 'no_login_today':
        case 'no_login_3_days': {
          const daysAgo = trigger.trigger_type === 'no_login_today' ? 1 : 3;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
          
          console.log(`   🔍 Looking for users who haven't logged in since ${cutoffDate.toISOString()}`);
          
          const { data: users, error: userError } = await supabase
            .from('registration_profiles')
            .select('user_id, details, last_login_at')
            .lt('last_login_at', cutoffDate.toISOString())
            .not('last_login_at', 'is', null); // Only users who have logged in before
          
          if (userError) {
            console.error(`   ❌ Error fetching inactive users:`, userError);
          }
          
          targetUsers = users || [];
          console.log(`   👥 Found ${targetUsers.length} users inactive for ${daysAgo}+ days`);
          break;
        }

        case 'no_workout_logged': {
          // Users who haven't logged a workout today
          const today = new Date().toISOString().split('T')[0];
          
          const { data: allUsers } = await supabase
            .from('registration_profiles')
            .select('user_id');
          
          const { data: workoutsToday } = await supabase
            .from('completed_workouts')
            .select('user_id')
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`);
          
          const usersWithWorkouts = new Set((workoutsToday || []).map((w: any) => w.user_id));
          targetUsers = (allUsers || []).filter((u: any) => !usersWithWorkouts.has(u.user_id));
          break;
        }

        case 'no_meal_logged': {
          // Users who haven't logged a meal today
          const today = new Date().toISOString().split('T')[0];
          
          const { data: allUsers } = await supabase
            .from('registration_profiles')
            .select('user_id');
          
          const { data: mealsToday } = await supabase
            .from('daily_intake')
            .select('user_id')
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`);
          
          const usersWithMeals = new Set((mealsToday || []).map((m: any) => m.user_id));
          targetUsers = (allUsers || []).filter((u: any) => !usersWithMeals.has(u.user_id));
          break;
        }

        case 'streak_milestone_3':
        case 'streak_milestone_7':
        case 'streak_milestone_30': {
          const targetStreak = parseInt(trigger.trigger_type.split('_')[2]);
          
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id, details')
            .eq('details->>current_streak', targetStreak);
          
          targetUsers = users || [];
          break;
        }

        case 'monday_morning':
        case 'friday_challenge':
        case 'sunday_planning':
        case 'wednesday_wellness': {
          // Day-specific notifications - send to all active users
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id');
          
          targetUsers = users || [];
          break;
        }

        case 'daily_hydration': {
          // Send to all users
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id');
          
          targetUsers = users || [];
          break;
        }

        case 'weekly_progress_report': {
          // Sunday evening - send to all users
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id');
          
          targetUsers = users || [];
          break;
        }

        default:
          console.log(`⚠️ Unknown trigger type: ${trigger.trigger_type}`);
          continue;
      }

      console.log(`👥 Found ${targetUsers.length} target users for ${trigger.trigger_type}`);

      let sentCount = 0;
      let skippedCount = 0;

      // Send notification to each target user (with cooldown check)
      for (const user of targetUsers) {
        try {
          // ⭐ CHECK COOLDOWN BEFORE SENDING
          const shouldSend = await shouldSendToUser(supabase, user.user_id, trigger);

          if (!shouldSend) {
            skippedCount++;
            if (skippedCount <= 3) { // Only log first 3 to avoid spam
              console.log(`⏭️ Skipping user ${user.user_id.substring(0, 8)}... - cooldown not expired for ${trigger.trigger_type}`);
            }
            continue;
          }

          console.log(`✅ Cooldown expired for user ${user.user_id.substring(0, 8)}... - will send ${trigger.trigger_type}`);

          const tokens = await getUserTokens(supabase, user.user_id);
          
          // Always log the notification, even if user has no device tokens
          // This ensures we track all automated notifications sent
          try {
            await logNotification(
              supabase,
              user.user_id,
              trigger.id,
              trigger.title,
              trigger.message,
              trigger.type
            );

            // Record that we sent it (for cooldown tracking)
            await recordSend(supabase, user.user_id, trigger.id);

            sentCount++;
            totalSent++;
          } catch (logError: any) {
            console.error(`❌ Failed to log notification for user ${user.user_id}:`, logError);
            errors.push({
              user_id: user.user_id,
              trigger: trigger.trigger_type,
              error: logError?.message || String(logError),
              code: logError?.code,
              details: logError?.details,
              hint: logError?.hint
            });
            continue; // Don't send push if logging failed
          }
          
          // Send push notification if user has device tokens
          if (tokens.length > 0) {
            try {
              await sendExpoPush(
                tokens,
                trigger.title,
                trigger.message,
                { type: trigger.type, trigger_type: trigger.trigger_type }
              );
              console.log(`📱 Push notification sent to ${tokens.length} device(s) for user ${user.user_id}`);
            } catch (pushError) {
              console.error(`❌ Failed to send push notification to user ${user.user_id}:`, pushError);
            }
          } else {
            console.log(`ℹ️ No device tokens for user ${user.user_id}, notification logged but not pushed`);
          }
        } catch (userErr) {
          console.error(`Error processing user ${user.user_id}:`, userErr);
        }
      }

      totalSkipped += skippedCount;

      results.push({
        trigger: trigger.trigger_type,
        title: trigger.title,
        frequency: `${trigger.frequency_type} (${trigger.frequency_value} ${trigger.frequency_unit})`,
        potentialTargets: targetUsers.length,
        sent: sentCount,
        skipped: skippedCount
      });

      console.log(`✅ Trigger ${trigger.trigger_type}: Sent ${sentCount}, Skipped ${skippedCount} (cooldown)`);
    }

    console.log(`\n✅ Auto-notify complete. Total sent: ${totalSent}, Total skipped: ${totalSkipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalSent,
        totalSkipped,
        triggers: results,
        errors: errors.length > 0 ? errors : undefined, // Include errors in response
        errorCount: errors.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Auto-notify error:', error);
    return new Response(
      JSON.stringify({
        error: String(error?.message || error)
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    );
  }
});
