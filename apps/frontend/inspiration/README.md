# Inspiration

This directory contains the frontend code for the **Inspiration** page of the main Greenhouse for Mental Health website:

👉 [https://greenhousemd.org/inspiration/](https://greenhousemd.org/inspiration/)

---

## How it works

The `Inspiration.js` file contains Velo code that fetches inspirational quotes from a static JSON file and displays them on the page.

### Key Features:

-   **External Data Source**: Quotes are fetched from a JSON file hosted on GitHub Pages:
    ```
    https://drtamarojgreen.github.io/greenhouse_org/endpoints/inspiration/main.json
    ```
-   **Random Quote on Load**: When the page loads, a random quote is displayed.
-   **New Quote Button**: Users can click a "New Quote" button to display a different random quote.

### Velo Elements Used:

-   `$w("#quote-text")`: A text element to display the quote.
-   `$w("#quote-author")`: A text element to display the author of the quote.
-   `$w("#new-quote-btn")`: A button that the user can click to get a new quote.

---

This approach makes the Inspiration page lightweight and easy to update. New quotes can be added simply by updating the JSON file on GitHub, without needing to change any code in the Wix editor.
