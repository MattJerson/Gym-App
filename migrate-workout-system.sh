#!/bin/bash

# ============================================
# WORKOUT SYSTEM MIGRATION - QUICK START
# ============================================

echo "🏋️  Starting Workout Exercise System Migration"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

# Load environment variables
source .env

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Using direct SQL execution...${NC}"
    USE_CLI=false
else
    echo -e "${GREEN}✅ Supabase CLI found${NC}"
    USE_CLI=true
fi

echo ""
echo "Step 1: Applying database schema..."
echo "-----------------------------------"

if [ "$USE_CLI" = true ]; then
    supabase db push --file supabase/migrations/022_new_exercise_system_schema.sql
else
    echo "Please run this SQL file in your Supabase dashboard:"
    echo "  supabase/migrations/022_new_exercise_system_schema.sql"
    read -p "Press Enter when done..."
fi

echo -e "${GREEN}✅ Schema applied${NC}"
echo ""

echo "Step 2: Importing exercise data..."
echo "-----------------------------------"

# Run the import script
node import-exercises-data.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data imported successfully${NC}"
else
    echo -e "${RED}❌ Data import failed${NC}"
    exit 1
fi

echo ""
echo "Step 3: Running migration helpers..."
echo "-----------------------------------"

if [ "$USE_CLI" = true ]; then
    supabase db push --file supabase/migrations/024_migrate_to_new_exercise_system.sql
else
    echo "Please run this SQL file in your Supabase dashboard:"
    echo "  supabase/migrations/024_migrate_to_new_exercise_system.sql"
    read -p "Press Enter when done..."
fi

echo -e "${GREEN}✅ Migration helpers applied${NC}"
echo ""

echo "============================================"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update your UI components (see MIGRATION_GUIDE.md)"
echo "2. Test the new exercise system"
echo "3. Run 025_cleanup_old_exercise_system.sql when ready"
echo ""
echo "For detailed instructions, see MIGRATION_GUIDE.md"
