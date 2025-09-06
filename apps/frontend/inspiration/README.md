# Inspirational Quotes App

A simple web application that displays inspirational quotes.

## Wix Integration

This app integrates with the Wix backend to fetch quotes from a Wix Data Collection.

### Wix Data Collection

*   **Collection Name:** `InspirationalQuotes`
*   **Fields:**
    *   `text` (Text) - The quote itself.
    *   `author` (Text) - The author of the quote.
    *   `tags` (Array of Strings) - Tags for categorizing quotes (e.g., "motivation", "positivity").

## To Run

1.  Navigate to the `apps/frontend/inspiration` directory.
2.  Run `npm install` to install dependencies (currently none).
3.  Run `npm start` to start the server.
4.  Open a web browser and go to `http://localhost:3001`.