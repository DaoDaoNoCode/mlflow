#!/usr/bin/env bash
# audit-rebase.sh
#
# Run after rebasing from mlflow/mlflow (github.com/mlflow/mlflow) to surface
# CSS override risks. Checks two things:
#
#   1. Package CSS drift   — did @databricks/design-system CSS rules change for
#                            classes we override? (catches silent value changes)
#
#   2. MLflow source diff  — did OSS mlflow add/change components that use
#                            du-bois? (catches new pages and restructured components)
#
# Usage:
#   yarn audit:rebase                    # uses ORIG_HEAD set by git rebase
#   yarn audit:rebase --from=<sha>       # manually specify pre-rebase commit
#   yarn audit:rebase --update-versions  # accept current versions as verified
#
# Output: a human-review checklist. Not a CI gate — run this locally after
# every rebase before pushing.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_ROOT="$(cd "$JS_ROOT/../../.." && pwd)"
OVERRIDES_DIR="$JS_ROOT/src/common/styles/patternfly"
VERSIONS_FILE="$SCRIPT_DIR/css-overrides-verified-versions.txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Flags
# ---------------------------------------------------------------------------
FROM_SHA=""
UPDATE_VERSIONS=false

for arg in "$@"; do
  case "$arg" in
    --update-versions) UPDATE_VERSIONS=true ;;
    --from=*)          FROM_SHA="${arg#--from=}" ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
section() { echo ""; echo -e "${BOLD}=== $1 ===${NC}"; }
info()    { echo -e "  ${CYAN}·${NC} $1"; }
warn()    { echo -e "  ${YELLOW}!${NC} $1"; }
ok()      { echo -e "  ${GREEN}✓${NC} $1"; }

installed_version() {
  # Read the exact resolved version from node_modules (not the semver range)
  node -e "process.stdout.write(require('$JS_ROOT/node_modules/$1/package.json').version)" 2>/dev/null || echo "unknown"
}

is_vendored() {
  # Check if a package uses a file: dependency (vendored, not on npm)
  node -e "const d=require('$JS_ROOT/package.json').dependencies?.['$1']||''; process.exit(d.startsWith('file:')?0:1)" 2>/dev/null
}

verified_version() {
  # Read the last-verified version from the committed versions file
  local pkg="$1"
  [ -f "$VERSIONS_FILE" ] || { echo "none"; return; }
  grep "^${pkg}=" "$VERSIONS_FILE" | cut -d= -f2 | tr -d ' '
}

# ---------------------------------------------------------------------------
# --update-versions: write current installed versions to the versions file
# ---------------------------------------------------------------------------
do_update_versions() {
  local pkgs=("@databricks/design-system" "@patternfly/patternfly" "@patternfly/react-tokens")

  # Validate all packages before touching the versions file
  local versions=()
  for pkg in "${pkgs[@]}"; do
    local ver
    ver=$(installed_version "$pkg")
    if [ "$ver" = "unknown" ]; then
      echo -e "${RED}ERROR${NC}: $pkg is not installed. Run 'yarn install' before --update-versions." >&2
      exit 1
    fi
    versions+=("${pkg}=${ver}")
  done

  # Write atomically via temp file so a failure never corrupts the committed file
  local tmp_file
  tmp_file=$(mktemp)
  {
    echo "# Last visually verified package versions for CSS override compatibility."
    echo "# Update with: yarn audit:rebase --update-versions"
    echo "# After: verifying that all CSS overrides look correct in the browser."
    echo ""
    for v in "${versions[@]}"; do
      echo "$v"
    done
  } > "$tmp_file"
  mv "$tmp_file" "$VERSIONS_FILE"

  echo -e "${GREEN}Versions file updated${NC}: scripts/css-overrides-verified-versions.txt"
  echo "Commit it alongside your other rebase changes."
  cat "$VERSIONS_FILE"
}

# ---------------------------------------------------------------------------
# Build the set of class names we override (light variants only, for lookup)
# ---------------------------------------------------------------------------
build_override_class_list() {
  grep -rhoE '\.du-bois-light-[a-z0-9_-]+' "$OVERRIDES_DIR" \
    | sed 's/^\.//' \
    | sort -u
}

