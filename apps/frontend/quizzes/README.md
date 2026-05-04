# Quizzes Application (Wix Frontend)

This directory contains the Velo code and instructions for integrating the Quizzes application into the Greenhouse Mental Health website.

## Integration Steps

1.  **Wix Editor Setup**:
    *   Navigate to the `/quizzes` page in the Wix Editor.
    *   Identify or create the container (Box) targeted by the selector:
        `#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div > section > div:nth-child(2) > div > section > div:nth-child(1)`
    *   Inside this container, add a **Text element**.
    *   Change the ID of the Text element to `hiddenQuizzesData`.
    *   (Optional but recommended) In the Properties panel, check **"Hidden on load"** and **"Collapsed on load"**.

2.  **Velo Code**:
    *   Open the Velo Code editor for the page.
    *   Copy and paste the contents of `Quizzes.js` into the page code section.
    *   This script will fetch the latest quiz data from the Greenhouse GitHub repository and inject it into the `hiddenQuizzesData` element.

3.  **Embedded App**:
    *   The `docs/js/greenhouse.js` script will automatically detect the `/quizzes` path and load `docs/js/quizzes.js`.
    *   `quizzes.js` will read the raw JSON data from the `#hiddenQuizzesData` element and render the interactive quiz interface.

## Data Source

The quiz content is managed in `docs/endpoints/quizzes.json`. Updating that file will reflect changes on the live site automatically.
