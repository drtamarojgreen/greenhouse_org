// docs/js/test_integration.js
// This script will be loaded dynamically, so it cannot use ES module imports.
// Instead, it will use wixFetch to call backend functions.

// Function to call the backend test function
async function callTestBackend() {
    try {
        // Use wixFetch to call the backend function
        // The path is /_functions/ followed by the function name from the .jsw file
        const response = await wixFetch('/_functions/hello'); // Assuming testModule.jsw exports 'hello'
        if (!response.ok) {
            throw new Error(`Backend call failed: ${response.statusText}`);
        }
        const message = await response.json(); // Assuming the backend returns JSON
        console.log("Test Module Response (via wixFetch):", message);
    } catch (error) {
        console.error("Test Module Error (via wixFetch):", error);
    }
}

// Call the test function when the script loads
callTestBackend();