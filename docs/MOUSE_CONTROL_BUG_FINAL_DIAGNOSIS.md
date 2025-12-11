# Mouse Control Bug - FINAL DIAGNOSIS

## Executive Summary

**ROOT CAUSE IDENTIFIED**: Function signature mismatches in `genetic_ui_3d.js`

All PiP draw functions are being called with **missing required parameters**, causing `cameraState` to be `undefined`. This means the PiP views cannot access the controller's camera, so mouse controls don't work.

## The Bug

### Location: `docs/js/genetic_ui_3d.js` render() method

**Lines 576, 582, 587** - All PiP function calls are missing parameters:

```javascript
// CURRENT (BROKEN) CODE:
this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene, microState, drawPiPFrame);
//                                                                ^^^^^^^^^^  ^^^^^^^^^^^
//                                                                Missing 2 params!

this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene, proteinState, drawPiPFrame);
//                                                                       ^^^^^^^^^^^^  ^^^^^^^^^^^
//                                                                       Missing 1 param!

this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);
//                                                                     ^^^^^^^^^^^  ^^^^^^^^^^^
//                                                                     Missing 2 params!
```

### Expected Function Signatures

From the actual function definitions:

```javascript
// genetic_ui_3d_gene.js line 5:
drawMicroView(ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes, drawPiPFrameCallback, cameraState)
//                                         ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
//                                         7th param         8th param     9th param             10th param

// genetic_ui_3d_protein.js line 5:
drawProteinView(ctx, x, y, w, h, activeGene, proteinCache, drawPiPFrameCallback, cameraState)
//                                           ^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
//                                           7th param     8th param             9th param

// genetic_ui_3d_brain.js line 5:
drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState)
//                                          ^^^^^^^^^^^^^^^^  ^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
//                                          7th param         8th param   9th param             10th param
```

### What's Actually Happening

| Function | Parameter Position | Expected | Actually Passed | Result |
|----------|-------------------|----------|-----------------|--------|
| **drawMicroView** | 7th | `activeGeneIndex` (number) | `microState` (object) | ❌ Wrong type |
| | 8th | `neuronMeshes` (object) | `drawPiPFrame` (function) | ❌ Wrong type |
| | 9th | `drawPiPFrameCallback` (function) | `undefined` | ❌ Missing |
| | 10th | `cameraState` (object) | `undefined` | ❌ **MISSING!** |
| **drawProteinView** | 7th | `proteinCache` (object) | `proteinState` (object) | ❌ Wrong object |
| | 8th | `drawPiPFrameCallback` (function) | `drawPiPFrame` (function) | ✓ Correct |
| | 9th | `cameraState` (object) | `undefined` | ❌ **MISSING!** |
| **drawTargetView** | 7th | `activeGeneIndex` (number) | `targetState` (object) | ❌ Wrong type |
| | 8th | `brainShell` (object) | `drawPiPFrame` (function) | ❌ Wrong type |
| | 9th | `drawPiPFrameCallback` (function) | `undefined` | ❌ Missing |
| | 10th | `cameraState` (object) | `undefined` | ❌ **MISSING!** |

## Why Only Target PiP "Works"

The target (brain) PiP appears to work because `drawTargetView` has fallback logic:

```javascript
// genetic_ui_3d_brain.js lines 11-23:
if (cameraState && cameraState.camera) {
    targetCamera = cameraState.camera;
} else {
    // Fallback: create default camera
    targetCamera = {
        x: cameraState ? cameraState.panX : 0,
        y: cameraState ? cameraState.panY : 0,
        z: -300 / (cameraState ? cameraState.zoom : 1.0),
        rotationX: 0.2 + (cameraState ? cameraState.rotationX : 0),
        rotationY: cameraState ? cameraState.rotationY : 0,
        rotationZ: 0,
        fov: 600
    };
}
```

Since `cameraState` is `undefined`, it creates a **default static camera**. This camera doesn't respond to mouse input, but it renders something visible, so it appears to "work" (but it doesn't actually respond to controls).

## The Fix

### Fix for drawMicroView (line 576)

```javascript
// BEFORE:
this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene, microState, drawPiPFrame);

// AFTER:
this.drawMicroView(ctx, rightPipX, gap, pipW, pipH, activeGene, 
    this.activeGeneIndex,  // 7th param
    this.neuronMeshes,     // 8th param
    drawPiPFrame,          // 9th param
    microState);           // 10th param - cameraState
```

### Fix for drawProteinView (line 582)

```javascript
// BEFORE:
this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene, proteinState, drawPiPFrame);

// AFTER:
this.drawProteinView(ctx, rightPipX, proteinY, pipW, pipH, activeGene, 
    this.proteinCache,     // 7th param
    drawPiPFrame,          // 8th param
    proteinState);         // 9th param - cameraState
```

### Fix for drawTargetView (line 587)

```javascript
// BEFORE:
this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, targetState, drawPiPFrame);

// AFTER:
this.drawTargetView(ctx, rightPipX, targetY, pipW, pipH, activeGene, 
    this.activeGeneIndex,  // 7th param
    this.brainShell,       // 8th param
    drawPiPFrame,          // 9th param
    targetState);          // 10th param - cameraState
```

### Also Fix Main View (line 545)

The main view has the same issue:

```javascript
// BEFORE:
this.drawTargetView(ctx, 0, 0, w, h, activeGene, { camera: this.camera });

// AFTER:
this.drawTargetView(ctx, 0, 0, w, h, activeGene, 
    this.activeGeneIndex,  // 7th param
    this.brainShell,       // 8th param
    null,                  // 9th param - no frame callback for main view
    { camera: this.camera }); // 10th param - cameraState
```

## Additional Issue: DNA Helix PiP

The DNA Helix PiP has an additional bug in `drawDNAHelixPiP()` (line 1015):

```javascript
// CURRENT (BROKEN):
const pipCamera = {
    rotationY: (cameraState.rotationY || 0) + time * 0.3,  // Always adds auto-rotate!
};

// FIX:
const pipCamera = cameraState.camera;  // Use controller's camera directly
```

This adds time-based rotation even after the user has interacted with it, overriding user input.

## Summary of All Fixes Needed

1. **Fix drawMicroView call** - Add missing parameters
2. **Fix drawProteinView call** - Add missing parameter
3. **Fix drawTargetView call (PiP)** - Add missing parameters
4. **Fix drawTargetView call (main view)** - Add missing parameters
5. **Fix drawDNAHelixPiP** - Remove auto-rotate, use camera reference

## Test Files Created

1. **test_genetic_pip_camera_usage.js** - Identifies function signature mismatches
2. **test_genetic_mouse_actual_bug.js** - Tests camera controller behavior
3. **test_genetic_mouse_event_flow.js** - Tests event routing
4. **test_genetic_mouse_control_independence.js** - Comprehensive tests

## Why This Was Hard to Find

1. **Multiple Layers**: Bug is in the calling code, not the controller or event routing
2. **Partial Functionality**: One PiP appears to work due to fallback logic
3. **Silent Failure**: JavaScript doesn't error on missing parameters, just passes `undefined`
4. **Correct Architecture**: The controllers and event system work perfectly - the bug is just in how they're called

## Impact

**Severity**: 🔴 Critical - Core functionality broken  
**Complexity**: 🟢 Simple - Just parameter fixes  
**Risk**: 🟢 Low - Straightforward parameter additions  
**Testing**: 🟡 Medium - Need to test all 4 PiP views + main view

---

**Next Steps**: Apply all 5 fixes to `genetic_ui_3d.js` and test in browser.
