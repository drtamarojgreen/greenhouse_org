# Videos

This directory contains the frontend code for the **Videos** page of the main Greenhouse for Mental Health website:

👉 [https://greenhousementalhealth.org/videos/](https://greenhousementalhealth.org/videos/)

---

## How it works

The `Videos.js` file contains Velo code that fetches a list of videos from a static JSON file and displays them on the page in a repeater.

### Key Features:

-   **External Data Source**: The video list is fetched from a JSON file hosted on GitHub Pages:
    ```
    https://drtamarojgreen.github.io/greenhouse_org/endpoints/videos/main.json
    ```
-   **Dynamic List of Videos**: The fetched videos are displayed in a repeater element on the page.

### Velo Elements Used:

-   `$w("#videosRepeater")`: A repeater to display the list of videos.
-   `$item("#videoTitle")`: A text element inside the repeater for the video title.
-   `$item("#videoPlayer")`: A video player element to display the video.
-   `$item("#videoDescription")`: A text element for the video description.

---

This approach makes the Videos page lightweight and easy to update. New videos can be added simply by updating the JSON file on GitHub.
