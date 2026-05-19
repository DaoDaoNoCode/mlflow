#!/usr/bin/env bash
# audit-css-overrides.sh
#
# Static check that CSS override selectors in patternfly/ still exist in the
# installed packages.  Runs in a few seconds after `yarn install` — no server,
# no data, no browser required.
#
# Usage:
#   bash scripts/audit-css-overrides.sh               # normal CI run
#   bash scripts/audit-css-overrides.sh --update-baseline  # accept current state as new baseline
#
# Exit codes:  0 = no new failures,  1 = new failures found
#
# Supporting file (committed alongside this script):
#   css-overrides-baseline.txt — known-missing selectors; warn in CI but don't block it.
#                                Remove an entry once you've fixed the override and verified visually.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OVERRIDES_DIR="$JS_ROOT/src/common/styles/patternfly"

DS_CSS="$JS_ROOT/node_modules/@databricks/design-system/dist/index.css"
PF_CSS="$JS_ROOT/node_modules/@patternfly/patternfly/patternfly.css"
PF_TOKENS_ESM="$JS_ROOT/node_modules/@patternfly/react-tokens/dist/esm"
RADIX_POPPER="$JS_ROOT/node_modules/@radix-ui/react-popper/dist/index.js"

BASELINE_FILE="$SCRIPT_DIR/css-overrides-baseline.txt"

_TMP_ALL_FAILURES=$(mktemp)
_TMP_BASELINE=$(mktemp)
_TMP_DUBOIS=$(mktemp)
_TMP_PFVARS=$(mktemp)
_TMP_PFTOKENS=$(mktemp)
trap 'rm -f "$_TMP_ALL_FAILURES" "$_TMP_BASELINE" "$_TMP_DUBOIS" "$_TMP_PFVARS" "$_TMP_PFTOKENS"' EXIT

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

UPDATE_BASELINE=false
if [[ "${1:-}" == "--update-baseline" ]]; then
  UPDATE_BASELINE=true
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
record_ok()      { echo -e "  ${GREEN}OK${NC}   $1"; }
record_missing() { echo -e "  ${RED}MISS${NC} $1"; echo "$1" >> "$_TMP_ALL_FAILURES"; }
record_warn()    { echo -e "  ${YELLOW}WARN${NC} $1"; }

check_prereqs() {
  local fail=0
  for f in "$DS_CSS" "$PF_CSS" "$PF_TOKENS_ESM"; do
    if [ ! -e "$f" ]; then
      echo -e "${RED}ERROR${NC}: not found: $f  (run 'yarn install' first)"
      fail=1
    fi
  done
  if [ "$fail" -eq 1 ]; then exit 1; fi
}

# ---------------------------------------------------------------------------
# 1. du-bois class selectors
# ---------------------------------------------------------------------------
check_dubois_classes() {
  echo ""
  echo "=== 1/3  du-bois selectors  →  @databricks/design-system/dist/index.css ==="

  grep -rhoE '\.du-bois-(light|dark)-[a-z0-9_-]+' "$OVERRIDES_DIR" \
    | sed 's/^\.//' \
    | sort -u \
    > "$_TMP_DUBOIS"

  local count=0
  while IFS= read -r cls; do
    # du-bois-dark-* classes mirror du-bois-light-* names; only the light
    # variant appears in the static CSS — check the light counterpart.
    local lookup="$cls"
    if [[ "$cls" == du-bois-dark-* ]]; then
      lookup="${cls/du-bois-dark-/du-bois-light-}"
    fi
    if grep -qF -- "$lookup" "$DS_CSS" 2>/dev/null; then
      record_ok "$cls"
    else
      record_missing "$cls"
    fi
    count=$((count+1))
  done < "$_TMP_DUBOIS"

  echo "  checked $count selectors"
}

# ---------------------------------------------------------------------------
# 2. PatternFly CSS custom properties
# ---------------------------------------------------------------------------
check_pf_css_vars() {
  echo ""
  echo "=== 2/3  --pf-t-- variables  →  @patternfly/patternfly/patternfly.css ==="

  grep -rhoE '\-\-pf-t--[a-z0-9_-]+' "$OVERRIDES_DIR" \
    | grep -oE '\-\-pf-t--[a-z0-9_-]+' \
    | sort -u \
    > "$_TMP_PFVARS"

  local count=0
  while IFS= read -r var; do
    if grep -qF -- "${var}:" "$PF_CSS" 2>/dev/null; then
      record_ok "$var"
    else
      record_missing "$var"
    fi
    count=$((count+1))
  done < "$_TMP_PFVARS"

  echo "  checked $count variables"
}