# ---------------------------------------------------------------------------
# Section 1: Package CSS drift
# Uses `npm diff` to compare CSS between the verified version and installed
# version, then uses Python to identify which overridden class rules changed.
# ---------------------------------------------------------------------------
check_package_drift() {
  section "1/2  Package CSS drift"

  # Map: package name → CSS file path inside the package
  declare -A PKG_CSS=(
    ["@databricks/design-system"]="dist/index.css"
    ["@patternfly/patternfly"]="patternfly.css"
  )

  local override_classes
  override_classes=$(build_override_class_list)

  local any_change=false

  for pkg in "${!PKG_CSS[@]}"; do
    local old_ver new_ver css_file
    old_ver=$(verified_version "$pkg")
    new_ver=$(installed_version "$pkg")
    css_file="${PKG_CSS[$pkg]}"

    if [ "$old_ver" = "none" ]; then
      warn "$pkg: no verified version on record — run --update-versions after first visual check"
      continue
    fi

    if [ "$old_ver" = "$new_ver" ]; then
      ok "$pkg @ $new_ver (unchanged)"
      continue
    fi

    echo -e "  ${YELLOW}CHANGED${NC}  $pkg: $old_ver → $new_ver"
    any_change=true

    # Vendored packages (file: deps) aren't on npm — skip npm diff
    if is_vendored "$pkg"; then
      info "$pkg is vendored (file: dependency) — npm diff unavailable. Diff the vendor directory manually."
      continue
    fi

    # Run npm diff and parse which of our overridden classes had rules changed
    local diff_output
    diff_output=$(npm diff --diff "${pkg}@${old_ver}" --diff "${pkg}@${new_ver}" -- "$css_file" 2>/dev/null || true)

    if [ -z "$diff_output" ]; then
      info "Could not fetch diff (no network or version not on registry). Check manually."
      continue
    fi

    # Write diff to a temp file so Python can read it via argv without
    # conflicting with the heredoc that provides the script source (SC2259).
    # override_classes is passed as argv[1]; diff file path as argv[2].
    local diff_tmp
    diff_tmp=$(mktemp)
    printf '%s' "$diff_output" > "$diff_tmp"

    local changed_classes
    changed_classes=$(python3 - "$override_classes" "$diff_tmp" <<'PYEOF'
import sys, re

with open(sys.argv[2], encoding='utf-8', errors='replace') as f:
    diff = f.read()
override = set(sys.argv[1].split())

current = None
changed = set()

for line in diff.split('\n'):
    if not line.startswith(('+', '-')):
        m = re.search(r'\.(du-bois-(?:light|dark)-[\w-]+)', line)
        if m:
            current = m.group(1).replace('-dark-', '-light-')
    elif not line.startswith(('+++', '---')):
        if current and current in override:
            changed.add(current)

for cls in sorted(changed):
    print(cls)
PYEOF
    )

    # Also find new class names in the package not yet in our SCSS
    local new_classes
    new_classes=$(python3 - "$override_classes" "$diff_tmp" <<'PYEOF'
import sys, re

with open(sys.argv[2], encoding='utf-8', errors='replace') as f:
    diff = f.read()
override = set(sys.argv[1].split())

added = set()
for line in diff.split('\n'):
    if line.startswith('+') and not line.startswith('+++'):
        for m in re.finditer(r'\.(du-bois-light-[\w-]+)', line):
            added.add(m.group(1))

for cls in sorted(added - override):
    print(cls)
PYEOF
    )
    rm -f "$diff_tmp"

    if [ -n "$changed_classes" ]; then
      echo ""
      echo -e "    ${YELLOW}Classes with changed CSS rules (verify your overrides still look right):${NC}"
      while IFS= read -r cls; do
        local area
        area=$(class_to_area "$cls")
        echo "      $cls  →  $area"
      done <<< "$changed_classes"
    fi

    if [ -n "$new_classes" ]; then
      echo ""
      echo -e "    ${CYAN}New class names in package not yet in your overrides (check if needed):${NC}"
      while IFS= read -r cls; do
        echo "      $cls"
      done <<< "$new_classes"
    fi

    if [ -z "$changed_classes" ] && [ -z "$new_classes" ]; then
      info "CSS changed between versions but no overridden classes were affected."
    fi
    echo ""
  done

  if ! $any_change; then
    echo ""
    ok "All package versions match verified state — no CSS drift to check."
  fi
}

