# News Path

This directory holds the frontend Velo code for running the news section of the main site.

## How it works

The `News.js` file contains the Velo code that interacts with the backend to fetch and display news articles on the `https://greenhousementalhealth.org/news/` page.

### Example Velo Code for `News.js`:

```javascript
import { getNews } from 'backend/getNews';

$w.onReady(function () {
  loadNews();
});

async function loadNews() {
  try {
    const newsArticles = await getNews();
    // Code to display news articles on the frontend
    console.log("Loaded news articles:", newsArticles);
  } catch (error) {
    console.error("Error loading news articles:", error);
  }
}
```