# ---------------------------------------------------------------------------
# 3. @patternfly/react-tokens named imports
# ---------------------------------------------------------------------------
check_pf_react_tokens() {
  echo ""
  echo "=== 3/3  react-tokens imports  →  @patternfly/react-tokens/dist/esm/*.js ==="

  # Use Python to handle multiline import blocks correctly
  python3 - "$OVERRIDES_DIR/patternflyStyles" > "$_TMP_PFTOKENS" <<'PYEOF'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
pattern = re.compile(
    r"import\s*\{([^}]+)\}\s*from\s*['\"]@patternfly/react-tokens['\"]",
    re.S,
)
skip = {"convertRemStringToPx", "convertPxStringToPx"}
tokens = set()

for path in root.rglob("*.ts"):
    for match in pattern.finditer(path.read_text()):
        for token in match.group(1).split(","):
            name = token.strip().split(" as ")[0]
            if name and name not in skip:
                tokens.add(name)

for token in sorted(tokens):
    print(token)
PYEOF

  local count=0
  while IFS= read -r tok; do
    if [ -f "$PF_TOKENS_ESM/${tok}.js" ]; then
      record_ok "$tok"
    else
      record_missing "$tok"
    fi
    count=$((count+1))
  done < "$_TMP_PFTOKENS"

  echo "  checked $count token imports"
}

# ---------------------------------------------------------------------------
# 4. Radix attribute selectors (informational)
# ---------------------------------------------------------------------------
check_radix_attrs() {
  echo ""
  echo "=== bonus  Radix attribute selectors (informational) ==="

  if [ ! -f "$RADIX_POPPER" ]; then
    record_warn "data-radix-popper-content-wrapper: @radix-ui/react-popper not installed"
    return
  fi

  if grep -qF -- 'data-radix-popper-content-wrapper' "$RADIX_POPPER" 2>/dev/null; then
    record_ok "data-radix-popper-content-wrapper"
  else
    record_warn "data-radix-popper-content-wrapper: not found in @radix-ui/react-popper (may have been renamed)"
  fi
}

# ---------------------------------------------------------------------------
# 5. Dependency version reporter
# ---------------------------------------------------------------------------
report_versions() {
  echo ""
  echo "=== dependency versions ==="
  local pkg="$JS_ROOT/package.json"
  for dep in @databricks/design-system @patternfly/patternfly @patternfly/react-tokens; do
    local ver
    ver=$(node -e "const p=require('$pkg'); console.log(p.dependencies?.['$dep'] || p.devDependencies?.['$dep'] || 'n/a')" 2>/dev/null || echo "n/a")
    echo "  $dep: $ver"
  done
}

# ---------------------------------------------------------------------------
# Baseline helpers
# ---------------------------------------------------------------------------
load_baseline() {
  if [ -f "$BASELINE_FILE" ]; then
    grep -v '^#' "$BASELINE_FILE" | grep -v '^$' | sort -u > "$_TMP_BASELINE" || true
  else
    : > "$_TMP_BASELINE"
  fi
}

write_baseline() {
  sort -u "$_TMP_ALL_FAILURES" -o "$_TMP_ALL_FAILURES"

  local new_count
  new_count=$(wc -l < "$_TMP_ALL_FAILURES" | tr -d ' ')

  # Show delta vs previous baseline before overwriting
  if [ -s "$_TMP_BASELINE" ]; then
    local recovered added
    recovered=$(comm -23 "$_TMP_BASELINE" "$_TMP_ALL_FAILURES" | wc -l | tr -d ' ')
    added=$(comm -13 "$_TMP_BASELINE" "$_TMP_ALL_FAILURES" | wc -l | tr -d ' ')
    echo ""
    echo "  $added newly added to baseline,  $recovered removed (fixed)"
  fi

  {
    echo "# CSS override selector baseline"
    echo "# Generated by: yarn audit:css-overrides:update"
    echo "# Updated: $(date -u '+%Y-%m-%d')"
    echo "#"
    echo "# Selectors listed here are known to be missing from the installed packages."
    echo "# They warn in CI but do NOT block it."
    echo "# Remove an entry once you've updated the selector and verified it visually."
    echo ""
    cat "$_TMP_ALL_FAILURES"
  } > "$BASELINE_FILE"

  echo -e "${GREEN}Baseline updated${NC}: $new_count entries written to scripts/css-overrides-baseline.txt"
  echo "Commit scripts/css-overrides-baseline.txt alongside your other changes."
}

