# 100 Enhancements for Environments Canvas

This document outlines 100 potential enhancements for the "Environments" canvas in the Greenhouse Mental Health model. Each item includes a description, the primary challenge involved, and a mitigation strategy.

## I. Visual Fidelity & Rendering

1.  **Dynamic Day/Night Cycle**
    *   **Description:** Simulate a 24-hour cycle where the canvas lighting changes from dawn to dusk.
    *   **Challenge:** Recalculating lighting for all elements can be performance-intensive.
    *   **Mitigation:** Use a global overlay with `compositeOperation` modes (e.g., 'multiply' for night) rather than redrawing individual assets.

2.  **Particle System Weather Effects**
    *   **Description:** Add rain, snow, or fog to represent "weathering" life events.
    *   **Challenge:** High particle counts can drop frame rates on low-end devices.
    *   **Mitigation:** Implement an object pool for particles and use instanced rendering or simple 2D sprites.

3.  **Parallax Background Scrolling**
    *   **Description:** Create depth by moving background layers slower than foreground layers when panning.
    *   **Challenge:** Requires managing multiple canvas layers or complex coordinate transforms.
    *   **Mitigation:** Use offscreen canvases for static background layers and only update their draw coordinates.

4.  **Soft Shadows for Interactive Elements**
    *   **Description:** Elements cast shadows that adjust based on a virtual light source.
    *   **Challenge:** Real-time shadow calculation is math-heavy for 2D Canvas API.
    *   **Mitigation:** Use pre-rendered shadow sprites that scale/rotate or simple `shadowBlur` property cautiously.

5.  **Animated Water/Fluid Surfaces**
    *   **Description:** Represent "flow" of neurotransmitters or emotional states with ripple effects.
    *   **Challenge:** Fluid simulation algorithms are complex.
    *   **Mitigation:** Use sine-wave distortion on a mesh or simple sprite sheet animations.

6.  **Bloom/Glow Effects for Active Synapses**
    *   **Description:** High-activity nodes glow intensely.
    *   **Challenge:** Canvas `shadowBlur` is expensive when used extensively.
    *   **Mitigation:** Render glowing elements to a low-res texture, blur it, and draw it back on top (additive blending).

7.  **Vector-Based Scalable Assets**
    *   **Description:** Replace raster icons with `Path2D` objects for perfect scaling at any zoom level.
    *   **Challenge:** Parsing and managing complex SVG paths in code.
    *   **Mitigation:** Store paths in a config file and use a utility to cache `Path2D` objects on initialization.

8.  **Procedural Texture Generation**
    *   **Description:** Generate unique patterns for brain regions or environment backgrounds so no two sessions look identical.
    *   **Challenge:** Procedural generation can slow down startup time.
    *   **Mitigation:** Generate textures once into an offscreen canvas/image bitmap and reuse.

9.  **Depth of Field Blur**
    *   **Description:** Blur background elements to focus attention on the active interaction.
    *   **Challenge:** Real-time variable blur is expensive.
    *   **Mitigation:** Pre-blur background assets or distinct layers; switch opacity rather than computing blur every frame.

10. **Custom Shaders (via WebGL)**
    *   **Description:** Migrate specific effects (like diffusion) to WebGL shaders for speed.
    *   **Challenge:** Mixing 2D Context and WebGL is complex; requires two canvases.
    *   **Mitigation:** Use a WebGL canvas as the background layer and the 2D canvas for UI/text overlay.

11. **High-DPI/Retina Display Support**
    *   **Description:** Automatically detect and scale canvas for high-resolution screens.
    *   **Challenge:** Canvas can look blurry if CSS size doesn't match pixel density.
    *   **Mitigation:** Set canvas `width`/`height` attributes to `cssWidth * devicePixelRatio` and scale the context.

12. **Color Palette Themes**
    *   **Description:** Allow users to switch between "Calm," "Vibrant," or "Accessible" color themes.
    *   **Challenge:** Hardcoded colors in drawing functions make theming difficult.
    *   **Mitigation:** Centralize all colors in a `theme` object/CSS variables and reference them during the draw call.

13. **Motion Blur for Fast Moving Objects**
    *   **Description:** Trails behind moving particles to indicate speed.
    *   **Challenge:** Storing history of positions increases memory usage.
    *   **Mitigation:** Fade the entire canvas slightly (draw semi-transparent rectangle) instead of clearing it fully each frame.

