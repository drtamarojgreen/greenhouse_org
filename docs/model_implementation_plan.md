# Educational Simulation: Neural Plasticity and CBT/DBT

## 1. Overview

This document defines the design and requirements for a browser-based educational simulation that visually demonstrates how CBT and DBT practice can conceptually drive neural plasticity. It covers functional scope, UI/UX, data and state, safety and consent, technical architecture, testing and QA, performance and accessibility, and deliverables for future implementation. Everything is framed as an educational simulation only, not clinical treatment.

## 2. Functional Scope

### Purpose

- Provide an interactive, visual, canvas-driven simulation that links CBT and DBT skill practice to a conceptual model of synaptic plasticity and network-level changes.
- Support education, training, and research demos for non-clinical audiences: educators, trainees, researchers, and curious members of the public.

### High-Level Features

- Two visualization modes: Network Overview and Synaptic Close-up.
- Interactive controls: practice intensity, play/pause, speed, glitch injection, reset, mode switch.
- Guided, non-therapeutic walkthroughs for selected skills modules (Cognitive Restructuring, Emotion Regulation, Distress Tolerance, Behavioral Activation, Mindfulness).
- Local scheduling for micro-practice reminders using browser `localStorage`.
- Exportable session notes with explicit consent and redaction workflow.
- Local-only state persistence by default; optional telemetry only with explicit opt-in.

### Out of Scope

- No diagnosis, clinical treatment, or medical advice.
- No external data transmission without explicit consent.
- No unattended automated clinical decision-making or integration with live EHRs.

## 3. UX and Interaction Requirements

### Landing and Consent Flow

- Landing page with title, short scope statement, and visible disclaimer: “Simulation — Educational model only. Not a substitute for clinical care.”
- Consent checkbox required: “I understand this simulation is educational only and not a substitute for clinical care.” Block any module actions until checked.
- Optional intake questionnaire with mood and stress sliders and a single binary safety question. If the user indicates active safety concerns, show referral language and stop.

### Main Canvas UI

- Canvas area sized responsively with two primary modes:
  - **Network Overview:** shows multiple neurons, connections, and a highlighted synaptic link representing conceptual weight.
  - **Synaptic Close-up:** shows pre-synaptic terminal, synaptic cleft, neurotransmitter release, and post-synaptic ion channels.
- Control panel with:
  - Practice intensity slider (0–100)
  - Speed selector (Slow / Normal / Fast)
  - Play/Pause button
  - Reset plasticity button
  - Inject network glitch toggle
  - Mode selector
- Metrics area showing Synaptic Weight, Neurotransmitters Released, Ions Crossed, and optional confidence/learning metric.
- Instructional area with short psychoeducational text linking skill practice to plasticity conceptually.
- Always-visible banner: “Simulation — not clinical therapy.”

### Guided Module UX

- For each skill module include: short psychoeducation, demonstration dialog, guided practice prompts, reflection question, optional scheduling of micro-practice.
- Require the consent sentence before starting guided practice: user types or clicks “I understand this is educational only”.
- Safety keyword scanning on free-text inputs. If triggered, display compassionate overlay and block further exercises.

### Export and Local Storage

- Export flow must show a preview and explicit consent dialog listing fields to be exported. Allow redaction of personal text before export.
- Local storage toggle and a “Clear local data” button visible in settings.

## 4. Safety, Privacy and Legal Requirements

### Safety Checks

- Keyword-based detection for self-harm, suicide, harm to others, or psychosis. Trigger an immediate safety overlay instructing user to seek professional help and halt simulated coaching. Log only local metadata about the trigger.
- Numeric risk flagging: If mood <= 2 and stress >= 8, display a caution banner recommending professional help.
- Session-level opt-out: user can stop and clear any recorded session content at any time.

### Consent and Disclaimers

- Consent must be explicit before any module use or storing of free-text responses.
- Disclaimers must appear at session start, in the UI footer, and before export.

### Data Handling

