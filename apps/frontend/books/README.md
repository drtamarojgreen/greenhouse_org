# Books Path

This directory holds the frontend Velo code for running the books section of the main site.

## How it works

The `Books.js` file contains the Velo code that interacts with the backend to fetch and display book recommendations on the `https://greenhousementalhealth.org/books/` page.

### Example Velo Code for `Books.js`:

```javascript
import { getBooks } from 'backend/getBooks';

$w.onReady(function () {
  loadBooks();
});

async function loadBooks() {
  try {
    const books = await getBooks();
    // Code to display books on the frontend
    console.log("Loaded books:", books);
  } catch (error) {
    console.error("Error loading books:", error);
  }
}
```