14. **Isometric Projection View**
    *   **Description:** A pseudo-3D view for the environment layout.
    *   **Challenge:** Sorting order (z-indexing) becomes critical and complex.
    *   **Mitigation:** Maintain a strictly sorted display list of entities based on their Y-coordinate.

15. **Reactive Ambient Lighting**
    *   **Description:** The overall screen tint changes based on the "mood" of the simulation.
    *   **Challenge:** Smooth transitions between colors can be tricky to time.
    *   **Mitigation:** Use CSS transitions on a canvas overlay container or interpolate color values in the animation loop.

## II. Interactivity & User Experience

16. **Drag-and-Drop Environment Factors**
    *   **Description:** Users can drag stressors or supports directly onto the brain model.
    *   **Challenge:** Hit detection and state tracking during drag operations.
    *   **Mitigation:** Implement a global "drag manager" state machine that overlays the canvas.

17. **Mouse Hover Tooltips**
    *   **Description:** Detailed info popups when hovering over specific nodes.
    *   **Challenge:** Canvas doesn't have DOM elements; requires manual coordinate checking.
    *   **Mitigation:** Use a spatial hash or quadtree to optimize hit-testing mouse coordinates.

18. **Pinch-to-Zoom**
    *   **Description:** Mobile users can zoom in on specific synaptic connections.
    *   **Challenge:** Handling multi-touch gestures and coordinate mapping.
    *   **Mitigation:** Use a library or standard math to calculate the center point and scale factor, applying `ctx.transform`.

19. **Panning the Viewport**
    *   **Description:** Click and drag to move around a larger infinite canvas.
    *   **Challenge:** Keeping track of "world" vs "screen" coordinates.
    *   **Mitigation:** Implement a camera class that manages offset and scale, transforming all draws.

20. **Context-Sensitive Right-Click Menu**
    *   **Description:** Right-click a node to see options like "Stimulate" or "Inhibit".
    *   **Challenge:** Overriding the default browser context menu and positioning a custom DOM element.
    *   **Mitigation:** Prevent default event; position an absolute HTML div based on canvas screen coordinates.

21. **Double-Click to Inspect**
    *   **Description:** Double-clicking zooms into a detailed sub-view of a component.
    *   **Challenge:** Distinguishing single vs. double clicks without lag.
    *   **Mitigation:** Set a short timer on click; if second click comes, cancel timer and trigger zoom.

22. **Keyboard Navigation of Canvas Elements**
    *   **Description:** Tab through active elements on the canvas.
    *   **Challenge:** Canvas is a black box to the focus manager.
    *   **Mitigation:** Maintain a parallel list of "focus targets" and draw a focus ring manually when active.

23. **Interactive Tutorials/overlays**
    *   **Description:** "Coach marks" that dim the background and highlight a specific canvas area.
    *   **Challenge:** Highlighting non-rectangular shapes.
    *   **Mitigation:** Use `ctx.globalCompositeOperation = 'destination-out'` to cut holes in a semi-transparent overlay layer.

24. **Undo/Redo History**
    *   **Description:** Allow users to revert changes to environment variables.
    *   **Challenge:** Storing full state snapshots can be memory heavy.
    *   **Mitigation:** Implement the Command Pattern to store only the deltas (actions) for the stack.

25. **Lasso Selection Tool**
    *   **Description:** Select multiple neurons/factors by drawing a circle around them.
    *   **Challenge:** Calculating point-in-polygon for irregular shapes.
    *   **Mitigation:** Use the Ray Casting algorithm or simplified bounding box checks for performance.

26. **Interactive Sliders within Canvas**
    *   **Description:** render sliders directly on the canvas next to objects.
    *   **Challenge:** Recreating UI controls from scratch (dragging, limits) is bug-prone.
    *   **Mitigation:** Overlay HTML range inputs positioned absolutely over the canvas, syncing their values.

27. **Object Snapping**
    *   **Description:** When dragging items, snap them to a grid or other objects.
    *   **Challenge:** calculating proximity continuously.
    *   **Mitigation:** Only check snap points when the drag ends or slows down.

28. **Ruler/Grid Toggle**
    *   **Description:** Optional background grid for measuring distances/connections.
    *   **Challenge:** Drawing many lines every frame.
    *   **Mitigation:** Draw the grid once to a static background canvas.

29. **Click-and-Hold Actions**
    *   **Description:** Holding click charges up an action (e.g., "Deep Breath").
    *   **Challenge:** Visualizing the "charge" progress.
    *   **Mitigation:** Draw a radial progress bar around the cursor during the `mousedown` state.

