# Blender Brain Animation Suite

## 1. Overview

This directory contains a suite of Python scripts designed to be run within Blender (version 2.80 or newer) to generate a variety of animations and visual effects for the included `brain.fbx` 3D model.

The suite is modular, allowing for easy extension and customization of camera movements, materials, and render jobs.

## 2. File Descriptions

### Python Modules

-   `camera_animations.py`
    A library of functions that define and apply various camera movements.
    - `setup_camera_focus`: Locks the camera to track a target object.
    - `create_turntable_animation`: Orbits the camera around a target.
    - `create_yaw_animation`: Pans the camera left/right.
    - `create_pitch_animation`: Tilts the camera up/down.
    - `create_dolly_animation`: Moves the camera physically closer/further.
    - `create_zoom_animation`: Simulates a zoom by changing focal length.

-   `visual_effects.py`
    A library for applying materials and visual styles to the brain model.
    - `apply_procedural_texture`: Applies a noise-based procedural material.
    - `create_wireframe_overlay`: Adds a wireframe modifier and material.
    - `apply_glowing_material`: applies an emissive, glowing shader.

-   `brain_model.py`
    Fetches JSON data from the project's endpoints (`models_brain.json`, `models_synapses.json`) and constructs 3D Blender meshes for brain regions and synapses. It handles:
    - Downloading data from the configured URLs.
    - Creating polygon meshes from vertex data.
    - creating and assigning materials based on fill styles.

-   `environment_model.py`
    Similar to `brain_model.py`, this script fetches `models_environment.json` to generate 3D representations of environmental elements associated with the brain model.

-   `render_suite.py`
    The master Python script used to execute the rendering process inside Blender. It imports the modules for camera and visual effects, sets up the scene, and defines specific "render jobs":
    - `run_job_turntable_procedural`: Standard turntable with procedural texture.
    - `run_job_zoom_glow`: Dolly zoom effect with glowing material.
    - `run_job_wireframe_flyover`: Flyover camera move with wireframe style.
    - `run_all_jobs`: Sequentially runs all defined jobs.

### Diagnostics and Optimization (`diagnostics/`)

A dedicated directory for system checks, configuration verification, and scene optimization tools:
- **System Checks**: `check_ffmpeg.py`, `check_opengl.py`, `diag_gpu_info.py`.
- **Diagnostics**: `diagnose_scene.py`, `diagnose_material.py`, `diagnose_roi.py`.
- **Optimizations**: `optimize_mesh.py`, `optimize_textures.py`, `optimize_animation.py`, `auto_decimate.py`.
- **Feature Tests**: All `test_*.py` files for verifying specific animation components.

### Shell Scripts

-   `run_blender_job.sh`
    The master execution script. It handles calling the Blender executable in background mode and passing the python script `render_suite.py` to it. It takes a job name as an argument (e.g., `turntable_procedural`, `all`).

-   `render_turntable_procedural.sh`
    A specific wrapper script that runs the `turntable_procedural` job.

-   `render_zoom_glow.sh`
    A specific wrapper script that runs the `zoom_glow` job.

-   `render_wireframe_flyover.sh`
    A specific wrapper script that runs the `wireframe_flyover` job.

-   `render_all.sh`
    A specific wrapper script that runs `all` jobs sequentially.

-   `render_disorder_highlight.sh`
    A master orchestration script for rendering animations related to specific mental health disorders. It takes a configuration file (e.g., `disorder_configs/depression.conf`) as input, parses the regions to highlight, and iteratively runs Blender jobs for each region.

-   `run_blender_region_job.sh`
    A worker script used by `render_disorder_highlight.sh`. It executes a single Blender instance to render a specific "region highlight" job for a given region name and label text.

### Configuration Files

-   `disorder_configs/`
    This directory contains `.conf` files that define which brain regions are relevant to specific disorders.
    -   Format: Bash-sourceable files defining variables like `DISORDER_NAME` and `REGIONS` (a comma-separated list of `RegionName|LabelText` pairs).
    -   Example (`depression.conf`): `REGIONS="Hippocampus|Memory Processing,Amygdala|Emotional Response"`

### Assets

-   `brain.fbx`
    The core 3D model of the human brain used in all animations.

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

**4. Rendering Disorder Highlights:**

To render a batch of animations highlighting regions associated with a disorder:

1.  Ensure a configuration file exists in `disorder_configs/` (e.g., `depression.conf`).
2.  Run the master script with the config path:
    ```bash
    ./render_disorder_highlight.sh disorder_configs/depression.conf
    ```
3.  The script will generate individual video files for each region (e.g., `depression_hippocampus.mkv`, `depression_amygdala.mkv`) in the `render_outputs/` directory.

### Monitoring and Output

-   **Progress**: Render progress will be printed directly to your terminal window.
-   **Output Files**: The rendered MP4 video files will be saved in subdirectories within `scripts/blender/render_outputs/`. For example, the turntable animation will be located in `render_outputs/turntable_procedural/`.

## 5. Related Python Processing Scripts

The `brain.fbx` model is also used by a GNN (Graph Neural Network) pipeline located in `scripts/python/`. These scripts handle the conversion of the 3D model into graph data for analysis and inference.

-   `../python/preprocess_mesh.py`
    Loads `brain.fbx`, extracts vertices, faces, and computes features (normals, curvature). The data is saved as NumPy arrays (`.npy`) for training or further analysis.

-   `../python/inference.py`
    Loads `brain.fbx` to generate a graph structure and uses a trained GNN model to predict functional brain regions on the mesh, outputting the results as a JSON file.

## 6. Performance & Resource Estimates

### Data Requirements
-   **Downloads**: None. All necessary 3D assets (`brain.fbx`) are included in the repository (~8 MB).
-   **Generated Data**:
    -   Render Output: ~10-50 MB per video file.
    -   Intermediate Graph Data: ~10-20 MB (NumPy arrays).

### Execution Time Estimates
*(Estimates based on a standard CPU-based workstation. Times will vary significantly with hardware.)*

-   **Python Preprocessing**: ~1-2 minutes
    -   Parsing a ~8MB FBX file and computing curvature on a dense mesh is computationally intensive.
-   **Blender Rendering (Eevee Engine, 720p 24fps)**:
    -   `turntable_procedural` (120 frames): ~5-10 minutes
    -   `zoom_glow` (90 frames): ~4-8 minutes
    -   `wireframe_flyover` (150 frames): ~6-12 minutes
    -   **Total Suite**: ~15-30 minutes