# ---------------------------------------------------------------------------
# Result evaluation
# ---------------------------------------------------------------------------
evaluate_results() {
  load_baseline
  sort -u "$_TMP_ALL_FAILURES" -o "$_TMP_ALL_FAILURES"

  local new_fail_file known_fail_file recovered_file
  new_fail_file=$(mktemp)
  known_fail_file=$(mktemp)
  recovered_file=$(mktemp)

  if [ -s "$_TMP_BASELINE" ] && [ -s "$_TMP_ALL_FAILURES" ]; then
    comm -23 "$_TMP_ALL_FAILURES" "$_TMP_BASELINE" > "$new_fail_file"
    comm -12 "$_TMP_ALL_FAILURES" "$_TMP_BASELINE" > "$known_fail_file"
    comm -23 "$_TMP_BASELINE"    "$_TMP_ALL_FAILURES" > "$recovered_file"
  elif [ -s "$_TMP_ALL_FAILURES" ]; then
    cp "$_TMP_ALL_FAILURES" "$new_fail_file"
    : > "$known_fail_file"
    : > "$recovered_file"
  else
    : > "$new_fail_file"
    : > "$known_fail_file"
    [ -s "$_TMP_BASELINE" ] && cp "$_TMP_BASELINE" "$recovered_file" || : > "$recovered_file"
  fi

  local new_count known_count recovered_count
  new_count=$(wc -l < "$new_fail_file" | tr -d ' ')
  known_count=$(wc -l < "$known_fail_file" | tr -d ' ')
  recovered_count=$(wc -l < "$recovered_file" | tr -d ' ')

  echo ""
  echo "══════════════════════════════════════════════════════════════════"

  if [ "$recovered_count" -gt 0 ]; then
    echo -e "  ${GREEN}Fixed${NC} ($recovered_count — remove from baseline):"
    while IFS= read -r s; do echo "    $s"; done < "$recovered_file"
  fi

  if [ "$known_count" -gt 0 ]; then
    echo -e "  ${YELLOW}Known${NC} ($known_count — in baseline, warn only):"
    while IFS= read -r s; do echo "    $s"; done < "$known_fail_file"
  fi

  if [ "$new_count" -gt 0 ]; then
    echo -e "  ${RED}New failures${NC} ($new_count — not in baseline, blocking):"
    while IFS= read -r s; do echo "    $s"; done < "$new_fail_file"
  fi

  echo "══════════════════════════════════════════════════════════════════"

  rm -f "$new_fail_file" "$known_fail_file" "$recovered_file"

  if [ "$new_count" -gt 0 ]; then
    echo ""
    echo -e "${RED}FAIL${NC}: $new_count new override selector(s) no longer exist in installed packages."
    echo ""
    echo "  Options:"
    echo "    a) Find the new class/token name and update the SCSS override"
    echo "    b) If this is dead CSS you're intentionally deferring:"
    echo "         yarn audit:css-overrides:update"
    echo ""
    return 1
  fi

  echo ""
  if [ "$known_count" -gt 0 ]; then
    echo -e "${YELLOW}WARN${NC}: $known_count known issue(s) in baseline (CI not blocked)."
    echo "  Run 'yarn audit:css-overrides:update' after fixing them to shrink the baseline."
  else
    echo -e "${GREEN}All selectors and tokens match installed packages.${NC}"
    if [ "$recovered_count" -gt 0 ]; then
      echo "  Run 'yarn audit:css-overrides:update' to remove $recovered_count fixed entry/entries from baseline."
    fi
  fi

  return 0
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         MLflow ODH — CSS override selector audit               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"

check_prereqs
check_dubois_classes
check_pf_css_vars
check_pf_react_tokens
check_radix_attrs
report_versions

if $UPDATE_BASELINE; then
  load_baseline
  write_baseline
  exit 0
fi

evaluate_results