30. **Gesture Recognition**
    *   **Description:** Draw a "check" mark to approve changes.
    *   **Challenge:** Analyzing vector paths for shapes.
    *   **Mitigation:** Use a simple algorithm like Dollar One ($1) Unistroke Recognizer.

## III. Simulation Dynamics & Physics

31. **Spring-Based Layouts**
    *   **Description:** Nodes naturally organize themselves using force-directed graph algorithms.
    *   **Challenge:** Physics calculations (repulsion/attraction) are O(n^2).
    *   **Mitigation:** Use spatial partitioning (Barnes-Hut) or run physics in a Web Worker.

32. **Collision Detection**
    *   **Description:** Prevent elements from overlapping.
    *   **Challenge:** Accurate collision for irregular shapes.
    *   **Mitigation:** Use circular bounding volumes for quick checks before detailed polygon checks.

33. **Gravity Effects**
    *   **Description:** "Heavier" stressors sink to the bottom of the screen.
    *   **Challenge:** Constant position updates.
    *   **Mitigation:** Simple Euler integration is usually sufficient for UI physics.

34. **Inertia/Friction on Drag**
    *   **Description:** Objects slide to a stop after being thrown.
    *   **Challenge:** Tuning the feel to be natural, not slippery.
    *   **Mitigation:** Apply a decay factor (e.g., `velocity *= 0.95`) every frame.

35. **Magnetic Connections**
    *   **Description:** Related concepts attract each other when close.
    *   **Challenge:** Visual jitter if forces aren't damped.
    *   **Mitigation:** Add a threshold distance and a "snap" state to lock them once connected.

36. **Elastic Connections**
    *   **Description:** Connecting lines wobble like rubber bands.
    *   **Challenge:** Simulating multiple control points for a curve.
    *   **Mitigation:** Use Hooke's Law to calculate a control point for a Quadratic Bezier curve.

37. **Wind/Current Simulation**
    *   **Description:** Background particles flow in a specific direction.
    *   **Challenge:** Creating a vector field.
    *   **Mitigation:** Use Perlin noise to generate a flow field that particles follow.

38. **Destructible Elements**
    *   **Description:** User can "break" a negative thought pattern, shattering it.
    *   **Challenge:** Generating debris pieces.
    *   **Mitigation:** Pre-calculate Voronoi fracture patterns or just spawn generic "shard" particles.

39. **Growth Animation**
    *   **Description:** Neural pathways grow thicker over time.
    *   **Challenge:** Smoothly animating line width/length.
    *   **Mitigation:** Interpolate values over time; use `lineDash` offset for "growing" line effects.

40. **Orbital Mechanics**
    *   **Description:** Factors orbit around the central self.
    *   **Challenge:** Calculating elliptical paths.
    *   **Mitigation:** Simple trigonometry (`sin`/`cos` with time) works well for UI orbits.

41. **Bouncing Borders**
    *   **Description:** Elements contain within the canvas bounds.
    *   **Challenge:** Elements getting stuck in walls.
    *   **Mitigation:** Push element out of wall immediately upon collision detection.

42. **Time Dilation**
    *   **Description:** Ability to slow down or speed up the simulation physics.
    *   **Challenge:** Decoupling render time from physics time.
    *   **Mitigation:** Use a `deltaTime` multiplier in all physics calculations.

43. **Soft Body Dynamics**
    *   **Description:** Brain or cells squish when poked.
    *   **Challenge:** Complex mass-spring systems.
    *   **Mitigation:** Deform the sprite image using a mesh grid rather than true physics.

44. **Attractor Points**
    *   **Description:** Invisible points that guide floating elements to specific zones.
    *   **Challenge:** Balancing attraction with other forces.
    *   **Mitigation:** Give attractors a limited radius of influence.

45. **Ripple Propagation**
    *   **Description:** An event in one area sends a shockwave affecting others.
    *   **Challenge:** Determining which objects are hit by the wave.
    *   **Mitigation:** Expand a virtual circle radius and check distance to objects.

## IV. Accessibility & Inclusivity

46. **Screen Reader Live Regions**
    *   **Description:** Announce canvas changes (e.g., "Stress level increased").
    *   **Challenge:** Canvas is silent to screen readers.
    *   **Mitigation:** Update a hidden `aria-live` HTML element with text descriptions of visual events.

47. **High Contrast Mode**
    *   **Description:** Simplified black/white or yellow/black view.
    *   **Challenge:** Detecting OS preferences.
    *   **Mitigation:** Use `window.matchMedia('(prefers-contrast: more)')` to auto-switch themes.

