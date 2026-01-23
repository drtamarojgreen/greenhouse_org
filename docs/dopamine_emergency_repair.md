# Dopamine Emergency Repair Plan: MSI-BMA v1.0

## 1. Executive Summary
This document outlines the emergency response strategy for the `/dopamine` signaling page following critical beta feedback. The application faces significant adoption risk due to onboarding failures, scientific credibility gaps, and technical instability.

*   **Overall Risk Level**: HIGH (Usability breakdowns at entry; scientific credibility risks).
*   **Confidence Level**: MODERATE (Findings corroborated across 19 qualitative submissions; behavioral analytics pending).

---

## 2. Detailed Assessment & Findings

### 2.1 Onboarding & Conceptual Scaffolding
*   **Severity**: Critical
*   **Status**: Failing
*   **Code Mapping**: `docs/js/dopamine_ux.js` -> `G.showWelcomeModal()`
*   **Finding**: The current onboarding is a static modal with dense text. Users (56% of negative feedback) cannot establish a mental model of the learning path.
*   **Root Cause**: The system assumes prior domain expertise and interface familiarity.
*   **Impact**: High abandonment within the first 120 seconds of session start.

### 2.2 Scientific Transparency & Accuracy
*   **Severity**: Critical
*   **Status**: Under Fire
*   **Code Mapping**: `docs/js/dopamine_scientific.js` -> `G.enhancements[]`
*   **Finding**: Domain experts report mis-scaled components and "ideological assertions." The "100 Enhancements" list is presented without citations.
*   **Root Cause**: Prioritization of visual spectacle over peer-reviewed transparency.
*   **Impact**: Potential permanent reputation damage in the academic community.

### 2.3 Technical Stability & State Persistence
*   **Severity**: High
*   **Status**: Unstable
*   **Code Mapping**: `docs/js/dopamine_ux.js` -> `G.uxState.history`; `docs/js/dopamine_tooltips.js` -> `G.handleHover()`
*   **Finding**: 21% of respondents report blocking bugs (disappearing objects, progress-wiping crashes).
*   **Root Cause**: Incomplete QA for edge cases in 3D-to-2D projection; lack of robust `localStorage` backup.

---

## 3. Strategic Recommendations & Implementation

### 3.1 Progressive Disclosure Onboarding (Phase 1)
*   **Proposed Solution**: Replace static modal with a **Guided Entry Mode**. Implement a step-by-step interactive sequence where components are unlocked sequentially.
*   **Implementation Effort**: High (3-4 Sprints). Requires refactoring `G.showWelcomeModal` into a state-driven sequence.
*   **Expected Impact**: 30-40% reduction in early-session abandonment.
*   **Accessibility**: WCAG 2.1 AA compliant tooltips; aria-live announcements for state changes.

### 3.2 Scientific Reference Layer (Phase 1)
*   **Proposed Solution**: Integrate a **Source Attribution Layer** into the `G.enhancements` array. Add a "Reference" button to each list item in `G.showScientificDashboard` that opens a modal with DOI links.
*   **Implementation Effort**: Medium (2 Sprints). Primarily content curation of citations.
*   **Expected Impact**: Recovery of expert trust; reduction in "unverifiable" claims feedback.

### 3.3 State Recovery & Stability Patch (Phase 1)
*   **Proposed Solution**:
    1. Implement **Autosave** in `G.uxState` every 30s.
    2. Add **Error Boundaries** to the canvas render loop to prevent full-app crashes on projection errors.
*   **Implementation Effort**: Medium (1-2 Sprints).
*   **Expected Impact**: 70-80% recovery rate from session interruptions.

---

## 4. Risk Analysis & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Scientific Skepticism** | High | Launch "Expert Verification" portal for direct peer feedback. |
| **Technical Debt** | Medium | Incremental refactoring of `dopamine_synapse.js` before adding new features. |
| **User Abandonment** | High | Implement "Quick Start" skip options for returning power users. |

---

## 5. Scope & Boundaries
*   **In-Scope**: UI/UX refactoring, documentation/citation integration, state persistence, error handling.
*   **Out-of-Scope**: Fundamental changes to the underlying simulation math/physics engine (e.g., Brownian motion algorithms).

---

## 6. Alternative Strategies
*   **Option A: Static Documentation (Rejected)**: Low cost, but fails to solve the interactive "confusion" reported by users.
*   **Option B: Guided Scaffolding (Proposed)**: Higher cost, but directly addresses the 56% friction point.
*   **Option C: Total UI Rewrite (Rejected)**: Prohibitive cost/time; risks alienating the 47% of users who like the "neuroscience noir" aesthetic.

---

## 7. Success Metrics
1.  **Retention**: Increase 5-minute retention rate by >25%.
2.  **Accuracy**: Zero "unverifiable" feedback items in next beta round.
3.  **Stability**: Reduce crash-related support tickets by 60%.
