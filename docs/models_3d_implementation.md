# Models 3D Implementation Documentation

## Overview

This document describes the implementation of the 3D neural network visualization feature for the Greenhouse Models application. The implementation follows the preliminary plan outlined in `models_3D_preliminary_plan.md` and adds a fourth canvas with interactive 3D visualization capabilities using only native HTML5 Canvas 2D API and mathematical transformations.

## Implementation Date

December 5, 2025

## Architecture

### Core Components

The 3D visualization system consists of three main modules:

1. **models_3d_math.js** - Mathematical foundation for 3D transformations
2. **models_ui_3d.js** - 3D canvas rendering and interaction
3. Integration with existing models_ui.js system

### File Structure

```
docs/js/
├── models_3d_math.js          # 3D mathematics utilities
├── models_ui_3d.js             # 3D canvas UI module
├── models_ui.js                # Main UI (updated with 3D integration)
├── models.js                   # Loader (updated to include 3D modules)
└── models_util.js              # Utilities (updated with 3D translations)
```

## Module Details

### 1. models_3d_math.js

**Purpose**: Provides mathematical functions for 3D-to-2D projection and transformations.

**Key Functions**:

- `project3DTo2D(x, y, z, camera, projection)` - Projects 3D coordinates to 2D screen space using perspective projection
- `rotatePoint3D(point, angleX, angleY, angleZ)` - Rotates a 3D point around X, Y, and Z axes
- `calculateDepth(point3D, camera)` - Calculates distance from camera to a point
- `sortByDepth(objects, camera)` - Implements painter's algorithm for depth sorting
- `projectIsometric(x, y, z, settings)` - Alternative isometric projection
- `applyDepthFog(baseAlpha, depth, fogStart, fogEnd)` - Depth-based alpha blending
- `calculateNormal(p1, p2, p3)` - Calculates surface normals for lighting
- `lerp3D(start, end, t)` - 3D linear interpolation
- `isInFrustum(point, camera, projection)` - Frustum culling check
- `degToRad(degrees)` / `radToDeg(radians)` - Angle conversion utilities

**Technical Approach**:
- Uses perspective division for realistic depth perception
- Implements rotation matrices for camera orientation
- Provides depth-based fog for atmospheric effects
- No external libraries required - pure JavaScript math

### 2. models_ui_3d.js

**Purpose**: Manages the 3D canvas, rendering, and user interaction.

**Key Features**:

#### Canvas Management
- Creates a fourth canvas dynamically inserted before the environment canvas
- Manages canvas lifecycle (show/hide, resize)
- Maintains separate 3D context and state

#### Camera System
```javascript
camera: {
    x: 0, y: 0, z: -500,           // Position
    rotationX: 0,                   // Pitch
    rotationY: 0,                   // Yaw
    rotationZ: 0,                   // Roll
    fov: 500                        // Field of view
}
```

#### Projection Settings
```javascript
projection: {
    width: 800,                     // Canvas width
    height: 600,                    // Canvas height
    near: 10,                       // Near clipping plane
    far: 2000                       // Far clipping plane
}
```

#### Interactive Controls
- **Mouse Drag**: Rotate camera by dragging on canvas
- **Mouse Wheel**: Zoom in/out by adjusting camera Z position
- **Sliders**: Fine-tune camera rotation (X, Y) and position (Z)
- **FOV Slider**: Adjust field of view
- **Auto-Rotate**: Automatic camera rotation around Y axis
- **Reset Camera**: Return to default view

#### Data Conversion
- Converts 2D network layout to 3D positions
- Distributes neurons in cylindrical arrangement
- Maps synaptic connections to 3D space
- Updates neuron activations in real-time