48. **Pattern Support for Colorblindness**
    *   **Description:** Use patterns (stripes, dots) in addition to colors.
    *   **Challenge:** Drawing patterns is more complex than `fillStyle = color`.
    *   **Mitigation:** Use `ctx.createPattern()` with small pre-loaded images.

49. **Keyboard Focus Ring**
    *   **Description:** Explicit visual indicator of focus.
    *   **Challenge:** Syncing custom drawing with tab index.
    *   **Mitigation:** Global event listener for `focus` events on the container, updating a "focus coordinates" variable.

50. **Adjustable Text Size**
    *   **Description:** Canvas text scales with browser zoom or user setting.
    *   **Challenge:** Canvas text doesn't flow/wrap like HTML.
    *   **Mitigation:** Implement a simple text-wrapping function and recalculate layout on scale change.

51. **Reduced Motion Mode**
    *   **Description:** Disable animations for users with vestibular disorders.
    *   **Challenge:** Toggling all animation loops.
    *   **Mitigation:** Check `prefers-reduced-motion`; if true, skip the loop and just `draw()` the final state.

52. **Audio Feedback (Sonification)**
    *   **Description:** Sound effects for interactions (ticks, hums).
    *   **Challenge:** preventing audio overlap/cacophony.
    *   **Mitigation:** Use the Web Audio API with a limiter/compressor node.

53. **Text Descriptions for Export**
    *   **Description:** When saving an image, also save a text description.
    *   **Challenge:** Generating natural language from state.
    *   **Mitigation:** Create a template system that fills in blanks based on simulation variables.

54. **Input Method Agnosticism**
    *   **Description:** Works equally well with touch, mouse, and pen.
    *   **Challenge:** Pointer events API helps, but gestures differ.
    *   **Mitigation:** Standardize on Pointer Events API (`pointerdown`, `pointermove`) instead of mouse/touch specific ones.

55. **Voice Control Integration**
    *   **Description:** "Increase Stress" command triggers canvas action.
    *   **Challenge:** Parsing speech.
    *   **Mitigation:** Use the Web Speech API to trigger existing public methods on the model.

## V. Performance & Optimization

56. **Offscreen Canvas Rendering**
    *   **Description:** Render complex static backgrounds once to memory.
    *   **Challenge:** Managing memory usage of multiple canvases.
    *   **Mitigation:** Only use for layers that change infrequently.

57. **Spatial Partitioning (Quadtree)**
    *   **Description:** Optimize collision and hit detection.
    *   **Challenge:** Overhead of rebuilding the tree when objects move.
    *   **Mitigation:** Rebuild only when total velocity of system > threshold, or use a loose quadtree.

58. **Dirty Rectangle Rendering**
    *   **Description:** Only redraw the part of the screen that changed.
    *   **Challenge:** Tracking bounds of changed areas is complex.
    *   **Mitigation:** Useful for specific UI updates (like a blinking cursor); maybe overkill for full simulation.

59. **Web Worker Physics**
    *   **Description:** Run simulation logic in a separate thread.
    *   **Challenge:** Data serialization between worker and main thread.
    *   **Mitigation:** Use `SharedArrayBuffer` if supported, or transferable objects.

60. **Sprite Atlases**
    *   **Description:** Combine all icons into one image to reduce draw calls/context switches.
    *   **Challenge:** managing texture coordinates.
    *   **Mitigation:** Standard game dev practice; use a JSON map of coordinates.

61. **Throttled Event Listeners**
    *   **Description:** Don't fire `mousemove` logic every pixel.
    *   **Challenge:** Input lag if throttled too much.
    *   **Mitigation:** Use `requestAnimationFrame` to debounce visual updates rather than `setTimeout`.

62. **Integer Coordinates**
    *   **Description:** Round coordinates to integers before drawing.
    *   **Challenge:** Jittery slow movement.
    *   **Mitigation:** Keep float positions for physics, round only for the `drawImage` call (avoids sub-pixel anti-aliasing overhead).

63. **Layered Canvases**
    *   **Description:** Stack 3 HTML canvas elements (BG, Actors, UI).
    *   **Challenge:** DOM alignment and event bubbling.
    *   **Mitigation:** Use CSS Grid to stack them perfectly; pass events through the top layer using `pointer-events: none` on overlays if needed.

