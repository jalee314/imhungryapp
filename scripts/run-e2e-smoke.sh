#!/bin/bash
# ============================================
# ImHungri E2E Smoke Test Runner
# ============================================
# Runs Maestro smoke tests with proper configuration
#
# Usage:
#   ./scripts/run-e2e-smoke.sh [options]
#
# Options:
#   --ios       Run on iOS simulator (default)
#   --android   Run on Android emulator
#   --device    Run on connected device
#   --ci        CI mode (no interactive prompts)
#   --debug     Run with debug output
#
# Environment:
#   TEST_EMAIL     - Test account email
#   TEST_PASSWORD  - Test account password
# ============================================

set -e

# Set up Java 17 for Maestro (required for Maestro 2.x)
if [ -d "/opt/homebrew/opt/openjdk@17" ]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
    export PATH="$JAVA_HOME/bin:$PATH"
elif [ -d "/usr/local/opt/openjdk@17" ]; then
    export JAVA_HOME="/usr/local/opt/openjdk@17"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

# Add Maestro to PATH
export PATH="$PATH:$HOME/.maestro/bin"

# Load .env file if it exists (for TEST_EMAIL, TEST_PASSWORD)
SCRIPT_DIR="$(dirname "$0")"
if [ -f "$SCRIPT_DIR/../.env" ]; then
    # Source the .env file directly (it has export statements)
    set -a
    source "$SCRIPT_DIR/../.env"
    set +a
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PLATFORM="ios"
CI_MODE=false
DEBUG_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ios)
            PLATFORM="ios"
            shift
            ;;
        --android)
            PLATFORM="android"
            shift
            ;;
        --device)
            PLATFORM="device"
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ImHungri E2E Smoke Tests${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check Maestro installation
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}Error: Maestro CLI not found${NC}"
    echo "Install with: brew install maestro"
    exit 1
fi

echo -e "${YELLOW}Platform:${NC} $PLATFORM"
echo -e "${YELLOW}CI Mode:${NC} $CI_MODE"
echo ""

# Set app ID based on platform
if [ "$PLATFORM" = "android" ]; then
    APP_ID="Adaluna.imhungry"
else
    APP_ID="com.imhungri"
fi

# Build Maestro command
MAESTRO_CMD="maestro test"

if [ "$DEBUG_MODE" = true ]; then
    MAESTRO_CMD="$MAESTRO_CMD --debug-output"
fi

if [ "$CI_MODE" = true ]; then
    # In CI, output results as JUnit XML
    MAESTRO_CMD="$MAESTRO_CMD --format junit --output e2e-results.xml"
fi

# Export test credentials if not set
if [ -z "$TEST_EMAIL" ]; then
    echo -e "${YELLOW}Warning: TEST_EMAIL not set, using placeholder${NC}"
    export TEST_EMAIL="test@example.com"
fi

if [ -z "$TEST_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: TEST_PASSWORD not set, using placeholder${NC}"
    export TEST_PASSWORD="testpass123"
fi

# Change to e2e directory
cd "$(dirname "$0")/../e2e"

echo -e "${YELLOW}Running smoke tests...${NC}"
echo ""

# Run the smoke test suite with env vars passed to Maestro
$MAESTRO_CMD -e TEST_EMAIL="$TEST_EMAIL" -e TEST_PASSWORD="$TEST_PASSWORD" smoke.yaml

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ All smoke tests passed!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ✗ Smoke tests failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
