#!/bin/bash
set -e

echo "🚀 InPoster Setup"
echo "=================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

if [ ! -f .env.example ]; then
    echo "❌ .env.example not found. The repository may be incomplete."
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
else
    echo "ℹ️  .env.local already exists, skipping"
fi

# Generate ENCRYPTION_KEY if not already set in .env.local
if ! grep -q "^ENCRYPTION_KEY=" .env.local 2>/dev/null || grep -q "^# ENCRYPTION_KEY=" .env.local 2>/dev/null; then
    if node -e "process.exit(0)" 2>/dev/null; then
        ENCRYPTION_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
        # Replace the commented-out line or append
        if grep -q "ENCRYPTION_KEY" .env.local; then
            sed -i.bak "s/.*ENCRYPTION_KEY.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local && rm -f .env.local.bak
        else
            echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local
        fi
        echo "✅ Generated ENCRYPTION_KEY in .env.local"
    fi
fi

# Create data directory
mkdir -p data

# Run migrations
echo ""
echo "🗄️  Setting up database..."
npm run db:migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/run.sh to start the app"
echo "  2. Open http://localhost:3000"
echo "  3. Go to Settings and configure:"
echo "     - Make.com: paste your webhook URL (and API key if auth is enabled)"
echo "     - AI Provider: add your Anthropic API key (required, for post generation)"
echo "     - Image Generation: add your OpenAI API key (optional, for DALL-E 3 images)"
echo "     - Unsplash: add your Unsplash access key (optional, for stock photo search)"
