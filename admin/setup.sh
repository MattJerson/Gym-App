#!/bin/bash

# Admin Dashboard Quick Setup Script
echo "🚀 Setting up Admin Dashboard..."

# Check if we're in the admin directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the admin directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Supabase client
echo "🔌 Installing Supabase client..."
npm install @supabase/supabase-js

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update admin/.env with your Supabase URL and anon key"
echo "2. Run 'npm run dev' to start the development server"
echo ""
echo "For detailed setup instructions, see admin/SETUP.md"
