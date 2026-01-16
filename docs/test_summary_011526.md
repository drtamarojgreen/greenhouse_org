# Unit Test Execution Summary - 01/15/26

## 1. Executive Summary

This document provides a summary of the unit test execution for the website. The tests were run using the custom Node.js-based testing framework found in the repository.

**The test suite is in a broken state.** Of the **24** test files in the `tests/unit/` directory, **4 failed to execute** due to fatal errors. Of the 20 files that did run, several contained numerous failing tests.

A total of **208** tests were run across the 20 executable files, resulting in **121 passed** tests, **86 failed** tests, and **1 skipped** test.

## 2. Overall Results from Executed Suites

| Metric | Count |
| :--- | :--- |
| Total Tests Run | 208 |
| Passed | 121 |
| Failed | 86 |
| Skipped | 1 |
| **Pass Rate** | **58.2%** |

---

## 3. Test Files That Failed to Execute

The following **4** test files failed to run entirely due to a fatal `ReferenceError`, preventing any tests within them from being executed.

*   `tests/unit/test_genetic_3d_projection.js`
*   `tests/unit/test_genetic_camera_views.js`
*   `tests/unit/test_genetic_main_camera_controller.js`
*   `tests/unit/test_genetic_pip_interactions.js`

**Error:** `ReferenceError: describe is not defined`
**Reason:** This error indicates that the test files are unable to access the `describe` function from the custom test framework. The framework's functions are not being correctly imported or made available in the global scope for these specific files.

---

## 4. Detailed Breakdown of Failed Tests

The following is a detailed list of all **86** test failures from the suites that were able to execute.

### `test_genetic_mouse_actual_bug.js` (9 Failures)
This suite identifies critical bugs related to mouse control and camera state management. The failures indicate that camera objects are not being correctly referenced, leading to unpredictable behavior.
- **BUG: Main view in render() uses this.camera directly, not mainCameraController.camera**: `TypeError: Cannot read properties of undefined (reading 'camera')`
- **CRITICAL: getState() returns a NEW object, not the camera reference**: `TypeError: Cannot read properties of undefined (reading 'getState')`
- **BUG: PiP views use cameraState properties, not cameraState.camera**: `TypeError: Cannot read properties of undefined (reading 'getState')`
- **REPRODUCE BUG: Drag PiP, camera changes, but render uses old values**: `TypeError: Cannot read properties of undefined (reading 'cameras')`
- **ACTUAL BUG: Check if getState() returns correct values**: `TypeError: Cannot read properties of undefined (reading 'cameras')`
- **CRITICAL BUG FOUND: Auto-rotate adds to rotationY every frame!**: `TypeError: Cannot read properties of undefined (reading 'cameras')`
- **BUG: Auto-rotate should be disabled when user interacts**: `TypeError: Cannot read properties of undefined (reading 'controllers')`
- **CRITICAL: Main view and PiP target view share the same camera!**: `TypeError: Cannot read properties of undefined (reading 'getState')`
- **ISSUE: drawDNAHelixPiP always adds auto-rotate, ignoring controller state**: `TypeError: Cannot read properties of undefined (reading 'controllers')`

### `test_genetic_mouse_control_independence.js` (24 Failures)
This entire suite failed, indicating a complete lack of camera state isolation between the main view and the Picture-in-Picture (PiP) windows. Mouse events are not being correctly routed or stopped.
- **24x Failures including**:
    - `should stop propagation when clicking on PiP`: `TypeError: Cannot read properties of undefined (reading 'handleMouseDown')`
    - `should correctly identify helix PiP`: `TypeError: Cannot read properties of undefined (reading 'getPiPAtPosition')`
    - `should maintain separate camera states for each PiP`: `TypeError: Cannot read properties of undefined (reading 'getState')`
    - `should route mouse events to correct PiP controller`: `TypeError: Cannot read properties of undefined (reading 'handleMouseDown')`

### `test_genetic_mouse_event_flow.js` (19 Failures)
Similar to the above, this suite shows a fundamental breakdown in the mouse event handling logic for both the main camera and PiP controllers.
- **19x Failures including**:
    - `should create main camera controller`: `AssertionError: Main controller should be defined`
    - `should detect helix PiP at top left`: `TypeError: Cannot read properties of undefined (reading 'getPiPAtPosition')`
    - `should handle mouse down`: `TypeError: Cannot read properties of undefined (reading 'handleMouseDown')`
    - `should not affect main camera when PiP is dragged`: `TypeError: Cannot read properties of undefined (reading 'rotationY')`

### `test_genetic_page.js` (1 Failure)
- **should initialize PiP controllers**: `AssertionError: Expected value to be defined`

### `test_genetic_pip_camera_usage.js` (4 Failures)
These tests point to incorrect function signatures and object references when drawing PiP views.
- **4x Failures**: `TypeError: Cannot read properties of undefined (reading 'cameras')`

### `test_genetic_pip_controls.js` (4 Failures)
Failures indicate the PiP controllers are not being initialized correctly.
- **4x Failures including**:
    - `should initialize controllers`: `AssertionError: Expected value to be defined`
    - `should handle mouse interaction for all PiP views`: `TypeError: Cannot read properties of undefined (reading 'mouseDown')`
    - `should get state`: `TypeError: Cannot read properties of null (reading 'x')`

### `test_genetic_rotation_and_camera_positions.js` (21 Failures)
This suite reveals major issues in camera manipulation, including rotation, zoom, and reset functionality.
- **21x Failures including**:
    - `Camera position should change after pan`: `TypeError: Cannot read properties of undefined (reading 'x')`
    - `Each PiP should have independent camera`: `TypeError: Cannot read properties of undefined (reading 'cameras')`
    - `Auto-rotate should be enabled by default`: `TypeError: Cannot read properties of undefined (reading 'autoRotate')`
    - `Reset button should exist for each PiP`: `TypeError: Cannot read properties of undefined (reading 'width')`

### `test_genetic_visualizations.js` (1 Failure)
- **should draw target view**: `AssertionError: Expected value to be truthy`

### `test_neuro_ui.js` (1 Failure)
- **should update data**: `TypeError: Cannot read properties of undefined (reading 'neurons')`

### `test_test_framework.js` (2 Failures)
The framework's own tests are failing, indicating issues with its core logic for handling deliberate failures and timeouts.
- **should fail**: `AssertionError: Expected value to be truthy` (This is an expected failure to test the framework)
- **should timeout**: `Error: Test timeout after 50ms` (This is an expected failure to test timeouts)

### Runtime Errors in Executed Files
Two files threw errors during their test runs, which interrupted the execution.

*   **`test_neuro_ui.js`**: `TypeError: ctx.setLineDash is not a function`
*   **`test_synapse_page_loader.js`**: `TypeError: Cannot read properties of undefined (reading 'init')`

## 5. Test Coverage

The custom testing framework used in this project does not provide test coverage metrics. Therefore, code coverage information is not available.