#### Rendering Pipeline
1. Clear canvas
2. Draw reference grid
3. Project all neurons to 2D screen space
4. Sort by depth (painter's algorithm)
5. Draw connections (with depth fog)
6. Draw neurons (with activation glow and depth effects)
7. Draw axis indicators (X=red, Y=green, Z=blue)

### 3. Integration with Existing System

#### models_ui.js Updates

**Initialization**:
```javascript
init(state, GreenhouseModelsUtil) {
    // ... existing code ...
    
    // Initialize 3D module if available
    if (window.GreenhouseModelsUI3D) {
        Object.assign(this, GreenhouseModelsUI3D);
    }
}
```

**Canvas Setup**:
```javascript
// Initialize 3D canvas if module is available
if (window.GreenhouseModelsUI3D && this.init3DCanvas) {
    this.init3DCanvas();
}
```

**Resize Handling**:
```javascript
resizeAllCanvases() {
    // ... existing 2D canvas resize ...
    
    // Resize 3D canvas if active
    if (this.resize3DCanvas && this.isActive) {
        this.resize3DCanvas();
    }
}
```

#### models.js Updates

**Module Loading**:
```javascript
// Load 3D modules
await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
await GreenhouseUtils.loadScript('models_ui_3d.js', baseUrl);
```

#### models_util.js Updates

**Translation Keys Added**:
- English: `3d_view_title`, `launch_3d`, `hide_3d`, `auto_rotate`, `stop_rotate`, `reset_camera`, `camera_x`, `camera_y`, `camera_z`, `fov`
- Spanish: Corresponding translations for all keys

## User Interface

### 3D Controls Panel

Located in the left column, above the environment canvas:

```
┌─────────────────────────────────────┐
│ 3D Neural Network View              │
├─────────────────────────────────────┤
│ [Canvas - 400px height]             │
│                                     │
│ [Launch 3D View]                    │
│ [Auto Rotate] [Reset Camera]       │
│                                     │
│ Camera X Rotation: [slider]        │
│ Camera Y Rotation: [slider]        │
│ Camera Z Position: [slider]        │
│ Field of View: [slider]            │
└─────────────────────────────────────┘
```

### Visual Features

1. **3D Grid**: Reference grid on the ground plane for depth perception
2. **Depth Fog**: Objects fade with distance for atmospheric depth
3. **Activation Glow**: Active neurons emit radial gradients
4. **Depth Shadows**: Subtle shadows under neurons for 3D effect
5. **Variable Line Width**: Connection thickness based on synaptic weight
6. **Axis Indicators**: RGB axes showing orientation (X=red, Y=green, Z=blue)
7. **Highlights**: Specular highlights on neuron surfaces

## Performance Optimizations

### Implemented
- Painter's algorithm for depth sorting (O(n log n))
- Frustum culling capability (can be enabled)
- Depth-based fog reduces distant object complexity
- RequestAnimationFrame for smooth 60fps rendering
- Canvas context caching

### Future Optimizations (from plan)
- Level of Detail (LOD) system
- Spatial partitioning for large networks
- Batch rendering for similar objects
- Offscreen canvas for complex calculations

## Technical Specifications

### Coordinate System
- **X-axis**: Left (-) to Right (+)
- **Y-axis**: Down (-) to Up (+)
- **Z-axis**: Away (-) to Toward (+) camera

### Default Camera Position
- Position: (0, 0, -500)
- Rotation: (0, 0, 0)
- FOV: 500

### Neuron Distribution
- Cylindrical arrangement around Y-axis
- Radius: 150 units
- Layer spacing: 80 units
- 10 neurons per layer

### Projection Parameters
- Near plane: 10 units
- Far plane: 2000 units
- Perspective projection with configurable FOV

## Browser Compatibility

### Tested Browsers
- Chrome/Edge (Chromium-based)
- Firefox
- Safari

### Requirements
- HTML5 Canvas 2D API support
- ES6 JavaScript support
- RequestAnimationFrame API

### Known Limitations
- Performance may vary on older devices
- Mobile touch gestures not yet implemented
- No WebGL fallback (intentionally uses 2D canvas only)

## Usage Instructions

### For Users

1. **Launch Simulation**: Start the main models simulation
2. **Enable 3D View**: Click "Launch 3D View" button in the left column
3. **Interact**:
   - Drag mouse to rotate camera
   - Scroll wheel to zoom
   - Use sliders for precise control
   - Click "Auto Rotate" for automatic rotation
4. **Reset**: Click "Reset Camera" to return to default view
5. **Hide**: Click "Hide 3D View" to collapse the 3D canvas

### For Developers

#### Adding New 3D Features

1. **Add to models_3d_math.js** for mathematical functions
2. **Add to models_ui_3d.js** for rendering features
3. **Update translations** in models_util.js if adding UI elements
4. **Test** across browsers and devices

#### Extending the System

```javascript
// Example: Add custom 3D object
this.neurons3D.push({
    id: 'custom-neuron',
    x: 100, y: 50, z: 0,
    radius: 10,
    activation: 0.5,
    customProperty: 'value'
});

// Example: Custom rendering in render3DView
const projected = GreenhouseModels3DMath.project3DTo2D(
    neuron.x, neuron.y, neuron.z,
    this.camera,
    this.projection
);
```

## Testing

### Manual Testing Checklist
- [ ] 3D canvas appears when "Launch 3D View" is clicked
- [ ] Mouse drag rotates the view
- [ ] Mouse wheel zooms in/out
- [ ] Sliders update camera position/rotation
- [ ] Auto-rotate toggles correctly
- [ ] Reset camera returns to default view
- [ ] Neurons render with proper depth sorting
- [ ] Connections show between neurons
- [ ] Activation glow appears on active neurons
- [ ] Language toggle updates 3D UI text
- [ ] Canvas resizes properly with window
- [ ] Performance maintains 60fps with typical network size

### Automated Testing
- Unit tests for 3D math functions (recommended)
- Integration tests for canvas rendering (recommended)
- Performance benchmarks (recommended)

## Future Enhancements

### Phase 1 Additions (from plan)
- ✅ 3D mathematics foundation
- ✅ Enhanced canvas rendering
- ✅ Interactive 3D controls
- ✅ 3D-specific visualizations

### Phase 2 Potential Features
1. **Advanced Visualizations**
   - Volumetric brain regions
   - Cross-sectional views
   - 3D particle systems for neural activity
   - Environmental factors as 3D fields

2. **Interaction Improvements**
   - Touch gesture support for mobile
   - VR/AR mode exploration
   - Preset camera angles (front, side, top, isometric)
   - Animation timeline controls

3. **Performance Enhancements**
   - WebGL fallback option
   - Level of Detail (LOD) system
   - Spatial partitioning
   - Worker thread for calculations

4. **Educational Features**
   - Guided tours through 3D space
   - Annotation system
   - Comparison mode (side-by-side 2D/3D)
   - Export 3D view as video

## Troubleshooting

### Common Issues

**Issue**: 3D canvas doesn't appear
- **Solution**: Check browser console for errors, ensure all scripts loaded

**Issue**: Poor performance/low framerate
- **Solution**: Reduce number of neurons, disable auto-rotate, close other tabs

**Issue**: Mouse controls not working
- **Solution**: Ensure canvas has focus, check for JavaScript errors

**Issue**: Translations not showing
- **Solution**: Verify models_util.js loaded, check language setting

## References

- Original Plan: `docs/models_3D_preliminary_plan.md`
- Canvas API: [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- 3D Math: Standard computer graphics transformation matrices
- Painter's Algorithm: Depth sorting for 2D rendering of 3D scenes

## Credits

- Implementation: Cline AI Assistant
- Design: Based on preliminary plan in models_3D_preliminary_plan.md
- Integration: Greenhouse Models team architecture

## Version History

- **v1.0** (2025-12-05): Initial implementation
  - 3D mathematics module
  - 3D canvas rendering
  - Interactive camera controls
  - Integration with existing system
  - Bilingual support (EN/ES)

## License

Part of the Greenhouse for Mental Health project.
