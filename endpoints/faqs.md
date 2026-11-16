# FAQs Service Endpoints

This document details the backend functions exposed by the `faqs.jsw` web module, accessible from the Wix Velo frontend.

## `getFAQs()`

### Description
Retrieves a comprehensive list of all Frequently Asked Questions (FAQs) available on the platform.

### Parameters
None.

### Returns
`Promise<Array<Object>>` - A promise that resolves to an array of FAQ objects. Each object typically contains:
-   `id`: (String) Unique identifier for the FAQ.
-   `question`: (String) The question text.
-   `answer`: (String) The answer text.

### Example Frontend Usage
```javascript
import { getFAQs } from 'backend/faqs';

async function fetchAllFAQs() {
  try {
    const faqs = await getFAQs();
    console.log('All FAQs:', faqs);
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
  }
}
```

---

## `addFAQ(newFAQ)`

### Description
Adds a new Frequently Asked Question to the platform. This function typically requires appropriate user permissions (e.g., admin access) to prevent unauthorized modifications.

### Parameters
-   `newFAQ`: (Object) An object representing the new FAQ to be added.
    -   `question`: (String, required) The question text for the new FAQ.
    -   `answer`: (String, required) The answer text for the new FAQ.
    -   (Optional) Other properties as defined by your FAQ data structure.

### Returns
`Promise<Object>` - A promise that resolves to an object indicating the success or failure of the operation.
-   `success`: (Boolean) `true` if the FAQ was added successfully, `false` otherwise.
-   `message`: (String) A descriptive message about the operation's outcome.
-   `newFAQId`: (String, optional) The ID of the newly created FAQ, if successful.

### Example Frontend Usage
```javascript
import { addFAQ } from 'backend/faqs';

async function addNewQuestion() {
  const newFaqData = {
    question: "What are your operating hours?",
    answer: "Our virtual office is open Monday to Friday, 9 AM to 5 PM EST."
  };
  try {
    const result = await addFAQ(newFaqData);
    if (result.success) {
      console.log('FAQ added:', result.message, result.newFAQId);
    } else {
      console.error('Failed to add FAQ:', result.message);
    }
  } catch (error) {
    console.error('Error adding FAQ:', error);
  }
}
```