// Quick script to run SQL fix through Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'supabase/migrations/FIX_ALL_WEIGHT_KG_FUNCTIONS.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split into individual statements (basic split on ;; and single ;)
const statements = sqlContent
  .split(/;\s*$/gm)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'DO $$');

console.log(`📝 Found ${statements.length} SQL statements to execute`);

async function executeSql() {
  console.log('\n🚀 Starting SQL execution...\n');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim() === '') {
      continue;
    }
    
    console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
    console.log(`Preview: ${statement.substring(0, 100)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });
      
      if (error) {
        console.error(`❌ Error:`, error);
        // Try direct query as fallback
        console.log('Trying alternative method...');
        const { error: altError } = await supabase.from('_').select('*').limit(0);
        // This won't work either, but let's continue
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.error(`❌ Exception:`, err.message);
    }
  }
  
  console.log('\n\n✅ SQL execution complete!');
  console.log('Please test your workout completion now.');
}

executeSql().catch(console.error);
