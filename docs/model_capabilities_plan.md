# Educational Simulation - Capabilities and Enhancements Plan

## 1. Core Capabilities

This document outlines the core functional capabilities of the Neural Plasticity Educational Simulation, as defined in the primary implementation plan. It also explores potential future enhancements to expand its educational and interactive scope.

### 1.1. Purpose and Scope
The simulation's primary purpose is to provide an interactive, visual, and educational tool demonstrating the conceptual link between Cognitive Behavioral Therapy (CBT) and Dialectical Behavior Therapy (DBT) skill practice and the principles of neural plasticity. It is designed for a non-clinical audience, including students, trainees, and the general public.

**Crucially, the simulation is not a clinical tool.** It does not provide diagnosis, treatment, or medical advice and operates under a strict, consent-driven, and safety-oriented framework.

### 1.2. Key Functional Capabilities
- **Dual Visualization Modes:** The user can switch between a high-level **Network Overview** showing multiple conceptual neurons and a **Synaptic Close-up** that visualizes the mechanics of a single connection.
- **Interactive Simulation Controls:** Users can directly influence the simulation through a control panel, with options for `Practice Intensity`, `Play/Pause`, `Speed`, `Glitch Injection`, and `Reset`.
- **Guided Educational Modules:** The application provides structured, non-therapeutic walkthroughs for core skills like Cognitive Restructuring and Mindfulness, combining psychoeducation with interactive prompts.
- **Privacy-First Data Handling:** All user-entered data and session state are stored exclusively in the browser's local storage by default. No data is transmitted externally without a separate, explicit opt-in for telemetry or a user-initiated export.
- **Safety and Consent Protocols:** The simulation requires explicit user consent acknowledging its educational-only nature. It includes automated safety checks, such as keyword scanning on text inputs and numeric risk flagging, which trigger a compassionate overlay and halt the simulation if activated.
- **Data Export:** Users can export their session notes after a mandatory preview and redaction workflow, ensuring they have full control over what is saved.

---

## 2. Potential Enhancements

This section lists 25 potential enhancements that could be considered for future development, along with their primary challenges and proposed mitigations.

### Simulation and Visualization
1.  **Detailed 2D Anatomical Representations:** Enhance the existing 2D views with more detailed, conceptually accurate anatomical backdrops.
    -   **Network Overview:** Instead of an abstract space, draw a simplified 2D cross-section of the brain and overlay the conceptual neural network onto relevant regions (e.g., prefrontal cortex, amygdala) to provide anatomical context.
    -   **Synaptic Close-up:** Enhance the view with a more detailed 2D diagram of a synaptic cleft, visually representing key components like vesicles, neurotransmitters, receptors, and reuptake transporters.
    -   **Challenge:** Balancing anatomical detail with the simulation's conceptual nature is difficult. There's a risk of creating a diagram that is either too complex or medically inaccurate.
    -   **Mitigation:** The design must be clearly stylized and labeled as a "conceptual model," not a medical illustration. Work with a subject matter expert to ensure the representation is educationally sound without being misleadingly literal.
2.  **Hebbian Learning Model:** Implement a "neurons that fire together, wire together" simulation model.
    -   **Challenge:** The logic is more complex and can be harder for users to intuitively grasp.
    -   **Mitigation:** Start with a simplified rule. Use clear visual feedback, like pulsing connections, to reinforce the concept.
3.  **Long-Term Depression (LTD) Simulation:** Add a mechanic for conceptually weakening neural pathways.
    -   **Challenge:** Could be perceived as negative or discouraging to the user.
    -   **Mitigation:** Frame the feature positively as "unlearning unhelpful patterns" or "pruning connections" in the UI.
4.  **Neurotransmitter Model:** Simulate the depletion and replenishment of conceptual neurotransmitters.
    -   **Challenge:** High risk of oversimplifying or misrepresenting complex neurochemistry.
    -   **Mitigation:** Abstract the model heavily (e.g., a "resource pool" instead of named chemicals) and reinforce with strong disclaimers.
