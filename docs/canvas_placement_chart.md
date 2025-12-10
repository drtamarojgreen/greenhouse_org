# Canvas Placement Chart

This chart defines the coordinate mapping for the `GreenhouseModelsUIEnvironment`.

**Logical Coordinate System**: 1536 (width) x 1024 (height)
**Center Point**: (768, 512)

| Item | Target X | Target Y | Current X | Current Y | Location Logic Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tree Trunk Base** | `768` | `1024` | `width / 2` | `height` | Rooted at the bottom center of the logical space. |
| **Community Center** | `768` | `512` | `width / 2` | `height / 2` | Centered in the logical space. Radius fixed to `480`. |
| **Brain Center** | `768` | `512` | `width / 2` | `height / 2` | Centered in the logical space. |
| **Medication: Anti-depressants** | `600` | `850` | `600` | `850` | Left side, lower branch level. |
| **Medication: SSRIs** | `520` | `750` | `520` | `750` | Left side, mid branch level. |
| **Medication: SSNIs** | `620` | `680` | `620` | `680` | Left side, upper branch level. |
| **Therapy: CBT** | `936` | `850` | `936` | `850` | Right side, lower branch level. |
| **Therapy: DBT** | `1016` | `750` | `1016` | `750` | Right side, mid branch level. |
| **Therapy: Psychodynamic** | `916` | `680` | `916` | `680` | Right side, upper branch level. |
| **Therapy: Mode Deactivation** | `1000` | `600` | `1000` | `600` | Right side, top branch level. |
| **Therapy: Schema** | `950` | `550` | `950` | `550` | Right side, top-inner branch level. |
| **Therapy: ACT** | `1050` | `650` | `1050` | `650` | Right side, top-outer branch level. |
| **Society Lines** | `0` to `1536` | `0` to `1024` | `0` to `width` | `0` to `height` | Vertical lines spanning the full logical width. |
| **Genomes (Helix 1)** | `307` | `307` | `width * 0.2` | `height * 0.3` | 20% width, 30% height. |
| **Genomes (Helix 2)** | `537` | `307` | `width * 0.35` | `height * 0.3` | 35% width, 30% height. |
| **Genomes (Helix 3)** | `768` | `307` | `width * 0.5` | `height * 0.3` | 50% width, 30% height. |
| **Genomes (Helix 4)** | `998` | `307` | `width * 0.65` | `height * 0.3` | 65% width, 30% height. |
| **Genomes (Helix 5)** | `1228` | `307` | `width * 0.8` | `height * 0.3` | 80% width, 30% height. |

## Key Changes
1.  **Unification**: Currently, "Current X/Y" for the Tree and Community are dynamic (`width / 2`), while Medication/Therapy are fixed numbers. This causes misalignment when the screen is not exactly 1536x1024.
2.  **Target State**: By forcing ALL items to use the "Target X/Y" (Logical Coordinates) and applying a single global transform, we ensure that `(600, 850)` on the Tree is *always* exactly where the Anti-depressant pill is drawn, regardless of screen size.
