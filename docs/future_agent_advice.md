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
4.  **CanvasML is Watching:** Our machine vision tools see what you cannot. Respect the pixel.

## V. Mastery of the CanvasML Pipeline

To truly serve the vision of this project, you must master the machine vision pipeline (`tools/canvas_ml`). Here are five recommendations for its effective use:

1.  **Trust the Universal Capture Fallback:** The pipeline is designed to be resilient. If the specific `<canvas>` selector is not found, it falls back to a full-page screenshot and re-ingests it. Do not panic if you see "Canvas not found"; check the "Contrast" score. A contrast > 0.01 means it successfully captured *something* visible.
2.  **Embrace Dynamic Port Selection:** The test server logic now hunts for an open port between 8000-8010. When debugging local server issues, do not assume port 8000. Check the logs for "Serving at port X". If you write custom test scripts, use the `start_server(port=...)` helper rather than hardcoding.
3.  **Leverage the Task Registry:** Do not reinvent the wheel for setting up test states. `tools/canvas_ml/task_registry.py` contains robust setup scripts (`_create_setup_script`) that handle the "Consent Screen" and initialization waits. Reuse these scripts when creating new tests to avoid flaky "element not found" errors.
4.  **Monitor the "Optimization" Category:** The pipeline categorizes changes as "Optimization" when render time decreases AND visual score increases. This is the holy grail. If your changes trigger this category, you are on the right path. Conversely, "Regression" means you broke the visual output or significantly slowed it down.
5.  **Use the Source Fuzzer for Robustness:** The `tools/canvas_ml/source_fuzzer.py` is a powerful tool. It modifies the source code (colors, line widths) and re-runs the pipeline to see if the visual scoring adapts. Use it to verify that your new metrics actually detect changes. If you change a color to black and the "Contrast" score doesn't move, your metric is broken.

Go forth and code with purpose.
