#!/bin/bash
# Codebase Health Metrics Script
# Captures technical debt and code quality metrics

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"

echo "========================================"
echo "  Codebase Health Metrics"
echo "  Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "========================================"
echo ""

# File counts
echo "## File Counts"
echo "----------------------------------------"
TS_FILES=$(find "$SRC_DIR" -name "*.ts" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
TSX_FILES=$(find "$SRC_DIR" -name "*.tsx" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
TOTAL_FILES=$((TS_FILES + TSX_FILES))
echo "TypeScript files (.ts):  $TS_FILES"
echo "TSX files (.tsx):        $TSX_FILES"
echo "Total source files:      $TOTAL_FILES"
echo ""

# Lines of code
echo "## Lines of Code"
echo "----------------------------------------"
if command -v wc &> /dev/null; then
    TS_LOC=$(find "$SRC_DIR" -name "*.ts" -not -path "*/node_modules/*" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')
    TSX_LOC=$(find "$SRC_DIR" -name "*.tsx" -not -path "*/node_modules/*" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')
    TOTAL_LOC=$((TS_LOC + TSX_LOC))
    echo "TypeScript LOC:          $TS_LOC"
    echo "TSX LOC:                 $TSX_LOC"
    echo "Total LOC:               $TOTAL_LOC"
fi
echo ""

# Large files (potential refactor candidates)
echo "## Large Files (>300 lines)"
echo "----------------------------------------"
LARGE_FILE_COUNT=0
while IFS= read -r file; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" | tr -d ' ')
        if [ "$lines" -gt 300 ]; then
            relative_path="${file#$PROJECT_ROOT/}"
            echo "  $relative_path: $lines lines"
            LARGE_FILE_COUNT=$((LARGE_FILE_COUNT + 1))
        fi
    fi
done < <(find "$SRC_DIR" \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*")
echo "Large files count:       $LARGE_FILE_COUNT"
echo ""

# TypeScript errors
echo "## TypeScript Errors"
echo "----------------------------------------"
cd "$PROJECT_ROOT"
if command -v npx &> /dev/null; then
    TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
    echo "TypeScript errors:       $TS_ERRORS"
else
    echo "TypeScript errors:       (npx not available)"
fi
echo ""

# ESLint warnings/errors
echo "## ESLint Issues"
echo "----------------------------------------"
if command -v npx &> /dev/null; then
    LINT_OUTPUT=$(npm run lint 2>&1 || true)
    LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error" || echo "0")
    LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c "warning" || echo "0")
    echo "ESLint errors:           $LINT_ERRORS"
    echo "ESLint warnings:         $LINT_WARNINGS"
else
    echo "ESLint:                  (npx not available)"
fi
echo ""

# TODO/FIXME comments
echo "## Technical Debt Markers"
echo "----------------------------------------"
TODO_COUNT=$(grep -r "TODO" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
FIXME_COUNT=$(grep -r "FIXME" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
HACK_COUNT=$(grep -r "HACK" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "TODO comments:           $TODO_COUNT"
echo "FIXME comments:          $FIXME_COUNT"
echo "HACK comments:           $HACK_COUNT"
echo ""

# Any usage
echo "## Type Safety"
echo "----------------------------------------"
ANY_COUNT=$(grep -r ": any" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
AS_ANY_COUNT=$(grep -r "as any" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
AS_NEVER_COUNT=$(grep -r "as never" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "': any' usages:          $ANY_COUNT"
echo "'as any' casts:          $AS_ANY_COUNT"
echo "'as never' casts:        $AS_NEVER_COUNT"
echo ""

# Test coverage
echo "## Test Coverage"
echo "----------------------------------------"
TEST_FILES=$(find "$SRC_DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Test files:              $TEST_FILES"
echo ""

# Summary
echo "========================================"
echo "  Summary"
echo "========================================"
echo "Total source files:      $TOTAL_FILES"
echo "Total LOC:               $TOTAL_LOC"
echo "Large files (>300 LOC):  $LARGE_FILE_COUNT"
echo "TypeScript errors:       $TS_ERRORS"
echo "Type safety issues:      $((ANY_COUNT + AS_ANY_COUNT + AS_NEVER_COUNT))"
echo "Tech debt markers:       $((TODO_COUNT + FIXME_COUNT + HACK_COUNT))"
echo "========================================"