5.  **Customizable Network Layouts:** Allow users to arrange the conceptual network.
    -   **Challenge:** Can lead to a complex UI and difficult state management.
    -   **Mitigation:** Instead of full customization, offer a selection of pre-set templates (e.g., "Anxious Thought Loop Model").

### Content and Curriculum
6.  **Additional Guided Modules:** Add new modules for skills like Interpersonal Effectiveness or Radical Acceptance.
    -   **Challenge:** Requires significant content creation and review by a subject matter expert.
    -   **Mitigation:** Develop new modules iteratively using a standardized content template to streamline creation.
7.  **Ephemeral Sandbox Mode:** Allow users to adjust core simulation parameters (e.g., `potentiationRate`, `decayRate`) via an "Advanced" panel.
    -   **Challenge:** Exposing these parameters can make the simulation confusing; values are not saved.
    -   **Mitigation:** Hide this panel by default. Frame it clearly as an experimental "sandbox." State changes made here are not persisted to `localStorage` and reset on page refresh.
8.  **Branching Narratives in Modules:** Allow user choices to alter the path of a guided practice.
    -   **Challenge:** Leads to an exponential increase in content complexity.
    -   **Mitigation:** Keep branches simple (2-3 choices per step) and define the narrative flow in a structured JSON format.
9.  **Printable Summary/Worksheet Export:** Allow users to export their notes into a formatted PDF worksheet.
    -   **Challenge:** Styling for print/PDF can be complex and time-consuming.
    -   **Mitigation:** Create a dedicated print stylesheet (`@media print`). For more control, an external library like jsPDF could be considered if the "no new libraries" constraint is lifted for this specific feature.
10. **Educator Mode:** A mode allowing a presenter to control the simulation for a live audience.
    -   **Challenge:** Requires a mechanism for real-time state synchronization.
    -   **Mitigation:** For local presentations, URL parameters or a simple WebSocket connection could sync a "presenter" and "display" view.

### Data Sources & State Management
11. **URL Parameter State Loading:** Allow pre-configuring the simulation state (e.g., `practiceIntensity`, `glitchImpact`) via URL query parameters for easy sharing of specific demo scenarios.
    -   **Challenge:** Requires robust parsing and validation of URL parameters to prevent invalid states.
    -   **Mitigation:** Write a dedicated function that reads URL parameters, validates them against the known schema, and applies only the valid ones, ignoring any malformed or unrecognized parameters.
12. **Local File Import/Export:** Use the native File Reader API to allow users to import a previously exported session JSON file, and create a downloadable Blob to export the current session state.
    -   **Challenge:** User error in selecting the wrong file type; imported data might not match the current schema.
    -   **Mitigation:** Implement a file type check (`.json`) on the file input. The import function must validate the imported JSON against the session state schema before applying it.
13. **Multiple Local Save Slots:** Enhance the `localStorage` abstraction to support saving and loading from multiple named "slots" (e.g., "Slot 1", "Slot 2"), allowing users to compare different simulation runs.
    -   **Challenge:** Requires a more complex UI for managing slots (naming, saving, loading, deleting).
    -   **Mitigation:** Keep the UI simple. Use a `<select>` dropdown to list existing slots and a text input with a "Save" button to create new ones.
14. **Static Scenario Loading:** Load pre-defined simulation scenarios from a local static JSON file within the project (e.g., `scenarios.json`) that can be used for tutorials or demonstrations.
    -   **Challenge:** The format of the scenario file needs to be clearly defined and maintained.
    -   **Mitigation:** Use `fetch()` to load the local JSON file. The structure of the scenario file should mirror the session state schema to ensure compatibility.
15. **Session Snapshot History:** Store a history of the last N session states in `localStorage`, allowing the user to "undo" or revert to a previous state within the same session.
    -   **Challenge:** Can consume a significant amount of `localStorage` space if states are large or N is high.
    -   **Mitigation:** Keep N small (e.g., 5-10 states). Implement a function that prunes the oldest state whenever a new one is added to the history array.

