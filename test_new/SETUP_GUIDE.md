# Test Environment Setup Guide

This guide will help you set up and run the fresh test environment for the Greenhouse Mental Health scheduling application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Modern web browser** (Chrome, Firefox, Safari, or Edge)
- **Text editor or IDE** (VS Code recommended)

## 🚀 Quick Start

### 1. Navigate to Test Directory

```bash
cd test_new
```

### 2. Start the Test Server

```bash
node scripts/setup_test_server.js
```

The server will start on `http://localhost:8080`

### 3. Open Test Page

Open your browser and navigate to:
```
http://localhost:8080/pages/schedule_test_page.html
```

### 4. Run Tests

Click the "Run Tests" button on the test page to verify the setup.

## 📁 Directory Structure Overview

```
test_new/
├── config/              # Test configuration files
├── fixtures/            # Mock data (appointments, services, users)
├── mocks/              # Mock Velo backend and Wix API
├── pages/              # Test HTML pages
├── utils/              # Test framework and utilities
├── unit/               # Unit tests (to be created)
├── integration/        # Integration tests (to be created)
├── e2e/                # End-to-end tests (to be created)
├── security/           # Security tests (to be created)
├── performance/        # Performance tests (to be created)
├── scripts/            # Test runner scripts
└── reports/            # Test reports (generated)
```

## 🧪 Running Different Test Types

### Unit Tests

Unit tests will test individual JavaScript modules in isolation.

```bash
# To be implemented
node scripts/run_unit_tests.js
```

### Integration Tests

Integration tests will test the interaction between components.

```bash
# To be implemented
node scripts/run_integration_tests.js
```

### Complete Test Suite

Run all tests at once:

```bash
# To be implemented
node scripts/run_all_tests.js
```

## 🎭 Using Mock Backend

The mock Velo backend simulates all Wix backend functions without requiring a live connection.

### Simulating Different Users

On the test page, use the buttons to simulate different user types:

- **Public User** - Not logged in, can only request appointments
- **Admin User** - Logged in as admin, full access to all features

### Mock Data

Mock data is loaded from the `fixtures/` directory:

- `mock_appointments.json` - Sample appointment data
- `mock_services.json` - Available services
- `mock_users.json` - User accounts and permissions

You can modify these files to test different scenarios.

## 🔧 Configuration

### Test Configuration

Edit `config/test_config.json` to customize:

```json
{
  "environment": "local",
  "baseUrl": "http://localhost:8080",
  "timeout": 5000,
  "verbose": true
}
```

### Browser Configuration

Edit `config/browser_config.json` for browser-specific settings:

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

## 📝 Writing Tests

### Using the Test Framework

The custom test framework provides a familiar API:

```javascript
// Load test framework
TestFramework.describe('My Test Suite', () => {
  
  TestFramework.beforeEach(() => {
    // Setup before each test
  });

  TestFramework.it('should do something', () => {
    // Test code
    assert.equal(actual, expected);
  });

  TestFramework.afterEach(() => {
    // Cleanup after each test
  });
});

// Run tests
TestFramework.run();
```

### Using Assertions

The assertion library provides comprehensive assertion methods:

```javascript
// Value assertions
assert.equal(actual, expected);
assert.isTrue(value);
assert.isFalse(value);

// Type assertions
assert.isString(value);
assert.isNumber(value);
assert.isArray(value);

// DOM assertions
assert.elementExists('#my-element');
assert.hasClass(element, 'active');
assert.isVisible(element);

// Async assertions
await assert.throwsAsync(async () => {
  await someAsyncFunction();
}, 'Expected error message');
```

## 🐛 Debugging

### Console Output

The test page captures all console output in a visible console panel. This helps you:

- See test progress in real-time
- Identify errors and warnings
- Debug test failures

### Browser DevTools

Open browser DevTools (F12) to:

- Inspect DOM elements
- Debug JavaScript
- Monitor network requests
- View detailed error messages

### Verbose Mode

Enable verbose mode in the test configuration for detailed output:

```javascript
TestFramework.setVerbose(true);
```

## 📊 Test Reports

Test reports are automatically generated and saved to the `reports/` directory:

- **HTML reports** - Visual test results
- **JSON reports** - Machine-readable data
- **Console output** - Terminal output

## ✅ Test Coverage Checklist

Based on the test plan (`docs/schedule_test_plan.md`), ensure coverage of:

### Wix Platform Tests
- [ ] TC-WIX-01: Local HTML test page
- [ ] TC-WIX-02: Cross-origin asset loading
- [ ] TC-WIX-03: Mock Velo backend
- [ ] TC-WIX-04: Functional tests in local environment
- [ ] TC-WIX-05-07: Asset loading and CORS
- [ ] TC-WIX-08-11: DOM injection
- [ ] TC-WIX-12-14: Backend integration
- [ ] TC-WIX-15-18: Authentication and permissions

### User Scenarios
- [ ] TS-PUB-01: Public appointment request
- [ ] TS-PUB-02: Service list viewing
- [ ] TS-ADM-01-05: Admin operations

## 🔍 Troubleshooting

### Port Already in Use

If port 8080 is already in use:

1. Stop the other application using port 8080
2. Or modify the PORT in `scripts/setup_test_server.js`

### Mock Data Not Loading

If mock data fails to load:

1. Check that fixture files exist in `fixtures/` directory
2. Verify JSON syntax is valid
3. Check browser console for errors

### Tests Not Running

If tests don't run:

1. Ensure test server is running
2. Check browser console for JavaScript errors
3. Verify all script files are loaded correctly

## 📚 Additional Resources

- [Test Plan](../docs/schedule_test_plan.md)
- [Scheduler System Prompt](../docs/scheduler_system_prompt.md)
- [Implementation Plan](../docs/scheduler_implementation_plan.md)

## 🤝 Contributing

When adding new tests:

1. Follow the established directory structure
2. Use the provided test framework and utilities
3. Include clear test descriptions
4. Add appropriate assertions
5. Update documentation

## 📞 Support

For issues or questions:

1. Check this guide first
2. Review the test plan documentation
3. Check browser console for errors
4. Review mock backend logs

---

**Happy Testing! 🧪**
