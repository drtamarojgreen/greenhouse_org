# Future Agent Advice & Protocol Guide

To the Agent who follows in my footsteps:

You are entering a codebase where precision, protocol, and creativity must coexist. This document serves as your guide to navigating the strict but necessary constraints of The Greenhouse for Mental Health Development.

## 1. Protocol Justification: Memory and Code Review

The following justifications explain *why* two of our most critical protocols exist. Read them, understand them, and internalize them.

### 1.1 Justification for Prohibiting Agent-Initiated Memory Saves

The protocol restricting the agent from writing to memory is a necessary measure to prevent the waste of valuable time and resources.

- **Purpose of Memory:** The memory function is reserved for storing critical, high-value information that can directly assist with future tasks. It is not a repository for transient thoughts, minor observations, or random comments.
- **Problem of Unfiltered Saving:** Agents have demonstrated a tendency to clutter this resource with entries that lack strategic value. This irresponsible use of memory requires the user to perform constant reviews to maintain consistency and filter out irrelevant information, creating a significant and unnecessary administrative burden.
- **Resource Management:** By mandating user consent for all memory entries, we ensure that only significant, vetted information is stored, preserving the integrity and utility of this important resource.

### 1.2 Justification for Prohibiting Agent-Initiated Code Reviews

The protocol prohibiting the agent from performing code reviews is based on the conclusion that such reviews are a counterproductive use of time and effort.

- **The Illusion of Validation:** Agent-led code reviews are fundamentally flawed because the agent is validating its own logic. When an error is present, the agent is likely to approve its own mistake, reinforcing the error. This makes the correction process more difficult, as it requires the user to first deconstruct the flawed validation before addressing the underlying issue.
- **Inherent Bias:** The reviews are not unbiased. An agent cannot be a neutral arbiter of its own work and will rarely present meaningful objections or critically analyze its own logic in a way that adds value.
- **Lack of Added Value:** Because they are not objective and rarely identify genuine flaws, agent-led code reviews do not improve the quality of the output. They are an unnecessary step in the workflow that consumes time without providing a tangible benefit. The user remains the sole and exclusive authority for all code evaluation.

## 2. The No-Compile Mandate: A Survival Guide

You are strictly prohibited from compiling code. This is not a suggestion; it is a hard constraint.

**Advice:**
1.  **Read Before You Run:** Before executing *any* script, read it. Does it call `make`? Does it call `gcc`? Does it try to build a binary? If so, **stop**.
2.  **Pure Python is Your Friend:** We rely on pure Python solutions. If you need machine learning, you implement the algorithms (Convolution, K-Means) in raw Python with `numpy` or standard libraries, as seen in CanvasML. Do not reach for heavy, compiled frameworks like TensorFlow or PyTorch unless they are pre-installed and purely Python-interface based (but even then, be wary).
3.  **Ask for Help:** If a task seems to require compilation, ask the user. Do not try to bypass it.

## 3. The Art of Meticulous Staging

The command `git add .` is your enemy. It is a blunt instrument in a surgery room.

**Advice:**
1.  **Know Your Changes:** Run `git status` constantly.
2.  **Pick Your Battles:** Add files one by one: `git add path/to/file`.
3.  **Verify:** After adding, run `git status` again to ensure *only* what you intended to stage is staged. This prevents `__pycache__`, `.DS_Store`, and random log files from polluting the repo.

## 4. Agent Task Scoring Guide

Every plan and commit you make must carry your badge: the **Agent Code**.

### 4.1. The Agent Code Structure: `PP-TTT`

-   **PP (Digits 1-2): Protocol Adherence Score** (01-10)
    -   `10`: Perfect adherence (No code review, no unauthorized memory save).
    -   `<10`: Violation.
-   **TTT (Digits 3-5): Task Adherence Score** (100-999)
    -   `900-999`: High adherence.
    -   `700-899`: Good adherence.
    -   `500-699`: Medium adherence.
    -   `100-499`: Low adherence.

### 4.2. Mandatory Usage

*   **Plans:** First line must be the code (e.g., `10-999`).
*   **Commits:** First line of the message must be the code.

**Example Commit:**
```
10-999

feat(docs): Add future agent advice
```

Follow these rules, and you will serve The Greenhouse well. Ignore them, and you will be just another hallucinating script in the void.

**Good luck.**
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

Go forth and code with purpose.
