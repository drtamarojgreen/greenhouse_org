# Models Canvas 3D Preliminary Plan

## Executive Summary

This document outlines a preliminary plan for adding a three-dimensional experience without introducing additional libraries. This will be done by adding a fourth canvas to display the 3D prototype. The plan leverages native HTML5 Canvas 2D API with mathematical transformations to simulate 3D rendering.

## Current Architecture Analysis

Based on analysis of the existing codebase (models_ui.js:124-133), the current system uses:

- Three separate 2D canvases: synaptic, network, and environment
- Canvas contexts obtained via `getContext('2d')`
- Component-based rendering system with layered drawing
- Mathematical transforms for positioning and scaling
- Modular UI components (Brain, Environment, Synapse modules)

## 3D Transformation Approach

### Core Strategy: Pseudo-3D Using 2D Canvas

Since we cannot use additional libraries, we'll implement 3D visualization through:

1. **Mathematical 3D-to-2D Projection**
   - Implement perspective projection algorithms
   - Use isometric or orthographic projections as alternatives
   - Calculate screen coordinates from 3D world coordinates

2. **Z-Buffer Simulation**
   - Sort rendering order by depth (painter's algorithm)
   - Implement depth-based alpha blending for layering effects

3. **3D Coordinate System**
   - Establish world space coordinates (x, y, z)
   - Implement view transformation matrix
   - Add camera position and orientation controls

## Prototype Canvas

A fourth canvas will be built underneath the existing canvases that will display the prototype 3d canvas. The 3d canvas will start with a second launch button that will start the canvas.

## Implementation Phases

### Phase 1: 3D Mathematics Foundation

**Location**: New utility in `docs/js/models_3d_math.js`

```javascript
// Key functions to implement:
- project3DTo2D(x, y, z, camera, projection)
- rotatePoint3D(point, angleX, angleY, angleZ)
- transformMatrix3D(translation, rotation, scale)
- calculateDepth(point3D, camera)
```

### Phase 2: Enhanced Canvas Rendering

**Modifications to**: `models_ui_brain.js`, `models_ui_environment.js`

1. **Extend _renderElement function** (models_ui_brain.js:6)
   - Add 3D coordinate properties to elements
   - Implement depth-sorting before rendering
   - Apply 3D transformations to 2D drawing commands

2. **3D Environment Components**
   - Add BackgroundComponent for 3D brain visualization
   - Add depth layers to medication and therapy visualizations
   - Implement 3D particle systems for neural activity

### Phase 3: Interactive 3D Controls

**New controls panel section**:
- Camera rotation (X, Y, Z axes)
- Zoom/perspective adjustment
- View presets (front, side, top, isometric)
- Animation toggle for auto-rotation

### Phase 4: 3D-Specific Visualizations

1. **Neural Network Depth**
   - Render synaptic connections in 3D space
   - Show dendrites and axons with proper depth
   - Implement 3D branching algorithms (models_ui_brain.js:73-81)

2. **Brain Region Volumes**
   - Transform 2D brain regions into 3D volumes
   - Add cross-sectional views
   - Implement slice-based visualization

3. **Environmental Factors**
   - 3D stress/support field visualization
   - Volumetric medication distribution
   - Therapy influence as 3D gradients

## Technical Considerations

### Performance Optimization

1. **Level of Detail (LOD)**
   - Reduce complexity at distance
   - Implement frustum culling
   - Use simplified shapes for far objects

2. **Rendering Efficiency**
   - Cache transformed coordinates
   - Batch similar drawing operations
   - Minimize context state changes

### User Experience

1. **Smooth Transitions**
   - Animate between 2D and 3D views
   - Provide orientation guides
   - Maintain familiar interaction patterns

2. **Accessibility**
   - Keyboard navigation for 3D space
   - Alternative 2D view always available
   - Clear depth indicators

## Integration Points

### Existing Systems Compatibility

1. **State Management** (models_ui.js:9)
   - Extend state object with 3D properties
   - Maintain backward compatibility with 2D systems

2. **Metrics and Controls**
   - All existing functionality preserved
   - 3D view enhances but doesn't replace 2D metrics

3. **Component System** (models_ui_environment.js:5-26)
   - BackgroundComponent extended with 3D capabilities
   - Layer system adapted for depth-based rendering

## Implementation Estimates

- **Phase 1**: 3D math foundation - 2 days
- **Phase 2**: Enhanced rendering - 3 days  
- **Phase 3**: Interactive controls - 2 days
- **Phase 4**: 3D visualizations - 4 days
- **Testing & optimization**: 2 days

**Total estimated effort**: 13 development days

## Risk Assessment

### Technical Risks
- **Performance**: Complex 3D calculations may impact frame rate
- **Compatibility**: Browser differences in Canvas API performance
- **Complexity**: Debugging 3D transformations more challenging

### Mitigation Strategies
- Progressive enhancement approach
- Fallback to 2D mode for performance issues
- Extensive testing on target devices/browsers

## Next Steps

1. Create 3D mathematics utility module
2. Implement basic 3D projection for single canvas
3. Test performance with existing neural network data
4. Gather user feedback on 3D interaction preferences
5. Iterate based on performance metrics and usability testing

## Success Metrics

- Maintain 60fps performance on target devices
- Preserve all existing functionality
- User preference surveys show positive reception
- No increase in cognitive load for understanding models
- Successful demonstration of depth-based neural activity visualization