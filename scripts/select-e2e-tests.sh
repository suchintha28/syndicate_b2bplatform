#!/usr/bin/env bash
# select-e2e-tests.sh
#
# Prints which Playwright spec files to run based on what changed in this push.
# Writes PLAYWRIGHT_SPECS to $GITHUB_ENV (no-op locally when GITHUB_ENV is unset).
#
# Mapping logic:
#   - Core infra (middleware, supabase lib, API routes, config) → full suite
#   - Only test files changed → those specific spec files
#   - UI / feature files → the spec files that cover that area
#   - No match → full suite as safety net

set -euo pipefail

CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo "")

echo "=== Changed files ==="
echo "${CHANGED:-<none>}"
echo "====================="

SPECS=""
add() { SPECS="$SPECS $*"; }

# ── Core infra → run everything ───────────────────────────────────────────────
if echo "$CHANGED" | grep -qE \
  "^(middleware\.ts|lib/supabase/|lib/data\.|app/api/|next\.config|package\.json|package-lock\.json|playwright\.config|vitest\.config)"; then
  echo "Core infra changed — running full suite"
  SPECS="tests/e2e/"

# ── Only test files changed → run exactly those ───────────────────────────────
elif echo "$CHANGED" | grep -qE "^tests/e2e/.*\.spec\.ts$"; then
  SPECS=$(echo "$CHANGED" | grep "^tests/e2e/.*\.spec\.ts$" | tr '\n' ' ')
  echo "Test files changed — running: $SPECS"

# ── UI / feature changes → map to relevant specs ─────────────────────────────
else
  # Nav bar, global styles, shared UI primitives
  echo "$CHANGED" | grep -qE "^(components/nav|app/globals|app/layout|components/ui/)" \
    && add "tests/e2e/marketplace.spec.ts"

  # Explore / supplier listing / brand & product detail pages
  echo "$CHANGED" | grep -qEi \
    "^components/screens/marketplace/|ExploreScreen|BusinessDetail|ProductDetail|^app/(listing|brands|products)" \
    && add "tests/e2e/marketplace.spec.ts \
            tests/e2e/workflows/explore-search.spec.ts \
            tests/e2e/workflows/explore-filters.spec.ts"

  # RFQ flows (both seller and buyer)
  echo "$CHANGED" | grep -qEi "rfq|^app/rfqs" \
    && add "tests/e2e/workflows/rfq-workflow.spec.ts \
            tests/e2e/workflows/buyer-rfq.spec.ts"

  # Messaging / inbox
  echo "$CHANGED" | grep -qEi "message|inbox|^app/messages" \
    && add "tests/e2e/workflows/messaging.spec.ts"

  # Seller / product management screens
  echo "$CHANGED" | grep -qEi "seller|^components/screens/seller|SellerScreen|ProductManage" \
    && add "tests/e2e/workflows/seller-product.spec.ts"

  # Info / marketing pages
  echo "$CHANGED" | grep -qEi "AboutScreen|PrivacyScreen|ContactScreen|HomeScreen|^app/(about|privacy|contact)" \
    && add "tests/e2e/marketplace.spec.ts"

  # Auth screens / onboarding
  echo "$CHANGED" | grep -qEi "AuthScreen|^app/(auth|login|onboarding)|^app/\(auth\)" \
    && add "tests/e2e/marketplace.spec.ts"

  # Sanity / CMS (banner, pages)
  echo "$CHANGED" | grep -qE "^sanity/" \
    && add "tests/e2e/marketplace.spec.ts"

  # Nothing matched → full suite as safety net
  if [ -z "$(echo "$SPECS" | xargs)" ]; then
    echo "No specific mapping found — running full suite"
    SPECS="tests/e2e/"
  fi
fi

# Deduplicate, remove blank lines, sort
SPECS=$(echo "$SPECS" | tr ' ' '\n' | grep -v '^[[:space:]]*$' | sort -u | tr '\n' ' ' | xargs)

echo ""
echo "=== Running E2E specs ==="
echo "$SPECS"
echo "========================="

# Export to GitHub Actions env (silently skipped outside CI)
if [ -n "${GITHUB_ENV:-}" ]; then
  echo "PLAYWRIGHT_SPECS=$SPECS" >> "$GITHUB_ENV"
fi
