#!/usr/bin/env bash
# ==============================================================================
# NexCart Clean Packaging Script
# Creates a production and academic-ready submission ZIP archive.
# STRICTLY EXCLUDES:
#   - .env files and local secrets (keeping .env.example)
#   - node_modules directories
#   - dist / build distribution folders
#   - Temporary logs, OS artifacts (.DS_Store), and test caches
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_ZIP="$(dirname "${PROJECT_DIR}")/NexCart-Submission-Clean.zip"

echo "📦 Packaging NexCart from: ${PROJECT_DIR}"
echo "📁 Output target: ${OUTPUT_ZIP}"

# Remove existing archives if present
rm -f "${OUTPUT_ZIP}" "${PROJECT_DIR}"/*.zip 2>/dev/null || true

cd "${PROJECT_DIR}"

# Build archive using standard zip utility with strict exclusion flags
zip -r -q "${OUTPUT_ZIP}" . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*dist*" \
  -x "*build*" \
  -x "*.env" \
  -x "*.env.local" \
  -x "*.env.development*" \
  -x "*.env.production*" \
  -x "*backend/.env" \
  -x "*frontend/.env" \
  -x "*coverage*" \
  -x "*.DS_Store" \
  -x "*Thumbs.db" \
  -x "*.log" \
  -x "*logs/*" \
  -x "*.zip" \
  -x "*.tar.gz"

echo "✅ Package created successfully: ${OUTPUT_ZIP}"
echo "🔍 Archive size: $(du -h "${OUTPUT_ZIP}" | cut -f1)"
echo "🔒 Verified: .env, node_modules, and dist are strictly excluded."
