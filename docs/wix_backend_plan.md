To access a function from a `getLogic.web.js` file in the backend folder from your site's frontend JavaScript, follow these steps:

1. Define the web method in your `getLogic.web.js` file:

```javascript
// backend/getLogic.web.js
export function myBackendFunction(param) {
  return `Hello, ${param}!`;
}
```

2. Call the web method from your frontend code:

```javascript
// frontend code (e.g., in a page's code or a public file)
import { myBackendFunction } from 'backend/getLogic';

$w.onReady(function () {
  myBackendFunction('World')
    .then(response => {
      console.log(response); // Should log: "Hello, World!"
    })
    .catch(error => {
      console.error(error);
    });
});
```

Here's a breakdown of the steps:

1. Define the Web Method:
   - In your `backend/getLogic.web.js` file, define the function you want to call from the frontend. Use the `export` keyword to make it accessible.

2. Call the Web Method:
   - In your frontend code, import the function using the path `backend/getLogic`.
   - Use the function as a promise, handling the response and any potential errors.

This setup allows you to call backend functions from your frontend code seamlessly.

### Strategy to update `docs/js` files:

To update the existing `docs/js` files to utilize this method, follow these steps:

1.  **Identify Backend Logic:** Review the `apps/wv/backend/` directory to identify existing `.web.js` files that contain functions currently being called directly or indirectly from the frontend. Also, identify any logic within the `docs/js` files that should ideally reside in the backend for better separation of concerns, security, or performance.

2.  **Create/Modify `.web.js` Files:**
    *   For existing backend functions in `apps/wv/backend/`, ensure they are properly `export`ed.
    *   For frontend logic identified in step 1 that needs to be moved to the backend, create new `.web.js` files (e.g., `apps/wv/backend/myNewLogic.web.js`) and define the functions with `export`.

3.  **Update Frontend `docs/js` Files:**
    *   For each `docs/js` file that needs to call a backend function:
        *   Add an `import` statement at the top of the file, referencing the backend module. For example:
            ```javascript
            import { myBackendFunction } from 'backend/getLogic';
            ```
            (Note: The path should reflect the actual backend file name without the `.web.js` extension).
        *   Replace direct calls to backend services or inline backend logic with calls to the imported web method.
        *   Ensure that the calls are wrapped in `.then()` and `.catch()` blocks to handle the asynchronous nature of web methods and potential errors.

4.  **Testing:** Thoroughly test all updated frontend and backend interactions to ensure that data is being passed correctly, responses are handled as expected, and no new errors are introduced.

This approach will help standardize the communication between the frontend and backend, leveraging Wix's web module capabilities.
