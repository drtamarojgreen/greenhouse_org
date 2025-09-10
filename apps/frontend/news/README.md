# News

This directory contains the frontend code for the **News** page of the main Greenhouse for Mental Health website:

👉 [https://greenhousementalhealth.org/news/](https://greenhousementalhealth.org/news/)

---

## How it works

The `News.js` file contains Velo code that fetches a list of news articles from a static JSON file and displays them on the page in a repeater.

### Key Features:

-   **External Data Source**: The news list is fetched from a JSON file hosted on GitHub Pages:
    ```
    https://drtamarojgreen.github.io/greenhouse_org/endpoints/news/main.json
    ```
-   **Dynamic List of Articles**: The fetched articles are displayed in a repeater element on the page.

### Velo Elements Used:

-   `$w("#newsRepeater")`: A repeater to display the list of articles.
-   `$item("#newsTitle")`: A text element inside the repeater for the article title. This element is also configured to link to the article's URL.
-   `$item("#newsSource")`: A text element for the article source.
-   `$item("#newsDate")`: A text element for the article date.

---

This approach makes the News page lightweight and easy to update. New articles can be added simply by updating the JSON file on GitHub.
