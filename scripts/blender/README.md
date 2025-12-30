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

This suite is designed to be run from the command line, which allows for automation and batch rendering without opening the Blender user interface.

### Prerequisites

-   **Blender**: Blender (version 2.80 or newer) must be installed.
-   **Command Line Access**: The `blender` command must be available in your system's PATH. If it's not, you can edit the `BLENDER_CMD` variable in `run_blender_job.sh` to point to the full path of the Blender executable.

### Using the Render Scripts

A suite of bash scripts is provided for convenience. Open your terminal, navigate to the `scripts/blender/` directory, and execute your desired script.

**1. To Run a Specific Animation Job:**

Use the individual scripts for each job. They are the simplest way to get started.

-   Render the turntable animation with a procedural texture:
    ```bash
    ./render_turntable_procedural.sh
    ```
-   Render the dolly zoom animation with a glowing material:
    ```bash
    ./render_zoom_glow.sh
    ```
-   Render the wireframe flyover animation:
    ```bash
    ./render_wireframe_flyover.sh
    ```

**2. To Run All Jobs Sequentially:**

A script is provided to render every animation, one after another.

-   Render all available jobs:
    ```bash
    ./render_all.sh
    ```

**3. Advanced Usage (Master Script):**

The individual scripts are wrappers around the master `run_blender_job.sh` script. You can use it directly to run any available job by passing the job name as an argument.

-   General usage:
    ```bash
    ./run_blender_job.sh <job_name>
    ```
-   Example (running the zoom_glow job):
    ```bash
    ./run_blender_job.sh zoom_glow
    ```
-   Available job names: `turntable_procedural`, `zoom_glow`, `wireframe_flyover`, `all`.

### Monitoring and Output

-   **Progress**: Render progress will be printed directly to your terminal window.
-   **Output Files**: The rendered MP4 video files will be saved in subdirectories within `scripts/blender/render_outputs/`. For example, the turntable animation will be located in `render_outputs/turntable_procedural/`.
