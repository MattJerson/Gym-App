/**
 * Emergency fix for broken meal log trigger
 * Run this with: node fix-meal-trigger.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMealLogTrigger() {
  console.log('🔧 Fixing broken meal log trigger...\n');

  const fixes = [
    // Step 1: Check for existing triggers
    {
      name: 'Check existing triggers',
      sql: `
        SELECT tgname, pg_get_triggerdef(oid) as definition
        FROM pg_trigger
        WHERE tgrelid = 'public.user_meal_logs'::regclass
          AND tgisinternal = false;
      `
    },
    
    // Step 2: Drop all possible trigger variations
    {
      name: 'Drop broken triggers',
      sql: `
        DROP TRIGGER IF EXISTS trigger_update_weight_tracking ON public.user_meal_logs;
        DROP TRIGGER IF EXISTS trigger_update_weight_auto ON public.user_meal_logs;
        DROP TRIGGER IF EXISTS update_weight_tracking_trigger ON public.user_meal_logs;
        DROP TRIGGER IF EXISTS trigger_meal_log_weight_update ON public.user_meal_logs;
        DROP TRIGGER IF EXISTS auto_weight_tracking_trigger ON public.user_meal_logs;
      `
    },
    
    // Step 3: Drop broken functions
    {
      name: 'Drop broken functions',
      sql: `
        DROP FUNCTION IF EXISTS public.update_weight_tracking_auto() CASCADE;
        DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid) CASCADE;
        DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, integer) CASCADE;
        DROP FUNCTION IF EXISTS public.update_weight_tracking_auto(uuid, numeric) CASCADE;
      `
    },
    
    // Step 4: Verify cleanup
    {
      name: 'Verify triggers removed',
      sql: `
        SELECT COUNT(*) as trigger_count
        FROM pg_trigger
        WHERE tgrelid = 'public.user_meal_logs'::regclass
          AND tgisinternal = false;
      `
    }
  ];

  for (const fix of fixes) {
    console.log(`📋 ${fix.name}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: fix.sql }).catch(async () => {
      // If RPC doesn't exist, try direct query
      return await supabase.from('_sql').select('*').limit(0).then(() => {
        // Fallback: print SQL for manual execution
        console.log(`⚠️  Please run this SQL manually in Supabase dashboard:\n`);
        console.log(fix.sql);
        console.log('\n');
        return { data: null, error: { message: 'Manual execution required' } };
      });
    });

    if (error) {
      if (error.message.includes('Manual execution')) {
        console.log(`⚠️  ${fix.name}: Manual execution required (see SQL above)\n`);
      } else {
        console.log(`❌ ${fix.name}: ${error.message}\n`);
      }
    } else {
      if (data && Array.isArray(data) && data.length > 0) {
        console.log(`✅ ${fix.name}: Found ${data.length} items`);
        console.log(data);
      } else {
        console.log(`✅ ${fix.name}: Success\n`);
      }
    }
  }

  console.log('\n🎉 Fix complete! Try adding food again.');
  console.log('\n⚠️  If you see "Manual execution required" above, copy the SQL and run it in Supabase SQL Editor.');
}

fixMealLogTrigger().catch(console.error);
