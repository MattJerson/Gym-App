// Quick script to check notification_logs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './admin/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('notification_logs')
  .select('*')
  .order('sent_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Recent notification_logs:', data.length);
  console.table(data);
}

const { count } = await supabase
  .from('notification_logs')
  .select('*', { count: 'exact', head: true });

console.log('Total notification_logs:', count);
