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

// Helper: Check if notification should be sent to user (respects cooldown AND scheduling)
async function shouldSendToUser(supabase: any, userId: string, trigger: any): Promise<boolean> {
  // Check user registration date - don't send to brand new users (within 24 hours)
  const { data: profile } = await supabase
    .from('registration_profiles')
    .select('created_at')
    .eq('user_id', userId)
    .single();
  
  if (profile?.created_at) {
    const userAge = Date.now() - new Date(profile.created_at).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (userAge < twentyFourHours) {
      console.log(`⏭️ User ${userId.substring(0, 8)}... registered <24h ago, skipping`);
      return false;
    }
  }

  // Check if it's the right day of week for this trigger
  if (trigger.day_of_week !== null && trigger.day_of_week !== undefined) {
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    if (currentDay !== trigger.day_of_week) {
      console.log(`⏭️ Today is not the scheduled day for ${trigger.trigger_type} (need day ${trigger.day_of_week}, today is ${currentDay})`);
      return false;
    }
  }

  // Check if it's the right hour for this trigger (with 1-hour tolerance)
  if (trigger.hour_of_day !== null && trigger.hour_of_day !== undefined) {
    const currentHour = new Date().getHours();
    const hourDiff = Math.abs(currentHour - trigger.hour_of_day);
    
    if (hourDiff > 1) {
      console.log(`⏭️ Not the right hour for ${trigger.trigger_type} (need hour ${trigger.hour_of_day}, current is ${currentHour})`);
      return false;
    }
  }

  // Check cooldown
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

    // Get current day and hour for filtering triggers
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentHour = now.getHours();
    
    console.log(`📅 Current time: Day ${currentDay} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDay]}), Hour ${currentHour}`);

    // Get all active triggers
    const { data: allTriggers, error: triggerError } = await supabase
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

    // Filter triggers based on scheduling constraints
    const triggers = (allTriggers || []).filter(trigger => {
      // If trigger has day constraint, check if today matches
      if (trigger.day_of_week !== null && trigger.day_of_week !== undefined) {
        if (trigger.day_of_week !== currentDay) {
          console.log(`⏭️ Skipping ${trigger.trigger_type} - scheduled for day ${trigger.day_of_week}, today is ${currentDay}`);
          return false;
        }
      }

      // If trigger has hour constraint, check if current hour is within tolerance (±1 hour)
      if (trigger.hour_of_day !== null && trigger.hour_of_day !== undefined) {
        const hourDiff = Math.abs(currentHour - trigger.hour_of_day);
        if (hourDiff > 1) {
          console.log(`⏭️ Skipping ${trigger.trigger_type} - scheduled for hour ${trigger.hour_of_day}, current is ${currentHour}`);
          return false;
        }
      }

      return true;
    });

    console.log(`📋 Found ${allTriggers?.length || 0} active triggers, ${triggers.length} applicable for current time`);

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
        case 'no_login_today': {
          // Only send to users who were active before but haven't logged in today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id, last_login_at, created_at')
            .not('last_login_at', 'is', null) // Must have logged in before
            .lt('last_login_at', today.toISOString()) // Last login was before today
            .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()); // Registered >3 days ago (give grace period)
          
          targetUsers = users || [];
          console.log(`   � Found ${targetUsers.length} users who haven't logged in today`);
          break;
        }
        
        case 'no_login_3_days': {
          // Only send to users who haven't logged in for 3+ days
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id, last_login_at, created_at')
            .not('last_login_at', 'is', null) // Must have logged in before
            .lt('last_login_at', threeDaysAgo.toISOString()) // Last login was 3+ days ago
            .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Registered >7 days ago
          
          targetUsers = users || [];
          console.log(`   👥 Found ${targetUsers.length} users inactive for 3+ days`);
          break;
        }

        case 'no_workout_logged': {
          // Only send to users who:
          // 1. Haven't logged a workout in the last 24 hours
          // 2. Have logged at least one workout before (so they know how)
          // 3. Are registered >48 hours (grace period for new users)
          const now = new Date();
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
          
          // Get users registered >48h ago
          const { data: eligibleUsers } = await supabase
            .from('registration_profiles')
            .select('user_id')
            .lt('created_at', twoDaysAgo);
          
          if (!eligibleUsers || eligibleUsers.length === 0) {
            targetUsers = [];
            break;
          }
          
          const eligibleUserIds = eligibleUsers.map((u: any) => u.user_id);
          
          // Get users who have logged at least one workout ever
          const { data: usersWithHistory } = await supabase
            .from('completed_workouts')
            .select('user_id')
            .in('user_id', eligibleUserIds);
          
          if (!usersWithHistory || usersWithHistory.length === 0) {
            targetUsers = [];
            break;
          }
          
          const usersWithWorkoutHistory = new Set(usersWithHistory.map((w: any) => w.user_id));
          
          // Get users who logged a workout in the last 24 hours
          const { data: workoutsToday } = await supabase
            .from('completed_workouts')
            .select('user_id')
            .gte('created_at', twentyFourHoursAgo)
            .in('user_id', Array.from(usersWithWorkoutHistory));
          
          const usersWithWorkoutToday = new Set((workoutsToday || []).map((w: any) => w.user_id));
          
          // Target: users with workout history who haven't logged today
          targetUsers = Array.from(usersWithWorkoutHistory)
            .filter(userId => !usersWithWorkoutToday.has(userId))
            .map(user_id => ({ user_id }));
          
          console.log(`   👥 Found ${targetUsers.length} users who should log a workout today`);
          break;
        }

        case 'no_meal_logged': {
          // Only send to users who:
          // 1. Haven't logged a meal in the last 24 hours
          // 2. Have logged at least one meal before (so they know how)
          // 3. Are registered >48 hours (grace period for new users)
          const now = new Date();
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
          
          // Get users registered >48h ago
          const { data: eligibleUsers } = await supabase
            .from('registration_profiles')
            .select('user_id')
            .lt('created_at', twoDaysAgo);
          
          if (!eligibleUsers || eligibleUsers.length === 0) {
            targetUsers = [];
            break;
          }
          
          const eligibleUserIds = eligibleUsers.map((u: any) => u.user_id);
          
          // Get users who have logged at least one meal ever
          const { data: usersWithHistory } = await supabase
            .from('daily_intake')
            .select('user_id')
            .in('user_id', eligibleUserIds);
          
          if (!usersWithHistory || usersWithHistory.length === 0) {
            targetUsers = [];
            break;
          }
          
          const usersWithMealHistory = new Set(usersWithHistory.map((m: any) => m.user_id));
          
          // Get users who logged a meal in the last 24 hours
          const { data: mealsToday } = await supabase
            .from('daily_intake')
            .select('user_id')
            .gte('created_at', twentyFourHoursAgo)
            .in('user_id', Array.from(usersWithMealHistory));
          
          const usersWithMealToday = new Set((mealsToday || []).map((m: any) => m.user_id));
          
          // Target: users with meal history who haven't logged today
          targetUsers = Array.from(usersWithMealHistory)
            .filter(userId => !usersWithMealToday.has(userId))
            .map(user_id => ({ user_id }));
          
          console.log(`   👥 Found ${targetUsers.length} users who should log a meal today`);
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
          // Day-specific notifications - send to active users only
          // Active = logged in within last 14 days AND registered >24h ago
          const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id, last_login_at, created_at')
            .lt('created_at', oneDayAgo) // Registered >24h ago
            .gte('last_login_at', fourteenDaysAgo); // Active within last 14 days
          
          targetUsers = users || [];
          console.log(`   👥 Found ${targetUsers.length} active users for ${trigger.trigger_type}`);
          break;
        }

        case 'daily_hydration': {
          // Send to active users (logged in within last 7 days) who are registered >24h ago
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          
          const { data: users } = await supabase
            .from('registration_profiles')
            .select('user_id, last_login_at, created_at')
            .lt('created_at', oneDayAgo) // Registered >24h ago
            .gte('last_login_at', sevenDaysAgo); // Active within last 7 days
          
          targetUsers = users || [];
          console.log(`   👥 Found ${targetUsers.length} active users for hydration reminder`);
          break;
        }

        case 'weekly_progress_report': {
          // Sunday evening - send to users who:
          // 1. Registered >7 days ago (need full week of data)
          // 2. Have logged at least one activity this week
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          
          // Get users registered >7 days ago
          const { data: eligibleUsers } = await supabase
            .from('registration_profiles')
            .select('user_id, created_at')
            .lt('created_at', sevenDaysAgo);
          
          if (!eligibleUsers || eligibleUsers.length === 0) {
            targetUsers = [];
            break;
          }
          
          const eligibleUserIds = eligibleUsers.map((u: any) => u.user_id);
          
          // Get users who logged workouts this week
          const { data: workoutsThisWeek } = await supabase
            .from('completed_workouts')
            .select('user_id')
            .gte('created_at', sevenDaysAgo)
            .in('user_id', eligibleUserIds);
          
          // Get users who logged meals this week
          const { data: mealsThisWeek } = await supabase
            .from('daily_intake')
            .select('user_id')
            .gte('created_at', sevenDaysAgo)
            .in('user_id', eligibleUserIds);
          
          // Combine users with any activity this week
          const activeUserIds = new Set([
            ...(workoutsThisWeek || []).map((w: any) => w.user_id),
            ...(mealsThisWeek || []).map((m: any) => m.user_id)
          ]);
          
          targetUsers = Array.from(activeUserIds).map(user_id => ({ user_id }));
          console.log(`   👥 Found ${targetUsers.length} users with activity this week for progress report`);
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
