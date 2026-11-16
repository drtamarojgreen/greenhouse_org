# Guides Service Endpoints

This document details the backend functions exposed by the `guides.jsw` web module, accessible from the Wix Velo frontend.

## `getGuides()`

### Description
Retrieves a comprehensive list of all available self-help guides and toolkits on the platform.

### Parameters
None.

### Returns
`Promise<Array<Object>>` - A promise that resolves to an array of guide objects. Each object typically contains:
-   `id`: (String) Unique identifier for the guide.
-   `title`: (String) The title of the guide.
-   `description`: (String) A brief description of the guide.
-   `fileUrl`: (String) The URL to download the guide (e.g., PDF).
-   `category`: (String) The category the guide belongs to.
-   `tags`: (Array<String>) An array of keywords or tags associated with the guide.

### Example Frontend Usage
```javascript
import { getGuides } from 'backend/guides';

async function fetchAllGuides() {
  try {
    const guides = await getGuides();
    console.log('All Guides:', guides);
  } catch (error) {
    console.error('Failed to fetch guides:', error);
  }
}
```

---

## `getGuideById(guideId)`

### Description
Retrieves the details of a specific self-help guide or toolkit by its unique identifier.

### Parameters
-   `guideId`: (String, required) The unique ID of the guide to retrieve.

### Returns
`Promise<Object>` - A promise that resolves to a guide object, or `undefined` if not found.

### Example Frontend Usage
```javascript
import { getGuideById } from 'backend/guides';

async function fetchSpecificGuide() {
  const guideData = await getGuideById('1');
  if (guideData) {
    console.log('Loaded Guide:', guideData.title);
  } else {
    console.log('Guide not found.');
  }
}
```