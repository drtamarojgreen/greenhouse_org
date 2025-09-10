# Projects

This directory contains the frontend code for the **Projects** page of the main Greenhouse for Mental Health website:

👉 [https://greenhousementalhealth.org/projects/](https://greenhousementalhealth.org/projects/)

---

## What makes this page different?

Unlike other pages on the site (for example, the **Books**, **News**, or **Videos** views), the **Projects** page does **not** rely on dynamic data coming from the Wix backend or other managed content collections.

Instead, this page is intentionally designed to be **lightweight, standalone, and directly connected to an external data source**.

- All project information is **fetched directly from GitHub Pages**, specifically from the following endpoint:  
  ```
  https://github.io/drtamarojgreen/greenhouse_org/endppoints/
  ```
- This means that the content displayed on the Projects page is driven entirely by static JSON (or other structured data files) hosted on GitHub.  
- There is **no dependency on Wix CMS collections, backend APIs, or database lookups**.

---

## Why is it designed this way?

The Projects page is meant to serve as a **living portfolio** of community and development initiatives. Using GitHub as the source of truth provides several benefits:

1. **Transparency** – Anyone can view the raw project data on GitHub.  
2. **Version Control** – All changes to the projects list are tracked in Git via commits.  
3. **Lightweight Integration** – The frontend simply fetches static files, avoiding complex backend queries.  
4. **Decentralization** – Updates can be pushed directly through GitHub without requiring changes in the Wix editor.

---

## How it works (Step by Step)

1. When the Projects page loads, a JavaScript function runs in the browser.  
2. That function makes a `fetch()` call to the GitHub-hosted endpoint:  
   ```
   https://github.io/drtamarojgreen/greenhouse_org/endppoints/
   ```
3. The response is parsed (usually JSON) and rendered into the Projects grid on the page.  
4. If the fetch fails (for example, if GitHub Pages is temporarily unavailable), an error message is displayed using the shared `GreenhouseUtils` helper functions.

---

## Key Difference Summary

- **Other pages**: Use Wix backend collections or APIs.  
- **Projects page**: Uses **only GitHub-hosted static data**, no Wix backend at all.  

This separation makes the Projects page **simpler, faster, and more independent**, while still being fully integrated into the main Greenhouse for Mental Health website.

