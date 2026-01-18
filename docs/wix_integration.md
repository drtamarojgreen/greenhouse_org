# Wix and GitHub Pages Integration Architecture

This document outlines the integration architecture between the main Wix website and the custom JavaScript/CSS assets hosted on GitHub Pages.

## Overview

- **Primary Website:** The main public-facing website, `https://greenhousemd.org`, is built and hosted on Wix.
- **Custom Asset Host:** Custom JavaScript and CSS for interactive applications (e.g., the appointment scheduler) are hosted on a separate GitHub Pages site. The base URL for these assets is `https://drtamarojgreen.github.io/greenhouse_org/`.

## Integration Mechanism

The Wix site integrates the custom functionalities by embedding `<script>` tags that point to the JavaScript files hosted on the GitHub Pages site.

For example, the main entry point for the custom scripts is `greenhouse.js`. The Wix site must be configured to include a script tag similar to this:

```html
<script src="https://drtamarojgreen.github.io/greenhouse_org/js/greenhouse.js" defer></script>
```

## Key Implementation Details

- **`githubPagesBaseUrl`:** The variable `githubPagesBaseUrl` in `greenhouse.js` must be hardcoded to the absolute GitHub Pages URL. This is necessary because the scripts are loaded from a different domain (Wix) and need to know where to fetch their dependencies (e.g., `scheduler.js`, `app.js`, CSS files).
- **`targetSelector`:** The complex DOM selectors (like `targetSelector` in `greenhouse.js`) are designed to target specific elements within the DOM structure of the Wix-hosted pages. They will not work on the simple HTML files within this repository if they are run in isolation.
- **Development and Testing:** For development, the HTML files in the `/docs` directory (e.g., `docs/index.html`) serve as mock-ups or representations of the Wix page structure. The primary purpose of these files is to test the scripts' ability to correctly inject themselves into a DOM that mimics the production Wix environment.

## Code Quality Refactoring (September 2025)

A refactoring effort was initiated to improve the quality and robustness of the custom JavaScript files.

### Goals

- **No Functional Changes:** The core functionality of the scheduler application must remain unchanged.
- **Improve Code Quality:** Refactor `scheduler.js`, `admin.js`, and `dashboard.js` to adhere to better coding practices.
- **Robust Embedding:** The method of loading and initializing the scripts should be made more resilient to errors and less dependent on global state.
- **Avoid Global Namespace Pollution:** All custom scripts should be encapsulated to prevent conflicts with the numerous other scripts running on the Wix host page. This is achieved by wrapping all code in Immediately Invoked Function Expressions (IIFEs) and exposing modules through a single global namespace (`window.Greenhouse`).
