# Quizzes Service Endpoints

This document details the backend functions exposed by the `quizzes.jsw` web module, accessible from the Wix Velo frontend.

## `getQuiz(quizId)`

### Description
Retrieves the details of a specific interactive quiz by its unique identifier.

### Parameters
-   `quizId`: (String, required) The unique ID of the quiz to retrieve.

### Returns
`Promise<Object>` - A promise that resolves to a quiz object. The object typically contains:
-   `id`: (String) Unique identifier for the quiz.
-   `title`: (String) The title of the quiz.
-   `description`: (String) A brief description of the quiz.
-   `questions`: (Array<Object>) An array of question objects, each with `id`, `text`, and `options`.
-   `getScore`: (Function) A function (defined on the backend) to calculate the score from answers.
-   `getFeedback`: (Function) A function (defined on the backend) to generate feedback based on the score.

### Example Frontend Usage
```javascript
import { getQuiz } from 'backend/quizzes';

async function loadSpecificQuiz() {
  const quizData = await getQuiz('mental-health-check');
  if (quizData) {
    console.log('Loaded Quiz:', quizData.title);
    // Render quiz questions on the page
  } else {
    console.log('Quiz not found.');
  }
}
```

---

## `submitQuizResults(quizId, answers)`

### Description
Submits a user's answers for a given quiz, processes them, and returns feedback. This function can also be used to anonymously log quiz results for analytics.

### Parameters
-   `quizId`: (String, required) The unique ID of the quiz for which results are being submitted.
-   `answers`: (Object, required) An object where keys are question IDs and values are the user's selected answers (e.g., `{ "q1": 1, "q2": 0 }`).

### Returns
`Promise<Object>` - A promise that resolves to an object containing the submission status, score, and feedback.
-   `success`: (Boolean) `true` if the submission was processed, `false` otherwise.
-   `score`: (Number, optional) The calculated score for the quiz.
-   `feedback`: (String, optional) Textual feedback based on the score.
-   `message`: (String, optional) A descriptive message, especially if `success` is `false`.

### Example Frontend Usage
```javascript
import { submitQuizResults } from 'backend/quizzes';

async function sendQuizAnswers() {
  const userAnswers = {
    "q1": 1, // Example answer for question 1
    "q2": 0  // Example answer for question 2
  };
  try {
    const result = await submitQuizResults('mental-health-check', userAnswers);
    if (result.success) {
      console.log('Quiz results:', result.score, result.feedback);
    } else {
      console.error('Quiz submission error:', result.message);
    }
  } catch (error) {
    console.error('Error submitting quiz results:', error);
  }
}
```