# ---------------------------------------------------------------------------
# Map a du-bois class name to a human-readable override area
# ---------------------------------------------------------------------------
class_to_area() {
  local cls="$1"
  case "$cls" in
    *select*|*dropdown*|*combobox*|*typeahead*) echo "dropdowns & selects" ;;
    *modal*)                                     echo "modals" ;;
    *notification*|*toast*)                      echo "notifications" ;;
    *popover*)                                   echo "popovers" ;;
    *btn*|*button*)                              echo "buttons" ;;
    *input*)                                     echo "inputs" ;;
    *checkbox*|*tree*)                           echo "checkboxes & trees" ;;
    *radio*)                                     echo "radio groups" ;;
    *alert*)                                     echo "alerts" ;;
    *tag*)                                       echo "tags" ;;
    *)                                           echo "other" ;;
  esac
}

# ---------------------------------------------------------------------------
# Map a du-bois JSX component name to override area
# ---------------------------------------------------------------------------
component_to_area() {
  case "$1" in
    Select|DialogCombobox|DropdownMenu|TypeaheadCombobox|Combobox|SelectV2)
      echo "dropdowns & selects" ;;
    Modal)                   echo "modals" ;;
    Notification|Toast)      echo "notifications" ;;
    Popover|HoverCard)       echo "popovers" ;;
    Button|IconButton)       echo "buttons" ;;
    Input|TextArea|SearchInput) echo "inputs" ;;
    Checkbox)                echo "checkboxes & trees" ;;
    Tree)                    echo "trees" ;;
    Radio|RadioGroup)        echo "radio groups" ;;
    Alert)                   echo "alerts" ;;
    Tag)                     echo "tags" ;;
    TableRow|TableCell|Table|DataTable) echo "tables" ;;
    FormUI|FormGroup)        echo "forms" ;;
    *)                       echo "" ;;  # not a component we override; empty = skip
  esac
}

