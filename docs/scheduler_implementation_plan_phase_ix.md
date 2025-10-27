# Wix Velo Scheduler: Implementation Plan - Phase IX: Performance, Scalability, and Monitoring

A high-performance, reliable system is critical. The strategy is multi-layered, addressing backend, frontend, and operational concerns.

### 9.1. Caching Strategy

-   **Target Data:** Static or slowly-changing data from external APIs.
    -   **Therapist Profiles & Availability:** Cache using `wix-cache-backend` with a Time-to-Live (TTL) of **15 minutes**. Key by therapist ID.
    -   **Service Lists:** Cache using `wix-cache-backend` with a TTL of **1 hour**.
-   **Implementation:** Create a dedicated backend module `caching.jsw` that wraps `wix-cache-backend`. All data-fetching functions will first check this module for a valid cache entry before making an external API call.
-   **Cache Invalidation:** Implement a mechanism to manually invalidate the cache (e.g., an admin function `invalidateCache(key)`) for immediate updates.

### 9.2. API Throttling and Queueing

-   **Problem:** External APIs have strict rate limits. Direct, immediate calls risk exceeding these limits during high traffic or bulk operations.
-   **Solution:** Implement a **job queue** using a dedicated Wix Data Collection (`APIWriteQueue`).
    -   **Schema:** `jobId`, `targetSystem`, `payload`, `status (pending, processed, failed)`, `attempts`.
    -   **Workflow:**
        1.  Instead of a direct API call, backend functions will insert a job record into the `APIWriteQueue`.
        2.  A **scheduled job** (running every 1 minute via `jobs.config`) will query for `pending` jobs.
        3.  The job will process a small batch (e.g., 5-10 jobs) per run, making the actual external API calls. This naturally throttles the rate.
        4.  Implement a retry mechanism with exponential backoff for failed jobs.

### 9.3. Frontend Optimization

-   **Initial Load:** The main calendar view must load quickly.
    -   **Lazy Loading:** Initially, only load appointment data for the current week/month.
    -   **Skeleton UI:** Display a "skeleton" or ghost version of the calendar grid while the initial data is being fetched.
-   **Data Binding:** Use efficient data binding to update the calendar. For repeaters, only update the items that have changed rather than re-rendering the entire list.
-   **Debouncing:** Apply a debounce of **300ms** to user input on filter controls to prevent a flood of backend requests as the user types or selects options.

### 9.4. Monitoring and Alerting Strategy

-   **Key Performance Indicators (KPIs):**
    -   **API Latency:** P95 latency for all external API calls (e.g., `Zocdoc_GetAppointments_ms`).
    -   **Error Rate:** Percentage of failed external API calls and backend function executions.
    -   **Queue Depth:** Number of pending jobs in the `APIWriteQueue`.
-   **Implementation:**
    -   Use `wix-site-monitoring` to track these KPIs.
    -   **Custom Events:** From the backend, fire custom events like `wixSiteMonitoring.logCustom("Zocdoc_GetAppointments", { latency: 1200, success: true })`.
-   **Alerting Rules:**
    -   `CRITICAL`: If Error Rate > 5% for 10 minutes.
    -   `WARNING`: If P95 latency for `getAggregatedCalendar` > 2000ms for 5 minutes.
    -   `WARNING`: If `APIWriteQueue` depth > 50.