64. **Object Pooling**
    *   **Description:** Reuse particle objects instead of `new` and garbage collection.
    *   **Challenge:** Managing the "alive/dead" state.
    *   **Mitigation:** Maintain a fixed-size array and an index pointer.

65. **Asset Preloading**
    *   **Description:** Ensure all images/fonts are ready before first draw.
    *   **Challenge:** UX of loading screens.
    *   **Mitigation:** Show a simple CSS spinner while `Promise.all` awaits asset loads.

## VI. Educational Features

66. **Annotation Mode**
    *   **Description:** Allow users to draw pen markings over the simulation.
    *   **Challenge:** Saving vector strokes vs raster pixels.
    *   **Mitigation:** Store points in arrays and draw using `moveTo`/`lineTo` on a separate overlay canvas.

67. **Snapshot Comparison**
    *   **Description:** Split screen showing "Before" and "After" states.
    *   **Challenge:** Rendering two instances of the simulation.
    *   **Mitigation:** Render the "Before" state to an image and display it alongside the live canvas.

68. **Slow-Motion Replay**
    *   **Description:** Replay the last 10 seconds of interaction.
    *   **Challenge:** Recording state every frame is memory intensive.
    *   **Mitigation:** Record inputs only (deterministic replay) or keyframes every 1 second.

69. **Guided Tours**
    *   **Description:** Auto-play a sequence of actions to demonstrate concepts.
    *   **Challenge:** Scripting the sequence.
    *   **Mitigation:** Implement a command queue that the simulation loop consumes.

70. **Concept Labels / Legends**
    *   **Description:** Dynamic lines connecting elements to side-panel text.
    *   **Challenge:** Lines crossing/cluttering.
    *   **Mitigation:** Simple force-directed placement for labels to avoid overlap.

71. **Quiz Mode**
    *   **Description:** Canvas asks "Click the Amygdala" and validates input.
    *   **Challenge:** State management for the quiz logic.
    *   **Mitigation:** Overlay a "Quiz Manager" class that intercepts clicks.

72. **Reference Overlay**
    *   **Description:** Semi-transparent anatomical diagram overlay.
    *   **Challenge:** Aligning the diagram with the abstract model.
    *   **Mitigation:** Allow user to adjust opacity and scale of the reference image.

73. **Interactive Graph Overlay**
    *   **Description:** Line graph of metrics overlaid on the simulation.
    *   **Challenge:** clutter.
    *   **Mitigation:** Make it a toggleable "Heads Up Display" (HUD).

74. **Glossary Integration**
    *   **Description:** Clicking a term opens a definition within the canvas.
    *   **Challenge:** Text rendering layout.
    *   **Mitigation:** Render a simple HTML modal positioned over the canvas.

75. **Scenario Presets**
    *   **Description:** Quick-load "Panic Attack" or "Depressive Episode" states.
    *   **Challenge:** Defining the variables for complex states.
    *   **Mitigation:** JSON configuration files for each scenario.

76. **Visual Analogies**
    *   **Description:** Toggle between "Brain View" and "Garden View" (metaphor).
    *   **Challenge:** Mapping 1:1 between modes.
    *   **Mitigation:** Ensure underlying data structure allows multiple "Views" (Observer pattern).

77. **Progress Milestones**
    *   **Description:** Confetti or visual reward when a healthy state is reached.
    *   **Challenge:** Timing the reward.
    *   **Mitigation:** Simple particle system (confetti) triggered by metric thresholds.

78. **Heatmap View**
    *   **Description:** Show areas of highest activity/stress as color blobs.
    *   **Challenge:** Generating the gradient map.
    *   **Mitigation:** Draw radial gradients with low alpha for each active point, then boost contrast.

79. **Path Tracing**
    *   **Description:** Visualize the path a signal takes through the network.
    *   **Challenge:** Speed of signal vs visual perception.
    *   **Mitigation:** Artificially slow down the "packet" for visual clarity.

80. **"What If" Mode**
    *   **Description:** Ghost overlay showing predicted future state.
    *   **Challenge:** Running a simulation inside a simulation.
    *   **Mitigation:** Run a simplified model for the prediction to save cycles.

## VII. Data Integration & Analytics

81. **Real-Time Data Feed**
    *   **Description:** Visualize data from an external API (e.g., wearable mock).
    *   **Challenge:** Handling network latency/jitter.
    *   **Mitigation:** Buffer data and interpolate (smooth) changes over time.

82. **Export to PNG/SVG**
    *   **Description:** User can download their model.
    *   **Challenge:** High resolution export.
    *   **Mitigation:** Temporarily resize canvas, redraw, export `toDataURL`, then restore.

