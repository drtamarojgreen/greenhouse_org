# Greenhouse Scheduler Test Environment

This is a fresh test environment created specifically for testing the Greenhouse Mental Health scheduling application, which is hosted on GitHub Pages and integrated into the Wix platform.

## 📋 Overview

This test environment follows the comprehensive test plan outlined in `docs/schedule_test_plan.md` and provides:

- **Local simulation** of the Wix production environment
- **Mock Velo backend** for testing without live backend dependencies
- **Unit testing framework** for individual JavaScript modules
- **Integration testing** for frontend-backend communication
- **E2E testing** capabilities for complete user flows
- **Security testing** for permissions and access control

## 🏗️ Directory Structure

```
test_new/
├── README.md                          # This file
├── config/
│   ├── test_config.json              # Test configuration settings
│   └── browser_config.json           # Browser-specific settings
├── fixtures/
│   ├── mock_appointments.json        # Sample appointment data
│   ├── mock_services.json            # Sample service data
│   └── mock_users.json               # Sample user data
├── mocks/
│   ├── velo_backend_mock.js          # Mock Wix Velo backend functions
│   └── wix_api_mock.js               # Mock Wix API functions
├── pages/
│   ├── schedule_test_page.html       # Local test page simulating Wix DOM
│   ├── dashboard_test_page.html      # Admin dashboard test page
│   └── admin_test_page.html          # Individual appointment admin page
├── utils/
│   ├── test_framework.js             # Lightweight unit testing framework
│   ├── test_helpers.js               # Common test helper functions
│   ├── assertion_library.js          # Custom assertion functions
│   └── dom_helpers.js                # DOM manipulation helpers
├── unit/
│   ├── test_scheduler.js             # Unit tests for scheduler.js
│   ├── test_dashboard.js             # Unit tests for dashboard.js
│   ├── test_admin.js                 # Unit tests for admin.js
│   └── test_utils.js                 # Unit tests for utility functions
├── integration/
│   ├── test_frontend_backend.js      # Frontend-backend integration tests
│   ├── test_dom_injection.js         # DOM injection tests
│   └── test_asset_loading.js         # Asset loading tests
├── e2e/
│   ├── test_public_user_flow.js      # Public user scenarios
│   ├── test_admin_flow.js            # Administrator scenarios
│   └── test_conflict_resolution.js   # Conflict resolution scenarios
├── security/
│   ├── test_permissions.js           # Permission and access control tests
│   ├── test_input_validation.js      # Input validation and XSS tests
│   └── test_velo_permissions.js      # Velo data collection permissions
├── performance/
│   ├── test_asset_loading_perf.js    # Asset loading performance tests
│   ├── test_ui_rendering_perf.js     # UI rendering performance tests
│   └── test_backend_response.js      # Backend response time tests
├── scripts/
│   ├── run_unit_tests.js             # Run all unit tests
│   ├── run_integration_tests.js      # Run all integration tests
│   ├── run_all_tests.js              # Run complete test suite
│   └── setup_test_server.js          # Local test server setup
└── reports/
    └── .gitkeep                      # Placeholder for test reports
```

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v14 or higher)
2. **Modern web browser** (Chrome, Firefox, Safari, or Edge)
3. **Local web server** (for serving test files)

### Installation

```bash
# Navigate to the test directory
cd test_new

# Install dependencies (if using npm packages)
npm install

# Or use the built-in test server
node scripts/setup_test_server.js
```

### Running Tests

#### Unit Tests
```bash
# Run all unit tests
node scripts/run_unit_tests.js

# Run specific unit test file
node unit/test_scheduler.js
```

#### Integration Tests
```bash
# Run all integration tests
node scripts/run_integration_tests.js

# Run specific integration test
node integration/test_frontend_backend.js
```

#### E2E Tests
```bash
# Run all E2E tests
node e2e/test_public_user_flow.js
```

#### Complete Test Suite
```bash
# Run all tests
node scripts/run_all_tests.js
```

## 🧪 Test Types

### 1. Unit Testing (TC-WIX-04)

Tests individual JavaScript modules in isolation using custom-built testing utilities.

**Coverage:**
- `scheduler.js` - Core scheduling logic
- `dashboard.js` - Dashboard functionality
- `admin.js` - Admin page functionality
- Utility functions and helpers

**Example:**
```javascript
// unit/test_scheduler.js
import { TestFramework } from '../utils/test_framework.js';
import { scheduler } from '../../docs/js/scheduler.js';

TestFramework.describe('Scheduler Module', () => {
  TestFramework.it('should validate appointment data', () => {
    const result = scheduler.validateAppointment({...});
    TestFramework.assert.isTrue(result.valid);
  });
});
```

### 2. Integration Testing

Tests interaction between frontend and backend, and DOM injection.

**Coverage:**
- Frontend-Backend communication (TC-WIX-12, TC-WIX-13, TC-WIX-14)
- DOM injection and rendering (TC-WIX-08, TC-WIX-09, TC-WIX-10)
- Asset loading and CORS (TC-WIX-05, TC-WIX-06, TC-WIX-07)

### 3. End-to-End Testing

Tests complete user flows from start to finish.

**Coverage:**
- Public user appointment request flow (TS-PUB-01, TS-PUB-02)
- Administrator dashboard operations (TS-ADM-01 through TS-ADM-05)

### 4. Security Testing

Tests authentication, authorization, and input validation.

**Coverage:**
- Permission enforcement (TC-WIX-15, TC-WIX-16, TC-WIX-17, TC-WIX-18)
- Input validation and XSS prevention
- Velo data collection permissions

