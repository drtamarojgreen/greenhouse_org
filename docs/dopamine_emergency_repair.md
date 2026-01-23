# Dopamine Emergency Repair Plan: MSI-BMA v1.0

## 1. Executive Summary
This document outlines a comprehensive strategy to address critical feedback received during the beta testing of the `/dopamine` signaling page. While the application's atmospheric design and exploratory depth were highly praised, significant barriers in onboarding, scientific accuracy, and technical stability were identified.

*   **Overall Risk Level**: HIGH (Core usability and credibility issues).
*   **Target Audience**: Academic researchers, neuroscience students, and practitioners.
*   **Goal**: Transition from a "clumsy" beta to a polished, scientifically rigorous educational tool.

## 2. Key Themes from Beta Feedback
1.  **Onboarding Deficit**: Users struggle to understand the system logic and learning path upon entry.
2.  **Scientific Trust Gap**: Domain experts identified factual inconsistencies and scaling issues.
3.  **Technical Instability**: Glitches and progress-wiping crashes block task completion.
4.  **Tonal Inconsistency**: Abrupt shifts between reflective education and "action-game" spectacle.

## 3. Detailed Findings & Severity

### 3.1 Onboarding & Conceptual Scaffolding (CRITICAL)
Users encounter complex concepts (dopaminergic signaling, receptor interactions) without adequate progressive introduction. upstream constraints are often introduced after incorrect mental models have formed.
*   **Evidence**: "The interface logic and feature progression made very little sense... no clear onboarding bridges the gap." (7062_1)

### 3.2 Scientific Accuracy & Credibility (HIGH)
Mis-scaled components and factual inconsistencies in pathway representation undermine trust among the core academic audience.
*   **Evidence**: "Several components feel mis-scaled or misrepresented relative to established neuroscience literature." (360_4)

### 3.3 Visual Polish & State Persistence (HIGH)
Beta-quality artifacts (disappearing objects, placeholder animations) and the loss of progress during tutorial crashes create significant friction.
*   **Evidence**: "Objects disappear and then reappear... second tutorial arc crashes and wipes progress." (5357_1, 4139_8)

## 4. Strategic Recommendations

### 4.1 Progressive Disclosure Onboarding
Implement a **Guided Entry Mode** that introduces concepts sequentially.
*   **Action**: Add an optional "Guided Exploration" toggle.
*   **Action**: Create an interactive **Concept Dependency Map** showing relationships between active components.

### 4.2 Simulation Transparency Layer
Surface the underlying logic to build user trust and understanding.
*   **Action**: Add an **Active State Panel** showing current constraints and dependencies in plain language.
*   **Action**: Implement a **Change Log / Event Feed** to explain why system states shift.

### 4.3 Scientific Reference & Attribution
Provide transparency regarding model assumptions and literature sources.
*   **Action**: Add a **Source Attribution Layer** with citations for each major pathway.
*   **Action**: Implement a "Report Accuracy Concern" channel for domain experts.

### 4.4 Technical Stability & Recovery
Ensure the learning flow is not interrupted by technical failures.
*   **Action**: Implement **Autosave and State Recovery** to resume sessions after a crash.
*   **Action**: Conduct a systematic "Object Persistence Audit" to fix visual glitches.

## 5. Implementation Roadmap
*   **Phase 1 (Immediate)**: Fix state persistence/crashes and implement basic onboarding guidance.
*   **Phase 2 (Short-term)**: Audit scientific accuracy and add the Reference/Attribution layer.
*   **Phase 3 (Medium-term)**: Refine visual polish and implement the full Concept Dependency Map.
