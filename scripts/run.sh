#!/bin/bash
set -e

if [ ! -d node_modules ]; then
    echo "❌ Dependencies not installed. Run ./scripts/setup.sh first."
    exit 1
fi

# Ensure data directory exists
mkdir -p data

# Run any pending migrations
npm run db:migrate

# Start the dev server
echo "🚀 Starting InPoster..."
echo "   Open http://localhost:3000"
echo ""
npm run dev