### 5. Performance Testing

Measures loading times and responsiveness.

**Coverage:**
- Asset loading performance
- UI rendering speed
- Backend response times

## 🔧 Configuration

### Test Configuration (`config/test_config.json`)

```json
{
  "environment": "local",
  "baseUrl": "http://localhost:8080",
  "githubPagesUrl": "https://yourusername.github.io/greenhouse_org",
  "wixTestSiteUrl": "https://test.greenhousementalhealth.org",
  "timeout": 5000,
  "retries": 2,
  "screenshots": true,
  "verbose": true
}
```

### Browser Configuration (`config/browser_config.json`)

```json
{
  "browsers": ["chrome", "firefox", "safari", "edge"],
  "headless": false,
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

## 🎭 Mock Backend

The mock Velo backend (`mocks/velo_backend_mock.js`) simulates all Wix Velo functions:

- `getAppointments()` - Returns sample appointment data
- `createAppointment()` - Simulates appointment creation
- `updateAppointment()` - Simulates appointment updates
- `deleteAppointment()` - Simulates appointment deletion
- `getServices()` - Returns sample service data
- `checkPermissions()` - Simulates permission checks

## 📄 Test Pages

### Local Test Pages (TC-WIX-01)

The test pages in `pages/` accurately mimic the DOM structure of the live Wix pages:

- **schedule_test_page.html** - Simulates `/schedule` page
- **dashboard_test_page.html** - Simulates admin dashboard
- **admin_test_page.html** - Simulates individual appointment admin page

These pages include:
- Correct element IDs and classes matching Wix structure
- Mock Velo backend script inclusion
- Cross-origin asset loading simulation (TC-WIX-02)

## 🔍 Test Utilities

### Test Framework (`utils/test_framework.js`)

Lightweight testing framework providing:
- Test suite organization (`describe`, `it`)
- Lifecycle hooks (`beforeEach`, `afterEach`)
- Test running and reporting
- Assertion library integration

### Assertion Library (`utils/assertion_library.js`)

Custom assertions for:
- Value comparisons
- Type checking
- DOM element validation
- Async operation testing

### Test Helpers (`utils/test_helpers.js`)

Common helper functions:
- DOM manipulation
- Event simulation
- Async utilities
- Data generation

## 📊 Test Reports

Test results are saved to `reports/` directory:

- **HTML reports** - Visual test results with pass/fail status
- **JSON reports** - Machine-readable test data
- **Coverage reports** - Code coverage metrics
- **Performance reports** - Timing and performance data

## 🐛 Debugging

### Debug Mode

Enable verbose logging:
```javascript
// In test files
TestFramework.setVerbose(true);
```

### Browser DevTools

Tests run in visible browser windows by default for easy debugging.

### Console Logging

All test output includes:
- Test names and descriptions
- Assertion results
- Error messages with stack traces
- Performance metrics

## ✅ Test Checklist

Based on the test plan, ensure all test cases are covered:

### Wix Platform Specific Tests
- [ ] TC-WIX-01: Local HTML test page created
- [ ] TC-WIX-02: Cross-origin asset loading simulated
- [ ] TC-WIX-03: Mock Velo backend implemented
- [ ] TC-WIX-04: Functional tests in local environment
- [ ] TC-WIX-05: Asset loading verification
- [ ] TC-WIX-06: CORS error checking
- [ ] TC-WIX-07: Cache behavior testing
- [ ] TC-WIX-08: DOM injection verification
- [ ] TC-WIX-09: UI rendering verification
- [ ] TC-WIX-10: JavaScript error checking
- [ ] TC-WIX-11: Injection resilience testing
- [ ] TC-WIX-12: Backend function success verification
- [ ] TC-WIX-13: Backend error handling
- [ ] TC-WIX-14: Data persistence verification
- [ ] TC-WIX-15: Public user access control
- [ ] TC-WIX-16: Admin URL access control
- [ ] TC-WIX-17: Admin authentication
- [ ] TC-WIX-18: Admin function authorization

### User Scenarios
- [ ] TS-PUB-01: Public appointment request flow
- [ ] TS-PUB-02: Service list viewing
- [ ] TS-ADM-01: Admin dashboard loading
- [ ] TS-ADM-02: Conflict resolution
- [ ] TS-ADM-03: Appointment creation
- [ ] TS-ADM-04: Appointment search and update
- [ ] TS-ADM-05: Appointment deletion

## 🔗 Related Documentation

- [Schedule Test Plan](../docs/schedule_test_plan.md)
- [Scheduler System Prompt](../docs/scheduler_system_prompt.md)
- [Scheduler Implementation Plan](../docs/scheduler_implementation_plan.md)

## 📝 Contributing

When adding new tests:

1. Follow the established directory structure
2. Use the provided test framework and utilities
3. Include clear test descriptions and comments
4. Add appropriate assertions
5. Update this README with new test coverage
6. Ensure tests are isolated and repeatable

## 🎯 Best Practices

1. **Test Isolation** - Each test should be independent
2. **Clear Naming** - Use descriptive test names
3. **Arrange-Act-Assert** - Follow AAA pattern
4. **Mock External Dependencies** - Use mock backend for unit tests
5. **Test Edge Cases** - Include boundary conditions
6. **Performance Awareness** - Keep tests fast and efficient
7. **Documentation** - Comment complex test logic

---

*This test environment was created from scratch to provide comprehensive testing capabilities for the Greenhouse Mental Health scheduling application, following the detailed test plan and best practices for modern JavaScript testing.*
