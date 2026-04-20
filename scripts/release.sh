#!/bin/bash
set -e

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 Dry run — no changes will be made"
  echo ""
fi

# Find last tag or fall back to scanning all commits
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  RANGE="HEAD"
  echo "ℹ️  No previous tags found. Scanning all commits."
else
  RANGE="${LAST_TAG}..HEAD"
  echo "📌 Last release: $LAST_TAG"
fi

# Get commits since last tag
COMMITS=$(git log "$RANGE" --pretty=format:"%s|%H" 2>/dev/null || true)

if [ -z "$COMMITS" ]; then
  echo "✅ No commits since ${LAST_TAG:-the beginning} — nothing to release."
  exit 0
fi

# Categorise commits
BUMP="patch"
FEAT_COMMITS=()
FIX_COMMITS=()
OTHER_COMMITS=()

while IFS='|' read -r msg hash; do
  SHORT="${hash:0:7}"
  if echo "$msg" | grep -qi "BREAKING CHANGE"; then
    BUMP="major"
    OTHER_COMMITS+=("$msg ($SHORT)")
  elif echo "$msg" | grep -qiE "^feat[:(]"; then
    [[ "$BUMP" != "major" ]] && BUMP="minor"
    CLEAN=$(echo "$msg" | sed -E "s/^feat(\([^)]*\))?: //")
    FEAT_COMMITS+=("$CLEAN ($SHORT)")
  elif echo "$msg" | grep -qiE "^fix[:(]"; then
    CLEAN=$(echo "$msg" | sed -E "s/^fix(\([^)]*\))?: //")
    FIX_COMMITS+=("$CLEAN ($SHORT)")
  else
    OTHER_COMMITS+=("$msg ($SHORT)")
  fi
done <<< "$COMMITS"

# Calculate new version
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
TAG="v$NEW_VERSION"
DATE=$(date +%Y-%m-%d)

# Show plan
echo ""
echo "📦 $CURRENT_VERSION → $NEW_VERSION ($BUMP bump)"
echo ""
if [ ${#FEAT_COMMITS[@]} -gt 0 ]; then
  echo "✨ Features:"
  for c in "${FEAT_COMMITS[@]}"; do echo "   - $c"; done
fi
if [ ${#FIX_COMMITS[@]} -gt 0 ]; then
  echo "🐛 Bug Fixes:"
  for c in "${FIX_COMMITS[@]}"; do echo "   - $c"; done
fi
if [ ${#OTHER_COMMITS[@]} -gt 0 ]; then
  echo "📝 Other:"
  for c in "${OTHER_COMMITS[@]}"; do echo "   - $c"; done
fi
echo ""

if $DRY_RUN; then
  echo "✅ Dry run complete. Run ./scripts/release.sh to execute."
  exit 0
fi

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo "✅ Updated package.json → $NEW_VERSION"

# Build changelog entry
ENTRY="## [$NEW_VERSION] - $DATE\n\n"
if [ ${#FEAT_COMMITS[@]} -gt 0 ]; then
  ENTRY+="### Features\n"
  for c in "${FEAT_COMMITS[@]}"; do ENTRY+="- $c\n"; done
  ENTRY+="\n"
fi
if [ ${#FIX_COMMITS[@]} -gt 0 ]; then
  ENTRY+="### Bug Fixes\n"
  for c in "${FIX_COMMITS[@]}"; do ENTRY+="- $c\n"; done
  ENTRY+="\n"
fi
if [ ${#OTHER_COMMITS[@]} -gt 0 ]; then
  ENTRY+="### Other Changes\n"
  for c in "${OTHER_COMMITS[@]}"; do ENTRY+="- $c\n"; done
  ENTRY+="\n"
fi

# Write or prepend to CHANGELOG.md
if [ -f CHANGELOG.md ]; then
  EXISTING=$(cat CHANGELOG.md)
  # Find the line after the header block (first ## heading)
  HEADER=$(awk '/^## /{exit} {print}' CHANGELOG.md | sed 's/[[:space:]]*$//')
  BODY=$(awk '/^## /{found=1} found{print}' CHANGELOG.md)
  printf "%s\n\n%b\n%s\n" "$HEADER" "$ENTRY" "$BODY" > CHANGELOG.md
else
  printf "# Changelog\n\nAll notable changes to InPoster are documented here.\n\n%b" "$ENTRY" > CHANGELOG.md
fi
echo "✅ Updated CHANGELOG.md"

# Commit, tag, push
git add package.json CHANGELOG.md
git commit -m "release: $TAG"
git tag "$TAG"
echo "✅ Created commit and tag $TAG"

echo "🚀 Pushing to remote..."
git push && git push --tags
echo ""
echo "🎉 Released InPoster $TAG"