- Default: store only minimal ephemeral state locally (`practiceIntensity`, `synapticWeight`, `lastModule`, `timestamp`).
- Free-text `user_input` stored locally only and never transmitted without explicit export consent.
- Telemetry or analytics allowed only with explicit opt-in; opt-in dialog must state exact fields collected: session counts, timestamps, module choices; no PII.
- Exports require user confirmation; exported files must include the disclaimer and the prompt version.

### Legal and Ethical Constraints

- Prominently document that this is an educational simulation, not clinical care.
- Prohibit use for crisis management or automated treatment decisions.
- Keep audit trail of prompt and version, and surface “Prompt version” in UI footer.

## 5. Technical and Implementation Requirements

### Platform and Frameworks

- Browser-first, client-side application that runs offline. Prefer a modular framework: React, Preact, or Vue, but pure HTML/vanilla JS allowed for prototype.
- Use Canvas 2D API for visualization with clear separation of rendering from state updates.
- Use `localStorage` for persistence; design an abstraction layer so persistence can be replaced or mocked in tests.

### Data Models and Schemas

- **Session state schema (local):**
  - `session_id`: local-uuid
  - `consent_given`: boolean
  - `last_module`: enum
  - `practiceIntensity`: integer 0–100
  - `synapticWeight`: float
  - `events`: array of `{timestamp, action, module, note?}`
- Export JSON schema must be explicitly shown to users before exporting.

### Rendering and Simulation Model

- Simulation loop decoupled from rendering using `requestAnimationFrame`.
- Deterministic seed mode for reproducible QA fixtures.
- Simulation parameters must be tunable: `potentiationRate`, `decayRate`, `baseReleaseProb`, `glitchImpact`.
- Ensure numerical stability and clamp values to safe ranges.
- Visual layering strategy: background network, node group, close-up group, ephemeral particles.

### APIs and Integrations

- No outbound network calls by default.
- Optional mock server for demos that returns static reference texts; must not accept PII.
- If email export or external upload is later added, require separate explicit consent and server-side review.

### Security

- Sanitize and escape any free-text before display or export.
- Use secure `localStorage` patterns and provide clear instructions to users on clearing local data.
- Avoid embedding third-party analytics or fonts that leak metadata unless user consents.

## 6. Testing, QA and Acceptance Criteria

### Unit Tests and Fixtures

- **Consent gating test:** module blocked until consent checkbox checked.
- **Safety trigger test:** input containing high-risk keywords triggers safety overlay and blocks flow.
- **Export test:** export preview displayed and redaction required before writing an export file.
- **Persistence test:** saving state to `localStorage` and clearing deletes keys.
- **Reproducibility test:** deterministic seed produces same sequence of release events.

### Visual and Interaction Tests

- **Canvas rendering correctness:** overview and close-up modes render without pixel exceptions in headless browser snapshot tests.
- **Responsiveness:** UI remains usable at 320px to 1920px widths.
- **Keyboard accessibility:** play/pause, reset, and mode toggles reachable via keyboard.

### Performance

- Smooth animation at 60 FPS on typical modern browsers with simulation scale used for demo (limit particle counts).
- Simulation loop CPU usage should stay within reasonable bounds; provide a low-power mode for mobile devices.

### Accessibility

- All interactive controls reachable by keyboard.
- Provide descriptive `aria-labels` for canvas controls and non-visual summaries of visual state (`aria-live` regions for metric updates).
- Color contrast must meet WCAG AA for text and controls.
- Provide alternative static diagrams and text transcripts for users who cannot access canvas animations.

## 7. Deliverables and Artifacts for Design Hand-off

### Design Artifacts

- High-level requirements document (this file).
- UI mockups for landing page, main canvas, guided practice flow, safety overlay, export workflow.
- Interaction flow diagrams for consent, practice, safety triggers, and export.

### Technical Artifacts

- JSON schemas for session state and export payload.
- Configuration file listing tunable simulation parameters with default values and explanation.
- A minimal reference implementation plan with file structure and component boundaries for front-end developers.

### QA Artifacts

- Unit-test fixtures for safety tests and deterministic simulation outputs.
- Acceptance test checklist derived from the Testing section.

### Governance Artifacts

- Disclaimers and copy for UI and export artifacts.
- Privacy notice and telemetry opt-in text.
- Prompt change log template and UI footer copy with versioning.