### API/Library-Free Improvements
16. **Advanced Canvas Visual Feedback:** Use pure Canvas drawing to add more visual cues, such as a "glow" effect on a strengthening synapse or particle effects for neurotransmitter release, without any animation libraries.
    -   **Challenge:** Can impact performance if not implemented efficiently.
    -   **Mitigation:** Keep particle counts low. Use efficient drawing methods and ensure that animations are only active when necessary and are tied to the main `requestAnimationFrame` loop.
17. **Pure CSS UI Animations:** Add subtle CSS transitions and animations to UI elements (like panels fading in or buttons changing state) to improve the user experience.
    -   **Challenge:** Overuse can be distracting or cause performance issues.
    -   **Mitigation:** Apply transitions only to simple properties like `opacity`, `transform`, and `background-color`. Keep animation durations short (e.g., 200-300ms).
18. **Print-Optimized Stylesheet:** Create a dedicated print stylesheet (`@media print`) that reformats the guided module text and user notes into a clean, readable worksheet format, hiding interactive elements.
    -   **Challenge:** Browser print previews can be inconsistent.
    -   **Mitigation:** Focus on simple, robust styles: hide non-essential elements (`display: none`), reset colors to black and white, and use serif fonts for readability.
19. **Stateful UI Controls:** Ensure all UI controls (sliders, toggles) automatically update to reflect the state when a new session is imported from a file or loaded from a URL parameter.
    -   **Challenge:** Requires a centralized state management approach where the UI always re-renders based on the current state.
    -   **Mitigation:** Implement a render function that is always called after a state change, ensuring that UI element values are explicitly set from the state object.
20. **ARIA Live Region for Metrics:** Implement an `aria-live` region that programmatically announces changes to key metrics (e.g., "Synaptic weight increased to 0.85") for screen reader users.
    -   **Challenge:** Announcing too frequently can be overwhelming.
    -   **Mitigation:** Use `aria-live="polite"` and only update the region's content after significant changes or at timed intervals (e.g., every few seconds) rather than on every animation frame.

### Accessibility (No-Library)
21. **Keyboard Focus Management for Canvas:** Create a system where keyboard users can tab to the canvas, then use arrow keys to cycle focus between key conceptual nodes or synapses.
    -   **Challenge:** The `<canvas>` is a single element, so focus must be managed programmatically.
    -   **Mitigation:** Maintain an internal array of interactive element coordinates. Draw a visual "focus ring" on the canvas at the coordinates of the currently focused element.
22. **Dynamic Text-Based Summary:** Provide a collapsible `<details>` element that contains a text-based summary of the current visual state of the canvas, which updates as the simulation runs.
    -   **Challenge:** The summary text must be generated and updated in sync with the simulation.
    -   **Mitigation:** Create a function that takes the simulation state and returns a descriptive string (e.g., "Network of 5 nodes. Synapse between Node 1 and 2 is strong."). Call this function whenever the state changes.
23. **"Reduce Motion" Preference:** Use the `prefers-reduced-motion` CSS media query to automatically disable or significantly tone down purely decorative canvas animations and CSS transitions.
    -   **Challenge:** Requires separating essential animations (which convey information) from decorative ones.
    -   **Mitigation:** Wrap decorative animation calls in a JavaScript check for the media query (`window.matchMedia('(prefers-reduced-motion: reduce)').matches`). Use CSS to override `animation` and `transition` properties within the media query block.
24. **Interactive UI Guided Tour:** On first load, use pure CSS and JS to highlight key UI elements (like the intensity slider and mode selector) with a small popover explaining their function.
    -   **Challenge:** Ensuring the tour is not intrusive and can be easily dismissed and re-enabled.
    -   **Mitigation:** Store a `tourCompleted` flag in `localStorage`. Provide a "Help" button to re-launch the tour.
25. **Calculated Session Summary on Export:** When the user exports their data, include a calculated summary section in the export preview and the final file.
    -   **Challenge:** The summary metrics (e.g., "Average Practice Intensity", "Total Time in Session") need to be calculated from the session event log.
    -   **Mitigation:** Write a dedicated function that processes the `events` array from the session state to calculate the summary statistics. This function is called only during the export flow.
