# E2E Smoke Tests

This directory contains Maestro end-to-end smoke tests for critical user journeys.

## Prerequisites

1. **Install Maestro CLI**
   ```bash
   # Install Maestro
   curl -Ls "https://get.maestro.mobile.dev" | bash
   
   # Install Java 17 (required for Maestro 2.x)
   brew install openjdk@17
   ```

2. **Build and run the app**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

3. **Set test credentials** (optional)
   ```bash
   export TEST_EMAIL="your-test-account@email.com"
   export TEST_PASSWORD="your-test-password"
   ```

## Running Tests

### Quick Start
```bash
npm run e2e:smoke
```

### Platform-Specific
```bash
# iOS (default)
npm run e2e:smoke:ios

# Android
npm run e2e:smoke:android
```

### CI Mode
```bash
npm run e2e:smoke:ci
```
Outputs JUnit XML to `e2e-results.xml` for CI integration.

## Test Flows

| Flow | Description |
|------|-------------|
| `flows/login.yaml` | User authentication via email/password |
| `flows/feed.yaml` | Feed loads and scrolls correctly |
| `flows/favorite.yaml` | Favorites page navigation and tabs |
| `flows/contribution.yaml` | Deal creation modal opens/closes |
| `flows/profile.yaml` | Profile page displays and scrolls |

## Structure

```
e2e/
├── config.yaml          # Maestro configuration
├── smoke.yaml           # Main test orchestrator
├── README.md            # This file
└── flows/
    ├── login.yaml       # Login journey
    ├── feed.yaml        # Feed journey
    ├── favorite.yaml    # Favorites journey
    ├── contribution.yaml # Create deal journey
    └── profile.yaml     # Profile journey
```

## Writing New Tests

### Basic Flow Structure
```yaml
appId: com.imhungri

---
# Tap on element by text
- tapOn: "Button Text"

# Wait for element
- assertVisible: "Expected Text"

# Scroll
- scroll:
    direction: DOWN

# Input text
- inputText: "Hello World"
```

### Best Practices

1. **Keep flows short** - Each flow should test one journey
2. **Use optional assertions** - Add `optional: true` for elements that may not appear
3. **Wait for animations** - Use `waitForAnimationToEnd` after navigation
4. **Avoid flakiness** - Don't rely on exact timing, use visibility assertions

## Debugging

### Run with debug output
```bash
./scripts/run-e2e-smoke.sh --debug
```

### Run single flow
```bash
maestro test e2e/flows/login.yaml
```

### Interactive mode
```bash
maestro studio
```

## CI Integration

### GitHub Actions
```yaml
- name: Run E2E Smoke Tests
  env:
    TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
  run: npm run e2e:smoke:ci
```

### Artifacts
CI mode outputs `e2e-results.xml` which can be parsed by most CI systems for test reporting.
