# Videos Path

This directory holds the frontend Velo code for running the videos section of the main site.

## How it works

The `Videos.js` file contains the Velo code that interacts with the backend to fetch and display videos from a YouTube feed on the `https://greenhousementalhealth.org/videos/` page.

### Example Velo Code for `Videos.js`:

```javascript
import { getLatestVideosFromFeed } from 'backend/getLatestVideosFromFeed';

$w.onReady(function () {
  loadVideos();
});

async function loadVideos() {
  try {
    const videos = await getLatestVideosFromFeed();
    // Code to display videos on the frontend
    console.log("Loaded videos:", videos);
  } catch (error) {
    console.error("Error loading videos:", error);
  }
}
```
