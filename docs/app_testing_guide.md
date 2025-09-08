# Application Testing Guide for Greenhouse Mental Health Website Replicas

This guide provides a comprehensive overview of the Selenium-based test applications designed to verify the structural integrity and design consistency of replicas of the Greenhouse Mental Health website, specifically focusing on the dynamically loaded content for the Books, News, and Videos sections.

## 1. Introduction and Testing Philosophy

The Greenhouse Mental Health website, built on the Wix platform, often presents challenges for traditional end-to-end testing due to its dynamic nature and the use of computed (randomly generated) IDs and class selectors by the Wix framework. To address this, our approach focuses on testing the *structure* and *design* of our custom application components that are injected into the Wix pages.

These test applications are designed to run against local HTML replicas of the website pages. This allows for rapid, isolated testing of our frontend application's rendering without requiring a live deployment or complex backend setup. The tests ensure that:

*   Our custom application containers are correctly injected into the page.
*   The internal structure of our applications (e.g., headings, lists, individual items) is as expected.
*   Key design elements and content placeholders are present.
*   The applications load and render correctly in a browser environment.

### Selector Strategy: Focusing on Application-Defined Elements

A critical aspect of these tests is the selector strategy. We explicitly avoid using Wix-generated, computed IDs or class selectors (e.g., `comp-mf8vcxuk`, `wixui-column-strip__column`). Instead, we rely on IDs and classes that are *explicitly defined and controlled by our own JavaScript applications* (e.g., `greenhouse-app-container`, `books-list`, `greenhouse-news-item`). These are stable and predictable, reflecting our intended application structure rather than Wix's internal DOM representation.

## 2. Setup and Prerequisites

To run these tests, you will need:

*   **Python 3:** The test scripts are written in Python.
*   **Selenium WebDriver:** Install using `pip install selenium`.
*   **GeckoDriver:** For Firefox. Download the appropriate version for your operating system from [https://github.com/mozilla/geckodriver/releases](https://github.com/mozilla/geckodriver/releases) and place it in the `test/` directory alongside the test scripts, or ensure it's in your system's PATH.
*   **Local HTML Replicas:** The tests are configured to load local HTML files (e.g., `test/books.html`, `test/news.html`, `test/videos.html`). These files should be up-to-date replicas of the target pages from the live website, including all necessary `_files` subdirectories containing assets (CSS, JS, images).

## 3. General Usage

All test scripts are designed to run in **headless mode**, meaning the browser will not be visibly launched during execution. This is ideal for CI/CD environments and faster feedback.

To run a specific test script, navigate to the project's root directory in your terminal and execute it using Python's `unittest` module:

```bash
python3 -m unittest test/your_test_script.py
```

For example:

```bash
python3 -m unittest test/test_books_app.py
```

## 4. Detailed Script Explanations

### 4.1. `test/test_books_app.py`

**Purpose:** This script comprehensively tests the structural integrity and design elements of the Books application as rendered in a local HTML replica.

**What it Tests:**

*   **Main Application Container:** Verifies the presence of the top-level `<section id="greenhouse-app-container">` element, which is the primary injection point for our custom applications.
*   **View and Content Wrappers:** Checks for the existence of `<div class="greenhouse-books-view">` and `<div class="greenhouse-books-content">` within the main container, ensuring our internal layout structure is correct.
*   **Page Title:** Confirms the presence of an `<h2>` tag with the exact text "Greenhouse Books".
*   **Introductory Paragraph:** Verifies a `<p>` tag containing specific introductory text related to the books section.
*   **Books List Container:** Ensures the `<div id="books-list">` element is present, which is where individual book items are dynamically loaded.
*   **Individual Book Elements:** Waits for at least one `<div class="book">` element to appear within the `#books-list`. For each detected book element, it further verifies the presence of:
    *   An `<h3>` tag for the book title.
    *   A `<p>` tag for the author (optional, with a warning if not found).
    *   An `<img>` tag for the book cover (optional, with a warning if not found).

**How it Works:**

1.  Initializes a headless Firefox WebDriver.
2.  Loads `test/books.html` from the local filesystem.
3.  Uses `WebDriverWait` and `expected_conditions` to wait for the dynamic content to be rendered by the `books.js` script.
4.  Employs `By.CSS_SELECTOR`, `By.ID`, `By.CLASS_NAME`, `By.TAG_NAME`, and `By.XPATH` to precisely locate elements based on their application-defined attributes and text content.
5.  Uses `unittest` assertions (`assertIsNotNone`, `assertEqual`, `assertGreater`) to validate the presence, content, and count of elements.

**Implementation for Live Site Testing:**

To adapt this script for testing the live website, you would modify the `html_file_url` in the `setUp` method to point to the live URL of the books page:

```python
# In setUp method of TestBooksApp
# self.html_file_url = 'https://www.greenhousementalhealth.org/books'
```

### 4.2. `test/test_news_app.py`

**Purpose:** This script comprehensively tests the structural integrity and design elements of the News application.

**What it Tests:**

*   **Main Application Container:** Verifies `<section id="greenhouse-app-container">`.
*   **View and Content Wrappers:** Checks for `<div class="greenhouse-news-view">` and `<div class="greenhouse-news-content">`.
*   **Page Title:** Confirms `<h2>` with "Greenhouse News".
*   **Introductory Paragraph:** Verifies a `<p>` tag with specific news-related introductory text.
*   **News List Container:** Ensures `<div id="news-list" class="greenhouse-layout-container">` is present.
*   **Individual News Elements:** Waits for at least one `<div class="greenhouse-news-item">` within `#news-list`. For each news item, it verifies:
    *   An `<h3>` tag with `class="greenhouse-news-title"`.
    *   A `<p>` tag with `class="greenhouse-news-date"`.
    *   A `<p>` tag (without a class) for the news description.
    *   An optional `<a>` tag for a "Read More" link.

**How it Works:**

Similar to `test_books_app.py`, it initializes a headless Firefox WebDriver, loads `test/news.html`, waits for dynamic content, and uses various Selenium locators and `unittest` assertions to validate the page's structure.

**Implementation for Live Site Testing:**

Modify the `html_file_url` in `setUp` to the live news page URL:

```python
# In setUp method of TestNewsApp
# self.html_file_url = 'https://www.greenhousementalhealth.org/news'
```

### 4.3. `test/test_videos_app.py`

**Purpose:** This script comprehensively tests the structural integrity and design elements of the Videos application.

**What it Tests:**

*   **Main Application Container:** Verifies `<section id="greenhouse-app-container">`.
*   **View and Content Wrappers:** Checks for `<div class="greenhouse-videos-view">` and `<div class="greenhouse-videos-content">`.
*   **Page Title:** Confirms `<h2>` with "Greenhouse Shorts".
*   **Introductory Paragraph:** Verifies a `<p>` tag with specific video-related introductory text.
*   **Videos List Container:** Ensures `<div id="videos-list" class="greenhouse-layout-container">` is present.
*   **Individual Video Elements:** Waits for at least one `<div class="greenhouse-video-item">` within `#videos-list`. For each video item, it verifies:
    *   An `<h3>` tag with `class="greenhouse-video-title"`.
    *   An `<iframe>` tag with `class="greenhouse-video-player"` for the embedded video.
    *   A `<p>` tag (without a class) for the video description.

**How it Works:**

Similar to the other test scripts, it initializes a headless Firefox WebDriver, loads `test/videos.html`, waits for dynamic content, and uses various Selenium locators and `unittest` assertions to validate the page's structure.

**Implementation for Live Site Testing:**

Modify the `html_file_url` in `setUp` to the live videos page URL:

```python
# In setUp method of TestVideosApp
# self.html_file_url = 'https://www.greenhousementalhealth.org/videos'
```

## 5. Extending Tests

These tests provide a strong foundation for structural and design verification. To make them even more comprehensive, you can extend them to include:

*   **Functional Testing:** Simulate user interactions (e.g., clicking buttons, submitting forms, playing videos) and verify the resulting behavior.
*   **Data Validation:** If the applications fetch data from a backend, you can add assertions to verify the content of the displayed data against expected values.
*   **Responsiveness Testing:** Use different browser window sizes or device emulation to test how the layout adapts to various screen dimensions.
*   **Performance Metrics:** Integrate tools to measure page load times, rendering performance, and other user experience metrics.

## 6. Limitations

*   **Local Replicas:** While useful for isolated structural testing, local HTML replicas may not perfectly replicate all aspects of the live Wix environment (e.g., complex Wix-specific JavaScript interactions, backend integrations).
*   **Dynamic Content:** Tests rely on `WebDriverWait` to account for dynamic content loading. If content loading mechanisms change significantly, tests may require updates.
*   **Backend Integration:** These tests primarily focus on frontend rendering. Full end-to-end testing involving backend data fetching would require running against a live or staged environment with a functional backend.

This guide should serve as a valuable resource for maintaining the quality and consistency of the Greenhouse Mental Health website's custom application components. 