# Educational Simulation - UI Component Breakdown

## 1. Overview

This document provides a detailed description of the primary UI components required for the Neural Plasticity Educational Simulation. These descriptions are based on the initial UI mockups and serve as a guide for front-end development.

## 2. Landing and Consent Flow Components

### 2.1. Main Container
- **Description:** A simple centered container that holds all elements of the landing page to provide structure and padding.
- **Elements:**
  - `<h1>`: The main title of the simulation.
  - `<p>`: A brief introductory paragraph explaining the purpose of the tool.

### 2.2. Disclaimer Banner
- **Description:** A visually distinct banner designed to draw the user's attention to the educational, non-clinical nature of the simulation.
- **Styling:** Should have a noticeable background color (e.g., light yellow) and a prominent border to distinguish it from other content.
- **Content:** "Simulation — Educational model only. Not a substitute for clinical care."

### 2.3. Consent Form
- **Description:** The interactive section where the user must provide consent before proceeding.
- **Elements:**
  - `<label>` with `<input type="checkbox">`: The checkbox that the user must click. The label text is: "I understand this simulation is educational only and not a substitute for clinical care."
  - `<button id="start-button">`: The "Start Simulation" button.
- **Behavior:** The start button must be disabled by default and only becomes enabled when the consent checkbox is checked.

### 2.4. Safety Check-in (Optional)
- **Description:** A section for an optional, pre-session self-assessment. This is explicitly marked as local-only and not stored or transmitted.
- **Elements:**
  - Mood and Stress sliders (`<input type="range">`) with labels and value displays.
  - "Yes" and "No" buttons for the binary safety question.
- **Behavior:** If the user clicks "Yes" to indicating a crisis, a referral text paragraph is displayed, strongly advising them to seek professional help.

## 3. Main Simulation Canvas UI Components

### 3.1. Top Banner
- **Description:** An always-visible banner at the top of the simulation view that reiterates the non-clinical nature of the tool.
- **Content:** "Simulation — not clinical therapy."

### 3.2. Simulation Canvas (`<canvas>`)
- **Description:** The core visual component where the neural network or synaptic close-up is rendered. This is a placeholder for the dynamic, script-driven visualization.

### 3.3. Controls Panel
- **Description:** A dedicated panel containing all the interactive controls for manipulating the simulation.
- **Elements:**
  - **Practice Intensity Slider:** Allows the user to set a value from 0-100.
  - **Simulation Speed Selector:** A dropdown (`<select>`) with "Slow", "Normal", and "Fast" options.
  - **Play/Pause Button:** Toggles the simulation state.
  - **Reset Plasticity Button:** Resets the simulation's "synaptic weight" to its initial value.
  - **Inject Network Glitch Toggle:** A checkbox to turn on/off a conceptual glitch effect.
  - **Visualization Mode Selector:** A dropdown to switch between "Network Overview" and "Synaptic Close-up" views.

### 3.4. Metrics Panel
- **Description:** A panel that displays the real-time output values from the simulation.
- **Elements:**
  - Key-value pairs for "Synaptic Weight," "Neurotransmitters Released," "Ions Crossed," and "Learning Metric."

### 3.5. Instructions Panel
- **Description:** A text area that provides psychoeducational context for the current module, linking the user's actions (like setting "Practice Intensity") to the concepts being simulated.

### 3.6. Footer Banner
- **Description:** A small, fixed banner at the bottom of the page.
- **Content:** Displays the current prompt version (e.g., "Prompt version: 1.0.2").

## 4. Safety Overlay Component

### 4.1. Overlay Container
- **Description:** A modal element that covers the entire viewport with a semi-transparent background, preventing interaction with the underlying page.
- **Behavior:** It is hidden by default and becomes visible when a safety condition is triggered.

### 4.2. Overlay Content Box
- **Description:** A centered, bordered box that contains the safety warning and resources.
- **Styling:** Should have a prominent, high-alert border color (e.g., red).
- **Elements:**
  - `<h2>`: A clear heading like "Important Safety Information."
  - `<p>` tags containing the warning message and strong recommendations to seek professional help.
  - `<a>`: A link to a reputable crisis resource.
  - `<button>`: An "Acknowledge and Close" button to dismiss the overlay.

