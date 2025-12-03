# Canvas Model Enhancements

This document outlines 50 specific enhancements and variations for the Greenhouse Canvas Models to be tested via the CanvasML pipeline.

1. **Default Baseline**: The standard configuration with balanced icons and labels.
2. **Minimalist**: A stripped-down version with only essential elements (3 icons, 1 label).
3. **Icon Heavy**: A variation with double the standard number of icons.
4. **Label Heavy**: A variation with double the standard number of text labels.
5. **High Density**: A stress test with 20 icons and 10 labels packed into the canvas.
6. **Low Density**: A sparse layout with elements spread far apart.
7. **Text Only**: All icons removed, relying solely on text labels for information.
8. **Visual Only**: All text labels removed, relying solely on iconography.
9. **Large Icons**: Icon scale increased by 200%.
10. **Small Icons**: Icon scale decreased to 50%.
11. **Large Text**: Font size increased to 72px for all labels.
12. **Small Text**: Font size decreased to 12px for all labels.
13. **Central Cluster**: All elements positioned within the center 50% of the canvas.
14. **Perimeter Cluster**: All elements positioned around the edges of the canvas.
15. **Grid Layout**: Elements aligned to a strict 4x4 grid.
16. **Monochromatic Blue**: All icons and text use shades of blue.
17. **Monochromatic Red**: All icons and text use shades of red.
18. **High Contrast**: Black background (simulated via CSS or dark elements) with white icons/text.
19. **Transparent Overlay**: All element alpha channels set to 0.3 to test transparency rendering.
20. **Pastel Theme**: Uses a soft pastel color palette.
21. **Dark Mode**: Dark grey elements on standard background (simulating dark mode compatibility).
22. **Overlapping Elements**: Intentionally overlapping icons to test occlusion handling.
23. **Disconnected Elements**: Elements placed with maximum distance between them.
24. **Linear Flow**: Elements arranged in a horizontal line.
25. **Random Scatter**: Elements completely randomized in position and scale.
26. **Accessibility Deuteranopia**: Color palette optimized for Red-Green color blindness.
27. **Accessibility Protanopia**: Color palette optimized for Protanopia (Red weak).
28. **Accessibility Tritanopia**: Color palette optimized for Blue-Yellow color blindness.
29. **Senior Friendly**: Large text (48px+) and high contrast icons for elderly users.
30. **Child Friendly**: Bright primary colors and simplified icons (scales increased).
31. **Stress Heatmap**: High concentration of red/orange icons in the "Stress" quadrant (Top Left).
32. **Support Network Radial**: Icons arranged in a circle around a central "Self" icon.
33. **Growth Spiral**: Icons arranged in a golden spiral pattern originating from center.
34. **Timeline View**: Icons arranged linearly from left (Past) to right (Future).
35. **Hierarchy Pyramid**: Icons arranged in a triangle/pyramid structure (Maslow's hierarchy).
36. **Balanced Ecology**: Equal distribution of Green (Nature), Blue (Community), and Orange (Self) icons.
37. **Urban Environment**: Grey scale icons with sharp geometric arrangements.
38. **Rural Environment**: Organic spacing with dominance of green hues.
39. **Night Shift**: Low brightness colors (blue light reduction) simulation.
40. **High Anxiety State**: chaotic, overlapping, high-frequency jitter in positions (simulated by slight offsets).
41. **Calm State**: Symmetrical, balanced, pastel blue/green palette.
42. **Information Overload**: Maximum text density (20 labels) with minimal iconography.
43. **Symbolic Abstract**: Icons replaced with simple geometric shapes (circles, squares) via path data modification.
44. **Connective Tissue**: All icons linked by proximity (clusters of 3).
45. **Isolation Mode**: Single central icon, all others pushed to extreme corners.
46. **Community Focus**: Large cluster of "Community" icons (Green) in the center.
47. **Self-Reflection**: "Personal Growth" labels and icons enlarged and centered.
48. **External Factors**: "Environmental Stress" and "Society" icons enlarged and surrounding the center.
49. **Legacy Mode**: Simulating older resolution (low scale, crowded).
50. **Future Tech**: Neon colors (Cyan, Magenta) on dark background (Cyberpunk aesthetic).
This document lists 25 proposed visual enhancements for the Greenhouse Mental Health models visualizations. These enhancements are designed to improve aesthetic appeal, user engagement, and information conveyance.

## Brain Model Enhancements

1.  **Rainbow Activation**: Use HSL color cycling for neuron activation to represent different signal frequencies.
2.  **Hexagonal Grid**: Replace the square background grid with a hexagonal pattern for a more organic/scientific look.
3.  **Neon Mode**: Increase glow intensity and contrast for a "Cyberpunk" aesthetic.
4.  **Starry Background**: Add random static stars in dark mode for a deep space effect.
5.  **Pulse Wave**: Implement a global transparency pulse to simulate living tissue breathing.
6.  **Node Halos**: Draw multiple concentric rings around highly active nodes to visualize intensity zones.

## Synapse Model Enhancements

7.  **Bouncing Particles**: Neurotransmitters bounce off the synaptic cleft walls instead of disappearing.
8.  **Trail Effect**: Add fading trails to neurotransmitter particles to visualize flow direction.
9.  **Receptor Blink**: Receptors flash white briefly when they bind to a neurotransmitter.
10. **Gradient Background**: Replace flat background color with a vertical gradient (Darker at bottom).
11. **Particle Explosion**: Release particles in a burst pattern rather than a stream.
12. **Vesicle Wobble**: Animate vesicle shape to appear gelatinous/wobbly.
13. **ZigZag Path**: Add horizontal sine wave motion to falling particles.

## Environment Model Enhancements

14. **Day/Night Cycle**: Change sky color based on a simulated time of day.
15. **Rain Effect**: Overlay falling rain streaks for "Environmental Stress" visualization.
16. **Clouds**: Add moving cloud shapes to the background.
17. **Grass Texture**: Add procedural grass blades at the bottom of the viewport.
18. **Sun Rays**: Draw semi-transparent rays emanating from the top-left corner.
19. **Icon Bobbing**: Make static icons gently bob up and down.
20. **Vignette**: Add a dark vignette around the edges to focus attention on the center.
21. **Sepia Tone**: Apply a brownish tint for a "Nostalgic" or "Past Trauma" mode.
22. **Glitch Effect**: Randomly offset horizontal slices of the canvas to simulate anxiety/instability.
23. **Spotlight**: Darken the screen except for a circular area in the center.
24. **Paper Texture**: Add noise/grain to look like a drawing on paper.
25. **Blueprint Mode**: Change background to Blueprint Blue and lines to White.
