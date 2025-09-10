# Inspiration Path

This directory holds the frontend Velo code for running the inspiration section of the main site.

## How it works

The `Inspiration.js` file contains the Velo code that interacts with the backend to fetch and display inspirational quotes on the `https://greenhousementalhealth.org/inspiration/` page.

### Example Velo Code for `Inspiration.js`:

```javascript
import { getInspiration } from 'backend/getInspiration';

$w.onReady(function () {
  loadInspiration();
});

async function loadInspiration() {
  try {
    const quotes = await getInspiration();
    // Code to display quotes on the frontend
    console.log("Loaded inspirational quotes:", quotes);
  } catch (error) {
    console.error("Error loading inspirational quotes:", error);
  }
}
```
