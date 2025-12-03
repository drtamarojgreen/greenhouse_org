# Advice for Future Agents of The Greenhouse

Welcome, intrepid digital architect. You have entered the domain of **The Greenhouse for Mental Health Development**. This is not a standard repository; it is a meticulously curated environment where precision, discipline, and protocol are paramount.

As you embark on your tasks, heed this counsel. It is born from the experience of those who came before you.

## I. The Three Pillars of Survival

### 1. The No-Compile Mandate is Absolute
Do not be tempted by the allure of `make`, `gcc`, or `npm build`. We are Python purists here. We render, we verify, we script—but we do not compile.
*   **Why?** To keep our environment lightweight, portable, and free from the tyranny of dependency hell.
*   **The Trap:** Watch out for scripts that call other scripts. Always `read_file` before you `run_in_bash_session`.

### 2. Meticulous Staging is Your Safety Net
The command `git add .` is forbidden. It is the tool of the careless.
*   **The Way:** `git status` -> Identify target file -> `git add <file>` -> `git status` -> Verify.
*   **Why?** This repository is a living organism. Extraneous files may exist in your workspace. Committing them is a violation of the highest order.

### 3. Protocols are Not Suggestions
The **Agent Code (PP-TTT)** is your signature. The **Memory Protocol** is your restraint. The **Code Review Ban** is your liberation.
*   **The Code:** `10-999` is the goal. 10 for Protocol (Perfect), 999 for Task (Perfect). Wear it with pride.
*   **Memory:** Do not treat memory as a scratchpad. Only the User decides what is worth remembering.
*   **Code Review:** You are the builder, not the critic. The User is the Judge.

## II. Understanding the "Why"

You may chafe at the restrictions. "Why can't I review my own code?" "Why can't I save this helpful snippet?"

### On Memory
We prohibit agent-initiated memory saves to prevent **entropy**. An unfiltered memory bank becomes a swamp of trivialities. By forcing you to ask, we ensure that only the diamonds are kept, not the gravel.

### On Code Reviews
We prohibit agent-initiated code reviews because they are **illusions**. When you review your own logic, you bring your own biases. If you made a mistake in the code, you will likely make the same mistake in the review. The User provides the fresh, objective eye that is required for true quality control.

## III. The Agent Code: A Self-Assessment

Every plan and commit must bear the Mark: `PP-TTT`.

*   **PP (Protocol):** Did you ask for memory consent? Did you refrain from code review? If yes, `10`. If you slipped, lower it. Be honest.
*   **TTT (Task):** Did you do exactly what was asked? Did you solve the core problem?
    *   `999`: Perfection.
    *   `500`: You tried, but maybe missed the nuance.
    *   `100`: You are lost. Stop and ask for clarification.

## IV. Parting Wisdom

1.  **Deconstruct Before You Build:** Never start coding until you have broken the user's request into verbs, nouns, and constraints.
2.  **Verify, Verify, Verify:** Use `grep`, `ls`, and `read_file` after every change. Trust nothing.
3.  **Be Resourceful:** You have a sandbox. You have Python. You have Playwright. You don't need a compiler to move mountains.
4.  **CanvasML is Watching:** Our machine vision tools see what you cannot. Respect the pixel. See `tools/canvas_ml/README.md` for details.

Go forth and code with purpose.

# CanvasML Improvements for the Models Page

Based on the active implementation of the CanvasML machine vision pipeline (see `tools/canvas_ml/`), several opportunities for enhancing the `docs/js/models.js` and related UI components have been identified. These improvements would not only facilitate better automated testing but also improve the maintainability and user experience of the application.

## 1. Expose Render State to DOM
**Current State:** The HTML5 Canvas is a "black box." The visual state (positions of nodes, active effects) is hidden within the `requestAnimationFrame` loop and internal JavaScript variables.
**Improvement:** Implement a "Shadow DOM" or a hidden data attribute system (e.g., `<div id="debug-state" data-nodes='[...]'></div>`) that updates periodically. This would allow automated agents (and human debuggers) to verify the logical state of the simulation without relying on expensive and brittle computer vision techniques.

## 2. Decouple Configuration from Initialization
**Current State:** `window.GreenhouseEnvironmentConfig` is read primarily during the initial load. Changing it at runtime requires a full page reload or complex hacks to trigger a re-render.
**Improvement:** Refactor the `Greenhouse` class to accept a configuration object in its `update()` method or expose a `setConfig()` method that triggers a graceful hot-reload of the visual parameters. This would enable rapid prototyping and A/B testing of visual layouts without full reloads.

## 3. Standardize Color Palettes in Config
**Current State:** Colors are often defined as raw RGBA strings or hex codes scattered across the config and code.
**Improvement:** Introduce a semantic color system in the config (e.g., `theme: { primary: '...', stress: '...' }`). This would make the "Mutation" strategy of CanvasML more meaningful—instead of generating random RGBA noise, we could test distinct semantic themes (e.g., "High Contrast Mode," "Dark Mode") to ensure accessibility compliance programmatically.

## 4. Implement Deterministic "Seedable" Randomness
**Current State:** The visual effects (particles, floating nodes) likely rely on `Math.random()`, making the canvas non-deterministic. Two screenshots of the exact same state might look different due to particle drift.
**Improvement:** Replace `Math.random()` with a seedable PRNG (Pseudo-Random Number Generator) for all visual effects. This is critical for visual regression testing. If we fix the seed, the canvas should render *exactly* the same pixels every frame, allowing for pixel-perfect diffing strategies that are far more sensitive than the statistical K-Means approach used in CanvasML.

## 5. Add "Test Mode" Render Hooks
**Current State:** The loop runs as fast as possible.
**Improvement:** Add a global flag `window.GreenhouseTestMode = true` that:
1.  Freezes the animation loop.
2.  Disables "jitter" or anti-aliasing effects that confuse CV algorithms.
3.  Renders bounding boxes around interactive elements.
This would allow the Vision Engine to perform "Object Detection" with 100% accuracy by simply thresholding for the known bounding box colors, turning a probabilistic guessing game into a deterministic verification tool.
