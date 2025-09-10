# Schedule

This directory contains the frontend code for the **Schedule** page of the main Greenhouse for Mental Health website:

👉 [https://greenhousementalhealth.org/schedule/](https://greenhousementalhealth.org/schedule/)

---

## How it works

The `Schedule.js` file contains Velo code that fetches a schedule of events from a static JSON file and displays them on the page in a repeater.

This is a change from the previous implementation, which included a Node.js server in this directory. The server has been replaced with a pure Velo frontend implementation to align with the new architecture of fetching data from a static source.

### Key Features:

-   **External Data Source**: The schedule is fetched from a JSON file hosted on GitHub Pages:
    ```
    https://drtamarojgreen.github.io/greenhouse_org/endpoints/schedule/main.json
    ```
-   **Dynamic List of Events**: The fetched events are displayed in a repeater element on the page.

### Velo Elements Used:

-   `$w("#scheduleRepeater")`: A repeater to display the list of events.
-   `$item("#eventTitle")`: A text element inside the repeater for the event title.
-   `$item("#eventDate")`: A text element for the event date.
-   `$item("#eventTime")`: A text element for the event time.
-   `$item("#eventDescription")`: A text element for the event description.

---

This approach makes the Schedule page lightweight and easy to update. New events can be added simply by updating the JSON file on GitHub.
