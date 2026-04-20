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

# Generate ENCRYPTION_KEY only if not already present as an uncommented value
if ! grep -q "^ENCRYPTION_KEY=" .env.local 2>/dev/null; then
    if node -e "process.exit(0)" 2>/dev/null; then
        ENCRYPTION_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
        # Replace any commented-out ENCRYPTION_KEY line, or append
        if grep -q "ENCRYPTION_KEY" .env.local; then
            sed -i.bak "s/.*ENCRYPTION_KEY.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local && rm -f .env.local.bak
        else
            echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local
        fi
        echo "✅ Generated ENCRYPTION_KEY in .env.local"

        # If a database already exists, re-encrypt any settings that were stored
        # using the old hostname-based fallback key so they remain readable.
        if [ -f data/inposter.db ]; then
            node -e "
const crypto = require('crypto');
const os = require('os');
const Database = require('better-sqlite3');
const SALT = 'inposter-local-encryption';
const oldKey = crypto.scryptSync(os.hostname(), SALT, 32);
const newKey = crypto.scryptSync('$ENCRYPTION_KEY', SALT, 32);
function decrypt(enc, key) {
  const [ivH, tagH, dataH] = enc.split(':');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivH,'hex'));
  d.setAuthTag(Buffer.from(tagH,'hex'));
  return d.update(Buffer.from(dataH,'hex')) + d.final('utf8');
}
function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(text,'utf8'), c.final()]);
  return iv.toString('hex')+':'+c.getAuthTag().toString('hex')+':'+enc.toString('hex');
}
const db = new Database('data/inposter.db');
const rows = db.prepare('SELECT key, value FROM settings WHERE encrypted = 1').all();
let migrated = 0;
for (const row of rows) {
  try {
    const plain = decrypt(row.value, oldKey);
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(encrypt(plain, newKey), row.key);
    migrated++;
  } catch(e) { /* already on new key or unreadable, skip */ }
}
db.close();
if (migrated > 0) console.log('✅ Re-encrypted ' + migrated + ' existing setting(s) to new key');
" 2>/dev/null || true
        fi
    fi
else
    echo "ℹ️  ENCRYPTION_KEY already set in .env.local, skipping"
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
