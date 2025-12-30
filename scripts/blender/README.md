# Blender Brain Animation Suite

## 1. Overview

This directory contains a suite of Python scripts designed to be run within Blender (version 2.80 or newer) to generate a variety of animations and visual effects for the included `brain.fbx` 3D model.

The suite is modular, allowing for easy extension and customization of camera movements, materials, and render jobs.

## 2. File Descriptions

-   `brain.fbx`
    The core 3D model of the human brain used in all animations.

-   `camera_animations.py`
    A library of functions that define and apply various camera movements. This includes turntable rotations, dolly zooms, and flyovers. Each function is designed to create keyframes over a specified duration.

-   `visual_effects.py`
    A library for applying materials and visual styles to the brain model. This includes functions for creating procedural textures (e.g., noise-based materials), glowing emission shaders, and wireframe overlays.

-   `render_suite.py`
    This is the master script used to execute the rendering process. It imports the modules for camera and visual effects, sets up the scene, and runs a series of predefined "render jobs." Each job combines a specific animation with a specific visual effect and renders it out.

## 3. Output Format (MP4 Video)

**No conversion is necessary.** The `render_suite.py` script is pre-configured to render all animations directly into video files using Blender's built-in FFMPEG encoder.

-   **Format**: MPEG-4 (`.mp4`)
-   **Resolution**: 1280x720
-   **Frame Rate**: 24 FPS

The output files will be saved in a new directory created at `scripts/blender/render_outputs/`. Each render job will have its own subfolder (e.g., `turntable_procedural/`, `zoom_glow/`).

## 4. How to Run the Animation Suite

To generate the animations, follow these steps:

1.  **Open Blender**: Launch Blender (version 2.80 or higher is recommended).
2.  **Navigate to Scripting Workspace**: At the top of the Blender window, click on the **Scripting** tab to change to the scripting layout.
3.  **Open the Master Script**: In the Text Editor panel (usually on the left), click the **Open** button. Navigate to this directory (`scripts/blender/`) and select the `render_suite.py` file.
4.  **Run the Script**: With the `render_suite.py` script loaded, click the **Run Script** button (it looks like a play icon) in the header of the Text Editor.
5.  **Monitor Progress**: You can monitor the rendering progress in the Blender Render window that appears. The console (which can be opened via `Window > Toggle System Console`) will print status messages for each job.
6.  **Find the Output**: Once the script finishes, navigate to the `scripts/blender/render_outputs/` directory to find the rendered MP4 video files.