# ---------------------------------------------------------------------------
# Section 2: MLflow source changes
# Finds new/changed TSX files from OSS mlflow/mlflow and reports which du-bois
# components they use, mapped to the override areas that cover them.
# ---------------------------------------------------------------------------
check_source_changes() {
  section "2/2  MLflow source changes"

  # Resolve the pre-rebase commit
  local from_sha="$FROM_SHA"
  if [ -z "$from_sha" ]; then
    from_sha=$(git -C "$GIT_ROOT" rev-parse ORIG_HEAD 2>/dev/null || true)
  fi

  if [ -z "$from_sha" ]; then
    warn "No pre-rebase commit found. Pass --from=<sha> or run immediately after git rebase."
    return
  fi

  info "Comparing against: $(git -C "$GIT_ROOT" log --oneline -1 "$from_sha")"
  echo ""

  # New files added by OSS mlflow/mlflow — entire new UI areas, check everything
  local new_files
  new_files=$(git -C "$GIT_ROOT" diff "$from_sha" --name-only --diff-filter=A \
    -- 'mlflow/server/js/src/' \
    | grep -E '\.(tsx|ts)$' \
    | grep -v '\.test\.' \
    | grep -v '\.stories\.' \
    | sed 's|mlflow/server/js/||' \
    | sort || true)

  # Modified files — check if they import du-bois components
  local changed_files
  changed_files=$(git -C "$GIT_ROOT" diff "$from_sha" --name-only --diff-filter=M \
    -- 'mlflow/server/js/src/' \
    | grep -E '\.(tsx|ts)$' \
    | grep -v '\.test\.' \
    | grep -v '\.stories\.' \
    | sed 's|mlflow/server/js/||' \
    | sort || true)

  # ---- New files ----
  local printed_new=false
  if [ -n "$new_files" ]; then
    while IFS= read -r rel_path; do
      local full_path="$JS_ROOT/$rel_path"
      [ -f "$full_path" ] || continue

      # Only flag files that import from the design system; use Python to
      # handle multiline import blocks (e.g. "} from '@databricks/design-system'")
      local components
      components=$(python3 - "$full_path" <<'PYEOF'
from pathlib import Path
import re
import sys

text = Path(sys.argv[1]).read_text()
pattern = re.compile(
    r"import\s*\{([^}]+)\}\s*from\s*['\"]@databricks/design-system['\"]",
    re.S,
)
names = set()
for match in pattern.finditer(text):
    for item in match.group(1).split(","):
        name = item.strip().split(" as ")[0]
        if re.fullmatch(r"[A-Z][A-Za-z0-9]*", name):
            names.add(name)
for name in sorted(names):
    print(name)
PYEOF
      )
      [ -z "$components" ] && continue

      local areas=()
      while IFS= read -r comp; do
        local area
        area=$(component_to_area "$comp")
        [ -n "$area" ] && areas+=("$area")
      done <<< "$components"

      local unique_areas=""
      [ ${#areas[@]} -gt 0 ] && \
        unique_areas=$(printf '%s\n' "${areas[@]}" | sort -u | tr '\n' ', ' | sed 's/,$//')

      if [ -n "$unique_areas" ]; then
        if ! $printed_new; then
          echo -e "  ${YELLOW}New files${NC} — new UI areas using du-bois (full visual check needed):"
          printed_new=true
        fi
        echo "    $rel_path"
        echo "      → override areas: $unique_areas"
      fi
    done <<< "$new_files"
    $printed_new && echo ""
  fi
  $printed_new || ok "No new files using @databricks/design-system."

  # ---- Changed files ----
  echo ""
  local found_any=false
  if [ -n "$changed_files" ]; then
    echo -e "  ${CYAN}Changed files${NC} — using @databricks/design-system:"
    while IFS= read -r rel_path; do
      local full_path="$JS_ROOT/$rel_path"
      [ -f "$full_path" ] || continue

      # Only flag files that import from the design system
      grep -qF "@databricks/design-system" "$full_path" 2>/dev/null || continue

      # Which du-bois components appear in the added lines of this file's diff?
      local diff_components
      diff_components=$(git -C "$GIT_ROOT" diff "$from_sha" \
        -- "mlflow/server/js/$rel_path" 2>/dev/null \
        | grep '^+' | grep -v '^+++' \
        | grep -oE '<[A-Z][a-zA-Z]+' \
        | sed 's/^<//' \
        | sort -u || true)

      local areas=()
      while IFS= read -r comp; do
        local area
        area=$(component_to_area "$comp")
        [ -n "$area" ] && areas+=("$area")
      done <<< "$diff_components"

      local unique_areas=""
      [ ${#areas[@]} -gt 0 ] && \
        unique_areas=$(printf '%s\n' "${areas[@]}" | sort -u | tr '\n' ', ' | sed 's/,$//')

      echo "    $rel_path"
      if [ -n "$unique_areas" ]; then
        echo "      → changed usage: $unique_areas"
      else
        echo "      → structure may have changed (check overrides still apply)"
      fi
      found_any=true
    done <<< "$changed_files"
  fi

  if ! $found_any; then
    ok "No changed files import from @databricks/design-system."
  fi
  echo ""

  if [ -z "$new_files" ] && [ -z "$changed_files" ]; then
    ok "No TSX/TS files changed by this rebase."
  fi
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         MLflow ODH — Post-rebase CSS override audit            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"

if $UPDATE_VERSIONS; then
  do_update_versions
  exit 0
fi

check_package_drift
check_source_changes

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "  After verifying everything looks correct in the browser:"
echo "    yarn audit:rebase --update-versions"
echo "    git add scripts/css-overrides-verified-versions.txt"
echo "──────────────────────────────────────────────────────────────────"
echo ""
