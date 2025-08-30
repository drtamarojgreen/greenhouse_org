# Wix Velo Backend Services for Greenhouse Mental Health

This directory (`apps/wv/`) contains backend web modules (`.jsw` files) that expose various functionalities for the Greenhouse Mental Health website, built using Wix Velo. These services allow the frontend (pages, components, custom elements) to interact with data and perform operations securely.

## How to Access Backend Services from Your Wix Site

Backend functions defined in `.jsw` files within the `backend` folder are automatically exposed as web modules. You can import and call these functions directly from your site's page code, public files, or custom elements.

### 1. Importing Backend Functions

To use a backend function, import it at the top of your frontend code file (e.g., a page's code, a public `.js` file, or a custom element's `.js` file). The path is relative to the `backend` folder.

**Example: Importing `getFAQs` from `faqs.jsw`**

```javascript
import { getFAQs } from 'backend/faqs'; // Path: backend/faqs.jsw
```

**Example: Importing `getQuiz` from `quizzes.jsw`**

```javascript
import { getQuiz } from 'backend/quizzes'; // Path: backend/quizzes.jsw
```

### 2. Calling Backend Functions

Once imported, you can call these functions like any other asynchronous JavaScript function. They return Promises, so you should use `async/await` for cleaner code.

**Example: Calling `getFAQs` and displaying data**

```javascript
import { getFAQs } from 'backend/faqs';

$w.onReady(function () {
  loadFAQs();
});

async function loadFAQs() {
  try {
    const faqs = await getFAQs();
    // Assuming you have a Repeater or text elements to display the FAQs
    // Example: $w("#faqRepeater").data = faqs;
    console.log("Fetched FAQs:", faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    // Handle error, e.g., display an error message to the user
  }
}
```

**Example: Calling `submitQuizResults`**

```javascript
import { submitQuizResults } from 'backend/quizzes';

async function handleQuizSubmission(quizId, answers) {
  try {
    const result = await submitQuizResults(quizId, answers);
    if (result.success) {
      console.log("Quiz submitted successfully:", result.feedback);
      // Update UI with feedback
    } else {
      console.error("Quiz submission failed:", result.message);
      // Display error to user
    }
  } catch (error) {
    console.error("Error submitting quiz:", error);
    // Handle network or backend errors
  }
}
```

### Important Considerations:

*   **Asynchronous Operations**: All backend calls are asynchronous.
*   **Error Handling**: Always wrap backend calls in `try...catch` blocks to handle potential errors.
*   **Data Validation**: Implement robust data validation on both the frontend and backend to ensure data integrity and security.
*   **Security**: Backend functions run in a secure environment. Only expose data and operations that are safe for the frontend to access. For sensitive operations (e.g., adding/updating data), ensure proper authentication and authorization checks within your backend functions.

## Available Backend Services

Currently, the following backend services are available:

*   `faqs.jsw`: Provides functions to retrieve and manage Frequently Asked Questions.
    *   `getFAQs()`: Retrieves a list of all FAQs.
    *   `addFAQ(newFAQ)`: Adds a new FAQ (requires appropriate permissions).
*   `quizzes.jsw`: Provides functions to retrieve and manage interactive quizzes.
    *   `getQuiz(quizId)`: Retrieves a specific quiz by its ID.
    *   `submitQuizResults(quizId, answers)`: Submits user answers for a quiz and returns feedback.
*   `guides.jsw`: Provides functions to retrieve and manage self-help guides and toolkits.
    *   `getGuides()`: Retrieves a list of all guides.
    *   `getGuideById(guideId)`: Retrieves a specific guide by its ID.
## Available Backend Services

Currently, the following backend services are available:

*   `faqs.jsw`: Provides functions to retrieve and manage Frequently Asked Questions.
    *   `getFAQs()`: Retrieves a list of all FAQs.
    *   `addFAQ(newFAQ)`: Adds a new FAQ (requires appropriate permissions).
*   `quizzes.jsw`: Provides functions to retrieve and manage interactive quizzes.
    *   `getQuiz(quizId)`: Retrieves a specific quiz by its ID.
    *   `submitQuizResults(quizId, answers)`: Submits user answers for a quiz and returns feedback.
*   `guides.jsw`: Provides functions to retrieve and manage self-help guides and toolkits.
    *   `getGuides()`: Retrieves a list of all guides.
    *   `getGuideById(guideId)`: Retrieves a specific guide by its ID.
*   `eventCalendars.jsw`: Provides functions to retrieve and manage event data.
    *   `getEvents(filter)`: Retrieves a list of events, with optional filtering.
    *   `getEventById(eventId)`: Retrieves a specific event by its ID.
    *   `registerForEvent(eventId, registrationDetails)`: Registers a user for an event.

More services will be added as new applications are developed.
*   `eventCalendars.jsw`: Provides functions to retrieve and manage event data.
    *   `getEvents(filter)`: Retrieves a list of events, with optional filtering.
    *   `getEventById(eventId)`: Retrieves a specific event by its ID.
    *   `registerForEvent(eventId, registrationDetails)`: Registers a user for an event.

More services will be added as new applications are developed.