83. **Import JSON Configuration**
    *   **Description:** Load a saved state.
    *   **Challenge:** Validating the JSON schema.
    *   **Mitigation:** Strict schema validation before applying state to prevent crashes.

84. **Session Recording**
    *   **Description:** Export a video file of the interaction.
    *   **Challenge:** Browser support for `MediaRecorder` on Canvas.
    *   **Mitigation:** Use `canvas.captureStream()` and `MediaRecorder` API.

85. **Heatmap Analytics (User behavior)**
    *   **Description:** Track where users click most often.
    *   **Challenge:** Privacy and data storage.
    *   **Mitigation:** Store locally or aggregate anonymously; visualize on a debug layer.

86. **Parameter History Graph**
    *   **Description:** Small sparklines next to nodes showing history.
    *   **Challenge:** Drawing many small graphs.
    *   **Mitigation:** Draw only when hovered or selected.

87. **Cross-Tab Synchronization**
    *   **Description:** Changes in one tab update the canvas in another.
    *   **Challenge:** State sync.
    *   **Mitigation:** Use `BroadcastChannel` API.

88. **Local Storage Auto-Save**
    *   **Description:** Restore state on refresh.
    *   **Challenge:** storage limits.
    *   **Mitigation:** Save only essential parameters, not full object graphs.

89. **Diff Visualization**
    *   **Description:** Highlight what changed since the last save.
    *   **Challenge:** Calculating diffs visually.
    *   **Mitigation:** Overlay a color tint on changed nodes until acknowledged.

90. **Print-Friendly Mode**
    *   **Description:** B&W high-contrast view for printing.
    *   **Challenge:** CSS `@media print` doesn't affect canvas content.
    *   **Mitigation:** Listen for `beforeprint` event, redraw canvas in B&W, then restore on `afterprint`.

## VIII. System Architecture & Maintainability

91. **Component-Based Architecture**
    *   **Description:** Each visual element is a class with `update()` and `draw()`.
    *   **Challenge:** Performance overhead of function calls.
    *   **Mitigation:** Acceptable for < 1000 objects; maintains clean code.

92. **Debug Overlay**
    *   **Description:** Toggle hitboxes, FPS counter, and state values.
    *   **Challenge:** Cluttering production code.
    *   **Mitigation:** Wrap in `if (DEBUG)` blocks that can be stripped by build tools.

93. **Automated Visual Regression Testing**
    *   **Description:** Ensure code changes don't break rendering.
    *   **Challenge:** Canvas has no DOM to query.
    *   **Mitigation:** Use Playwright/Puppeteer to screenshot canvas and diff against baseline.

94. **Canvas State Machine**
    *   **Description:** Formal FSM for interactions (Idle, Dragging, Pan, Zoom).
    *   **Challenge:** Complexity of transitions.
    *   **Mitigation:** Use a strict state pattern to prevent "dragging while zooming" bugs.

95. **Dependency Injection for Drawing Context**
    *   **Description:** Pass `ctx` to functions rather than using global.
    *   **Challenge:** Propagating arguments deep down.
    *   **Mitigation:** Cleanest for testing; allows rendering to offscreen contexts easily.

96. **Error Boundary for Render Loop**
    *   **Description:** If `draw()` crashes, don't freeze the browser.
    *   **Challenge:** `requestAnimationFrame` keeps firing.
    *   **Mitigation:** Wrap the loop in `try/catch`; on error, cancel animation frame and show error message.

97. **Configurable Render Quality**
    *   **Description:** Auto-downgrade effects if FPS drops.
    *   **Challenge:** Detecting FPS trends reliability.
    *   **Mitigation:** Monitor average `deltaTime`; if > 33ms (30fps) consistently, disable heavy effects.

98. **Event Delegation System**
    *   **Description:** One event listener on Canvas delegating to internal objects.
    *   **Challenge:** Efficiently finding the target.
    *   **Mitigation:** Reverse iteration through the render list (top-most items first).

99. **Mock Data Generator**
    *   **Description:** Tools to populate the canvas with random valid data for stress testing.
    *   **Challenge:** Generating realistic topology.
    *   **Mitigation:** Create utility functions specifically for dev mode.

100. **Documentation Generator**
    *   **Description:** Auto-generate docs from code comments for the canvas API.
    *   **Challenge:** Standard tools (JSDoc) work well but need setup.
    *   **Mitigation:** Enforce JSDoc standards on all drawing classes.
