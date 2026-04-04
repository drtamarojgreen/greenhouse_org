# Scene 3: Dialogue Pipeline

This module provides a reusable pipeline for creating dialogue-heavy scenes in Blender.

## Key Features
- Character blocking and eye-line alignment.
- Automated chroma green background setup.
- Scene-specific rendering presets and outputs.
- Behavior testing suite.

## Usage
To setup a dialogue scene:
```python
from scripts.blender.movie._3.dialogue_scene import build_scene3_dialogue
build_scene3_dialogue()
```

To render:
```python
from scripts.blender.movie._3.renderer_dialogue import render_scene3_dialogue
render_scene3_dialogue(mode="preview")
```

## Testing
Run tests via:
```bash
blender --background --python scripts/blender/movie/3/tests/run_all.py
```
