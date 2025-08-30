# YouTube Feed Service Endpoints

This document details the backend functions exposed by the `youtubeFeed.jsw` web module, accessible from the Wix Velo frontend. This service simulates fetching and parsing a YouTube channel's RSS feed for video information.

## `getLatestVideosFromFeed()`

### Description
Retrieves a list of the latest videos from the YouTube channel's RSS feed. In a real implementation, this would involve fetching and parsing the XML content of the RSS feed.

### Parameters
None.

### Returns
`Promise<Array<Object>>` - A promise that resolves to an array of video objects. Each object typically contains:
-   `id`: (String) Unique identifier for the video.
-   `title`: (String) The title of the video.
-   `description`: (String) A brief description or excerpt of the video.
-   `link`: (String) The direct URL to the YouTube video.
-   `published`: (String) The publication date of the video (ISO 8601 format).

### Example Frontend Usage
```javascript
import { getLatestVideosFromFeed } from 'backend/youtubeFeed';

$w.onReady(function () {
  loadYouTubeFeed();
});

async function loadYouTubeFeed() {
  try {
    const videos = await getLatestVideosFromFeed();
    console.log('Latest YouTube Videos:', videos);
    // Example: Bind to a repeater or display in a gallery
    // $w("#videoRepeater").data = videos;
  } catch (error) {
    console.error('Failed to fetch YouTube feed:', error);
  }
}
```