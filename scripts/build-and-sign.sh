#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GCP_PROJECT="urlert"
GCP_SECRET="chrome-extension-private-key"
PRIVATE_KEY_FILE="$PROJECT_ROOT/.chrome-extension-key.pem"
BUILD_DIR="$PROJECT_ROOT/.output/chrome-mv3"

# Cleanup private key on exit (success or failure)
cleanup() {
  if [[ -f "$PRIVATE_KEY_FILE" ]]; then
    rm -f "$PRIVATE_KEY_FILE"
    echo "Cleaned up private key file."
  fi
}
trap cleanup EXIT

# --- Version sync check ---
WXT_VERSION=$(sed -n 's/^[[:space:]]*version:[[:space:]]*"\([^"]*\)".*/\1/p' "$PROJECT_ROOT/wxt.config.ts")
PKG_VERSION=$(node -p "require('$PROJECT_ROOT/package.json').version")

if [[ -z "$WXT_VERSION" ]]; then
  echo "Could not extract version from wxt.config.ts"
  exit 1
fi

if [[ "$WXT_VERSION" != "$PKG_VERSION" ]]; then
  echo "Version mismatch: wxt.config.ts ($WXT_VERSION) != package.json ($PKG_VERSION)"
  exit 1
fi

echo "Version: $PKG_VERSION"

# --- Build the extension ---
echo "Building extension..."
cd "$PROJECT_ROOT"
npx wxt build

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Build output not found at $BUILD_DIR"
  exit 1
fi

echo "Build complete."

# --- Fetch private key from GCP Secret Manager ---
echo "Fetching private key from GCP Secret Manager..."
gcloud secrets versions access latest \
  --secret="$GCP_SECRET" \
  --project="$GCP_PROJECT" \
  > "$PRIVATE_KEY_FILE"

chmod 600 "$PRIVATE_KEY_FILE"

# --- Sign the extension ---
echo "Packing and signing extension..."

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS specific path
  CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
  # Linux path
  CHROME_BIN="google-chrome"
fi

"$CHROME_BIN" --pack-extension="$BUILD_DIR" --pack-extension-key="$PRIVATE_KEY_FILE"

CRX_FILE="$PROJECT_ROOT/.output/chrome-mv3.crx"

if [[ -f "$CRX_FILE" ]]; then
  VERSIONED_CRX="$PROJECT_ROOT/.output/urlert-guard-${PKG_VERSION}.crx"
  mv "$CRX_FILE" "$VERSIONED_CRX"
  echo "Signed extension: $VERSIONED_CRX"
else
  echo "Error: Expected .crx file not found at $CRX_FILE"
  exit 1
fi

echo "Done."