## 5. Detailed Component Styling Guide

This guide provides specific styling rules to ensure the simulation's UI is visually consistent with the existing Greenhouse Mental Health website. All new classes must be prefixed with `greenhouse-` and defined in `docs/css/model.css`.

### 5.1. Core Design System

- **Primary Font (Body):** `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Heading Font:** `'Quicksand', sans-serif`
- **Primary Text Color:** `#2d3e2d`
- **Primary Green (Accents/Links):** `#1d7a1d`
- **Secondary Green (Headings):** `#357438`
- **Secondary Purple (Accents):** `#732751`
- **Standard Border Radius:** `12px` for panels, `8px` for buttons/inputs.
- **Standard Box Shadow:** `0 2px 6px rgba(0, 0, 0, 0.08)`

### 5.2. Component-Specific Styles

#### **Landing Page Container (`.greenhouse-landing-container`)**
- **`padding`:** `2em`
- **`border`:** `1px solid #ccc`
- **`border-radius`:** `12px`
- **`background-color`:** `#fff`

#### **Disclaimer Banner (`.greenhouse-disclaimer-banner`)**
- **`border`:** `2px solid #f0ad4e`
- **`background-color`:** `#fcf8e3`
- **`padding`:** `1em`
- **`border-radius`:** `8px`
- **`font-weight`:** `bold`

#### **Buttons (`.greenhouse-btn-primary`, `.greenhouse-btn-secondary`)**
- **Primary Button (`.greenhouse-btn-primary`):**
  - **`background-color`:** `#1d7a1d`
  - **`color`:** `#fff`
  - **`border`:** `none`
  - **`border-radius`:** `8px`
  - **`padding`:** `0.8em 1.5em`
  - **`font-weight`:** `600`
  - **`cursor`:** `pointer`
  - **`:hover` state:** `background-color: #166616`
- **Disabled State (`:disabled`):**
  - **`background-color`:** `#ccc`
  - **`cursor`:** `not-allowed`
- **Secondary Button (`.greenhouse-btn-secondary`):**
  - **`background-color`:** `#6c757d` (for non-primary actions like 'No' or 'Close')
  - Follows primary button styling for other properties.

#### **Panels (`.greenhouse-controls-panel`, `.greenhouse-metrics-panel`)**
- **`background`:** `#fff`
- **`border`:** `1px solid #ccc`
- **`border-radius`:** `12px`
- **`padding`:** `1.5em`
- **`box-shadow`:** `0 2px 6px rgba(0, 0, 0, 0.08)`

#### **Headings**
- **`h1` (`.greenhouse-simulation-title`):**
  - **`font-family`:** `'Quicksand', sans-serif`
  - **`color`:** `#357438`
  - **`font-weight`:** `600`
- **Panel Headings (`h3`):**
  - **`font-family`:** `'Quicksand', sans-serif`
  - **`color`:** `#005f73`
  - **`border-bottom`:** `2px solid #eee`
  - **`padding-bottom`:** `0.5em`

#### **Form Elements (`.greenhouse-slider`, `.greenhouse-select`)**
- **Styling for `<input type="range">` and `<select>`:** These elements are notoriously difficult to style consistently. The implementation should prioritize making them functional and clean, with styles that align with the site's color scheme where possible (e.g., custom slider track color). A simple, clean look is preferred over complex custom styling that may break cross-browser.

#### **Safety Overlay (`.greenhouse-safety-overlay`)**
- **Modal Background:** `rgba(0, 0, 0, 0.6)`
- **Content Box (`.greenhouse-safety-content`):**
  - **`background-color`:** `#fff`
  - **`border`:** `3px solid #d9534f` (Error Red)
  - **`border-radius`:** `8px`
  - **`padding`:** `2em`
  - **`box-shadow`:** `0 5px 15px rgba(0,0,0,0.3)`
- **Heading (`h2`):**
  - **`color`:** `#d9534f`
