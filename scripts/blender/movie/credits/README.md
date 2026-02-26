# GreenhouseMD Cinematic Credits System

This directory contains the automation scripts for generating and rendering the cinematic credits for Greenhouse for Mental Health Development video productions.

## 🎬 Project Overview

The system is divided into two main segments:
1.  **Opening Header**: A high-impact opening sequence featuring studio branding and the film title.
2.  **Final Credits**: A professional scrolling credit list featuring the cast, crew, and legal notices.

## 🛠️ Components

### Core Components
- `config.yaml`: The central source of truth for all production settings (text, colors, positions, effects).
- `config_loader.py`: Handles parsing and validation of the production configuration.
- `mlt_utils.py`: Modular library for structured MLT XML generation.

### Generation Scripts
- `generate_header.py`: Generates `header.kdenlive` opening sequence using modular components.
- `generate_final_credits.py`: Generates `final_credits.kdenlive` scrolling credits using modular components.

### Rendering Engine
- `render_credits.py`: Automated rendering engine that converts XML projects into high-quality MP4 files using MELT.

## 🚀 Execution

### 1. Generate XML Projects
To generate the project files without rendering:
```bash
python3 generate_header.py
python3 generate_final_credits.py
```
Outputs will be saved to the `output/` directory.

### 2. Render Videos
To render the projects into MP4 videos:
```bash
python3 render_credits.py --segment all
```
*Note: This requires MLT (melt) and xvfb-run to be installed on the system.*

## 🧪 Testing & Quality Assurance

We maintain a rigorous testing suite to ensure cinematic quality, accessibility compliance, and technical stability.

### Running Tests
Execute the full suite from the project root:
```bash
python3 -m unittest discover scripts/blender/movie/credits/tests/
```

### What is verified?
- **XML Structure**: Ensures MLT compatibility and project integrity.
- **Cinematic Effects**: Verifies the presence and configuration of `frei0r.glow`, `frei0r.film`, and transition tracks.
- **Accessibility**: Calculates contrast ratios to ensure 4.5:1 compliance (WCAG 2.1 AA).
- **Visibility & Layout**: Confirms all text appears on-screen and follows alignment rules.
- **Config Variation**: Uses mocking to ensure the generation logic is robust against changes in titles, colors, durations, and cast lists.
- **System Compatibility**: Checks for the availability of required MLT plugins on the host system.

### Technical Reports
Running the tests automatically generates detailed reports in `output/`:
- `header_report.txt`
- `credits_report.txt`

These reports provide an audit trail of text placement, animation keyframes, coloring, and visibility status.

## 📋 Requirements
- **Python 3.8+**
- **MLT (melt)**: Required for rendering.
- **xvfb-run**: Required for headless rendering of Kdenlive titles.
- **Pango**: Required for high-quality text rendering in the header.
