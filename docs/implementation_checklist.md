# Implementation Checklist for New Apps

This checklist outlines the steps required to integrate the new 'Books', 'Inspiration', and 'News' applications into the Greenhouse Mental Health Wix website.

## Books App Integration

- [ ] **Wix Page Setup for Books:**
    - [ ] Create a new page on the Wix website for the Books app (e.g., `/books`).
    - [ ] Add an HTML element (e.g., `<div id="books-app-container"></div>`) to the Wix Books page. This will be the injection point for the app's content.
- [ ] **Frontend Asset Accessibility for Books:**
    - [ ] Ensure the content of `apps/frontend/books/index.html` is either directly embedded into the Wix page or served from an accessible location.
    - [ ] Ensure `apps/frontend/books/style.css` is accessible (e.g., uploaded to Wix as custom code or served from a CDN).
- [ ] **Update `greenhouse.js` for Books:**
    - [ ] Modify `greenhouse.js` to detect the `/books` URL.
    - [ ] Dynamically load `apps/frontend/books/index.js` when the `/books` URL is detected.
    - [ ] Pass `data-target-selector="#books-app-container"` (or your chosen ID) and `data-base-url` (if needed) to the loaded `index.js` script.
    - [ ] Dynamically load `apps/frontend/books/style.css` and inject it into the `<head>`.
- [ ] **Deploy Backend for Books:**
    - [ ] Deploy `apps/wv/backend/getBooks.web.js` to the Wix Velo backend.

## Inspiration App Integration

- [ ] **Wix Page Setup for Inspiration:**
    - [ ] Create a new page on the Wix website for the Inspiration app (e.g., `/inspiration`).
    - [ ] Add an HTML element (e.g., `<div id="inspiration-app-container"></div>`) to the Wix Inspiration page. This will be the injection point for the app's content.
- [ ] **Frontend Asset Accessibility for Inspiration:**
    - [ ] Ensure the content of `apps/frontend/inspiration/index.html` is either directly embedded into the Wix page or served from an accessible location.
    - [ ] Ensure `apps/frontend/inspiration/style.css` is accessible (e.g., uploaded to Wix as custom code or served from a CDN).
- [ ] **Update `greenhouse.js` for Inspiration:**
    - [ ] Modify `greenhouse.js` to detect the `/inspiration` URL.
    - [ ] Dynamically load `apps/frontend/inspiration/index.js` when the `/inspiration` URL is detected.
    - [ ] Pass `data-target-selector="#inspiration-app-container"` (or your chosen ID) and `data-base-url` (if needed) to the loaded `index.js` script.
    - [ ] Dynamically load `apps/frontend/inspiration/style.css` and inject it into the `<head>`.
- [ ] **Deploy Backend for Inspiration:**
    - [ ] Deploy `apps/wv/backend/getInspiration.web.js` to the Wix Velo backend.

## News App Integration

- [ ] **Wix Page Setup for News:**
    - [ ] Create a new page on the Wix website for the News app (e.g., `/news`).
    - [ ] Add an HTML element (e.g., `<div id="news-app-container"></div>`) to the Wix News page. This will be the injection point for the app's content.
- [ ] **Frontend Asset Accessibility for News:**
    - [ ] Ensure the content of `apps/frontend/news/index.html` is either directly embedded into the Wix page or served from an accessible location.
    - [ ] Ensure `apps/frontend/news/style.css` is accessible (e.g., uploaded to Wix as custom code or served from a CDN).
- [ ] **Update `greenhouse.js` for News:**
    - [ ] Modify `greenhouse.js` to detect the `/news` URL.
    - [ ] Dynamically load `apps/frontend/news/index.js` when the `/news` URL is detected.
    - [ ] Pass `data-target-selector="#news-app-container"` (or your chosen ID) and `data-base-url` (if needed) to the loaded `index.js` script.
    - [ ] Dynamically load `apps/frontend/news/style.css` and inject it into the `<head>`.
- [ ] **Deploy Backend for News:**
    - [ ] Deploy `apps/wv/backend/getNews.web.js` to the Wix Velo backend.