// Version: 0.0.1
/**
* @file news.js
* @description This script contains the core functionality for the Greenhouse news application.
* It is responsible for rendering the various news views and handling
* user interactions within those views.
*
* @integration This script is not loaded directly by the host page. Instead, it is loaded by `greenhouse.js`
* when the news application is needed. `green-house.js` passes the target selector for rendering
* via a `data-target-selector` attribute on the script tag. This design allows the news app to be
* a self-contained module that can be easily dropped into any page without requiring manual
* configuration or initialization.
*
* @design The script is designed to be completely anonymous and self-contained. It uses an Immediately
* Invoked Function Expression (IIFE) to avoid polluting the global namespace. It also uses a
* data-driven approach to receive information from the loader script, further decoupling the application
* from the loader. This design is crucial for preventing conflicts with other scripts on the site,
* which is known to be sensitive to global namespace pollution.
*/

(function() {
'use strict';

console.log("Loading Greenhouse News - Version 0.1.0");

/**
* @description Configuration for the news application
*/
const config = {
/**
* Timeout for waiting for elements and resources (in milliseconds)
*/
loadTimeout: 15000,
/**
* Retry configuration for failed operations
*/
retries: {
maxAttempts: 3,
delay: 1000
},
/**
* DOM manipulation settings
*/
dom: {
insertionDelay: 500, // Delay before inserting into DOM (for Wix compatibility)
observerTimeout: 10000
}
};

/**
* @description The script element that is currently being executed.
* This is used to retrieve configuration attributes from the loader script.
* @type {HTMLScriptElement}
*/
const scriptElement = document.currentScript;

/**
* Application state management
*/
const appState = {
isInitialized: false,
isLoading: false,
currentView: null,
currentAppInstance: null,
targetElement: null,
baseUrl: null,
targetSelector: null,
loadedScripts: new Set(),
errors: [],
hasCriticalError: false // New flag to track critical errors
};

/**
* @function validateConfiguration
* @description Validates the configuration passed from the loader script
* @returns {boolean} True if configuration is valid
*/
function validateConfiguration() {
const globalAttributes = window._greenhouseScriptAttributes || {};

// The news app uses a single target selector. We'll prioritize 'target-selector-left'.
appState.targetSelector = globalAttributes['target-selector-left']
|| scriptElement?.getAttribute('data-target-selector-left')
|| scriptElement?.getAttribute('data-target-selector');

appState.baseUrl = globalAttributes['base-url'] || scriptElement?.getAttribute('data-base-url');
const view = globalAttributes['view'] || scriptElement?.getAttribute('data-view');

// Fallback to GreenhouseUtils state if attributes are still missing
if (!appState.targetSelector && window.GreenhouseUtils && window.GreenhouseUtils.appState) {
appState.targetSelector = window.GreenhouseUtils.appState.targetSelectorLeft;
console.log('News: Falling back to GreenhouseUtils.appState.targetSelectorLeft');
}
if (!appState.baseUrl && window.GreenhouseUtils && window.GreenhouseUtils.appState) {
appState.baseUrl = window.GreenhouseUtils.appState.baseUrl;
console.log('News: Falling back to GreenhouseUtils.appState.baseUrl');
}

if (!appState.targetSelector) {
console.error('News: Missing required data-target-selector attribute');
return false;
}

if (!appState.baseUrl) {
console.error('News: Missing required data-base-url attribute');
return false;
}

// Ensure baseUrl ends with slash
if (!appState.baseUrl.endsWith('/')) {
appState.baseUrl += '/';
}

appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'default';

console.log(`News: Configuration validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
return true;
}

/**
* @function waitForElement
* @description Waits for an element to appear in the DOM
* @param {string} selector - CSS selector for the element
* @param {number} [timeout=10000] - Maximum time to wait in milliseconds
* @returns {Promise
*/
function waitForElement(selector, timeout = config.dom.observerTimeout) {
return new Promise((resolve, reject) => {
const element = document.querySelector(selector);
if (element) {
console.log(`News: Found target element immediately: ${selector}`);
return resolve(element);
}

console.log(`News: Waiting for target element: ${selector}`);

const observer = new MutationObserver(() => {
const element = document.querySelector(selector);
if (element) {
observer.disconnect();
console.log(`News: Target element found: ${selector}`);
resolve(element);
}
});

observer.observe(document.body, {
childList: true,
subtree: true
});

setTimeout(() => {
observer.disconnect();
reject(new Error(`Target element not found within ${timeout}ms: ${selector}`));
}, timeout);
});
}

/**
* @function retryOperation
* @description Retries an async operation with exponential backoff
* @param {Function} operation - The async operation to retry
* @param {string} operationName - Name for logging
* @param {number} [maxAttempts=3] - Maximum retry attempts
* @returns {Promise} Result of the operation
*/
async function retryOperation(operation, operationName, maxAttempts = config.retries.maxAttempts) {
let lastError;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
try {
console.log(`News: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
return await operation();
} catch (error) {
lastError = error;
console.warn(`News: ${operationName} failed on attempt ${attempt}:`, error.message);

if (attempt < maxAttempts) {
const delay = config.retries.delay * Math.pow(2, attempt - 1);
console.log(`News: Retrying ${operationName} in ${delay}ms...`);
await new Promise(resolve => setTimeout(resolve, delay));
}
}
}

throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
}

/**
* @namespace GreenhouseAppsNews
* @description The main object for the news application
*/
const GreenhouseAppsNews = {
/**
* @function fetchAndDisplayNews
* @description Fetches news data from the backend and displays it in the #news-list element.
*/
async fetchAndDisplayNews() {
const newsListElement = document.getElementById('news-list');
if (!newsListElement) {
console.error("News: #news-list element not found for displaying news.");
return;
}

while (newsListElement.firstChild) {
newsListElement.removeChild(newsListElement.firstChild);
}
newsListElement.appendChild(createElement('p', {}, 'Loading news...')); // Show loading state

try {
// Fetch from the external endpoint
const response = await fetch('https://drtamarojgreen.github.io/greenhouse_org/endpoints/news.json');
if (!response.ok) {
throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
const newsData = data.articles; // Use the 'articles' array

// Clear loading message and ensure the element is ready
while (newsListElement.firstChild) {
newsListElement.removeChild(newsListElement.firstChild);
}

if (newsData && newsData.length > 0) {
newsData.forEach(article => {
const newsElement = createElement('div', { className: 'news-article' },
createElement('h3', { className: 'news-headline' }, article.headline || 'Untitled Article'),
createElement('p', { className: 'news-date' }, article.date || ''),
createElement('p', { className: 'news-content' }, article.content || 'No content available.')
);
newsListElement.appendChild(newsElement);
});
} else {
newsListElement.appendChild(createElement('p', {}, 'No news articles available at this time.'));
}
this.observeNewsListElement(newsListElement); // Start observing after content is loaded
} catch (error) {
console.error("News: Error fetching news:", error);
// Display a less intrusive error message within the news list itself
while (newsListElement.firstChild) {
newsListElement.removeChild(newsListElement.firstChild);
}
newsListElement.appendChild(createElement('p', {}, `Failed to load news: ${error.message}.`));
this.showErrorMessage(`Failed to load news: ${error.message}`);
}
},

/**
* @function observeNewsListElement
* @description Observes the #news-list element for removal and re-renders if it disappears.
* @param {Element} elementToObserve - The #news-list element.
*/
observeNewsListElement(elementToObserve) {
if (!elementToObserve) return;

const observer = new MutationObserver((mutations) => {
let wasRemoved = false;
for (const mutation of mutations) {
if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
for (const removedNode of mutation.removedNodes) {
if (removedNode === elementToObserve) {
wasRemoved = true;
break;
}
if (removedNode.contains && removedNode.contains(elementToObserve)) {
wasRemoved = true;
break;
}
}
}
}

if (wasRemoved) {
console.warn('News: #news-list element was removed from DOM. Attempting to re-render.');
observer.disconnect(); // Disconnect old observer
// Re-initialize the app, which will re-render and re-fetch
appState.isInitialized = false;
appState.isLoading = false;
main();
}
});

// Observe the parent element for changes to its children
if (elementToObserve.parentElement) {
observer.observe(elementToObserve.parentElement, { childList: true, subtree: true });
console.log('News: Started observing #news-list element for changes.');
} else {
console.warn('News: Cannot observe #news-list element, no parent found.');
}
},

/**
* @function loadScript
* @description Dynamically loads a script with retry logic and caching
* @param {string} scriptName - The name of the script file (e.g., 'newsUI.js')
* @returns {Promise
*/
async loadScript(scriptName) {
// Check if script already loaded
if (appState.loadedScripts.has(scriptName)) {
console.log(`News: Script ${scriptName} already loaded, skipping`);
return;
}

const loadOperation = async () => {
const response = await fetch(`${appState.baseUrl}js/${scriptName}`);
if (!response.ok) {
throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
return await response.text();
};

try {
const scriptText = await retryOperation(
loadOperation,
`Loading script ${scriptName}`
);

// Avoid re-adding the script if it already exists in DOM
if (document.querySelector(`script[data-script-name="${scriptName}"]`)) {
console.log(`News: Script ${scriptName} already in DOM`);
appState.loadedScripts.add(scriptName);
return;
}

const scriptElement = document.createElement('script');
scriptElement.dataset.scriptName = scriptName;
scriptElement.dataset.loadedBy = 'greenhouse-news';
scriptElement.textContent = scriptText;
document.body.appendChild(scriptElement);

appState.loadedScripts.add(scriptName);
console.log(`News: Successfully loaded script ${scriptName}`);

} catch (error) {
console.error(`News: Failed to load script ${scriptName}:`, error);
throw error;
}
},

/**
* @function loadCSS
* @description Loads and applies CSS with error handling
* @returns {Promise
*/
async loadCSS() {
const loadOperation = async () => {
const response = await fetch(`${appState.baseUrl}css/news.css`);
if (!response.ok) {
throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
return await response.text();
};

try {
const cssText = await retryOperation(loadOperation, 'Loading CSS');

// Check if CSS already loaded
if (document.querySelector('style[data-greenhouse-news-css]')) {
console.log('News: CSS already loaded');
return;
}

const styleElement = document.createElement('style');
styleElement.setAttribute('data-greenhouse-news-css', 'true');
styleElement.textContent = cssText;
document.head.appendChild(styleElement);

console.log('News: CSS loaded successfully');

} catch (error) {
console.warn('News: Failed to load CSS, using fallback styles:', error);
this.loadFallbackCSS();
}
},

/**
* @function loadFallbackCSS
* @description Loads minimal fallback CSS if main CSS fails
*/
loadFallbackCSS() {
const fallbackCSS = `
.greenhouse-layout-container { display: flex; flex-wrap: wrap; gap: 20px; }
.greenhouse-form-panel { flex: 1; min-width: 300px; }
.greenhouse-instructions-panel { flex: 1; min-width: 250px; }
.greenhouse-form-field { margin-bottom: 15px; }
.greenhouse-form-label { display: block; margin-bottom: 5px; font-weight: bold; }
.greenhouse-form-input, .greenhouse-form-select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.greenhouse-form-submit-btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.greenhouse-form-error { color: red; font-size: 0.875em; margin-top: 5px; }
.greenhouse-loading-spinner { display: flex; align-items: center; gap: 10px; }
`;

const styleElement = document.createElement('style');
styleElement.setAttribute('data-greenhouse-news-fallback-css', 'true');
styleElement.textContent = fallbackCSS;
document.head.appendChild(styleElement);
},

/**
* @function renderView
* @description Renders the appropriate view based on the current view state
* @returns {Promise
*/
async renderView() {
console.log(`News: Rendering view: ${appState.currentView}`);

let appDomFragment;

try {
// For now, a simple default view for news
appDomFragment = this.createDefaultNewsView();

if (!appDomFragment) {
throw new Error('Failed to create view DOM fragment');
}

return appDomFragment;

} catch (error) {
console.error(`News: Error rendering ${appState.currentView} view:`, error);
return this.createErrorView(`Failed to load ${appState.currentView} view: ${error.message}`);
}
},

/**
* @function createDefaultNewsView
* @description Creates a default view for the news application.
* @returns {DocumentFragment}
*/
createDefaultNewsView() {
const newsListElement = createElement('div', { id: 'news-list', className: 'greenhouse-layout-container' });
newsListElement.appendChild(createElement('p', {}, 'Loading news...'));

return createElement('div', { className: 'greenhouse-news-view' },
createElement('div', { className: 'greenhouse-news-content' },
createElement('h2', {}, 'Greenhouse News'),
createElement('p', {}, 'Welcome to the Greenhouse News section. Here you will find a curated list of the latest articles.'),
newsListElement
)
);
},

/**
* @function createErrorView
* @description Creates an error view when rendering fails
* @param {string} message - Error message to display
* @returns {HTMLElement}
*/
createErrorView(message) {
return createElement('div', { className: 'greenhouse-error-view' },
createElement('div', { className: 'greenhouse-error-content' },
createElement('h2', {}, 'Unable to Load Application'),
createElement('p', {}, message),
createElement('p', {}, 'Please refresh the page or contact support if the problem persists.'),
createElement('button', {
onclick: 'window.location.reload()',
className: 'greenhouse-btn greenhouse-btn-primary'
}, 'Refresh Page')
)
);
},

/**
* @function showSuccessMessage
* @description Shows a success message to the user
* @param {string} message - Success message to display
*/
showSuccessMessage(message) {
this.showNotification(message, 'success');
},

/**
* @function showErrorMessage
* @description Shows an error message to the user
* @param {string} message - Error message to display
*/
showErrorMessage(message) {
this.showNotification(message, 'error');
},

/**
* @function showNotification
* @description Shows a notification message with auto-dismiss
* @param {string} message - Message to display
* @param {string} type - Type of notification ('success', 'error', 'info')
* @param {number} [duration=5000] - Auto-dismiss duration in milliseconds
*/
showNotification(message, type = 'info', duration = 5000) {
// Remove any existing notifications
const existingNotifications = document.querySelectorAll('.greenhouse-notification');
existingNotifications.forEach(notification => notification.remove());

const notification = document.createElement('div');
notification.className = `greenhouse-notification greenhouse-notification-${type}`;
notification.setAttribute('role', 'alert');
notification.innerHTML = `


${message}



`;

// Position at top of viewport
notification.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
z-index: 10000;
max-width: 400px;
padding: 15px;
border-radius: 4px;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
font-family: Arial, sans-serif;
animation: slideInRight 0.3s ease-out;
`;

// Apply type-specific styles
switch (type) {
case 'success':
notification.style.backgroundColor = '#d4edda';
notification.style.color = '#155724';
notification.style.border = '1px solid #c3e6cb';
break;
case 'error':
notification.style.backgroundColor = '#f8d7da';
notification.style.color = '#721c24';
notification.style.border = '1px solid #f5c6cb';
break;
default:
notification.style.backgroundColor = '#d1ecf1';
notification.style.color = '#0c5460';
notification.style.border = '1px solid #bee5eb';
}

document.body.appendChild(notification);

// Add close functionality
const closeBtn = notification.querySelector('.greenhouse-notification-close');
const removeNotification = () => {
notification.style.animation = 'slideOutRight 0.3s ease-in';
setTimeout(() => notification.remove(), 300);
};

closeBtn.addEventListener('click', removeNotification);

// Auto-dismiss
if (duration > 0) {
setTimeout(removeNotification, duration);
}
},

/**
* @function findOptimalContainer
* @description Finds the best container for inserting the application
* @param {Element} targetElement - The target element from the selector
* @returns {Object} Container info with element and insertion strategy
*/
findOptimalContainer(targetElement) {
// Always use the target element directly as the container
// This ensures the app is inserted into the specific column identified by greenhouse.js
return {
container: targetElement,
strategy: 'target-direct',
insertionMethod: 'prepend' // Prepend to ensure it's the first child
};
},

/**
* @function insertApplication
* @description Inserts the application into the optimal container
* @param {DocumentFragment} appDomFragment - The application DOM fragment
* @param {Element} targetElement - The target element
*/
insertApplication(appDomFragment, targetElement) {
const containerInfo = this.findOptimalContainer(targetElement);

console.log(`News: Using insertion strategy: ${containerInfo.strategy}`);

// Create the main app container
const appContainer = document.createElement('section');
appContainer.id = 'greenhouse-app-container';
appContainer.className = 'greenhouse-app-container';
appContainer.setAttribute('data-greenhouse-app', appState.currentView);
appContainer.style.cssText = `
width: 100%;
position: relative;
padding: 20px;
box-sizing: border-box;
background: #fff;
`;

// Add the application content to the container
appContainer.appendChild(appDomFragment);

// Insert using the determined strategy
switch (containerInfo.insertionMethod) {
case 'prepend':
containerInfo.container.prepend(appContainer);
break;
case 'append':
containerInfo.container.appendChild(appContainer);
break;
default:
containerInfo.container.prepend(appContainer);
}

console.log('News: Application inserted into DOM');
return appContainer;
},

/**
* @function displayError
* @description Displays a visible error message on the page
* @param {string} message - The error message to display
* @param {Element} [targetElement] - Element to insert error near
*/
displayError(message, targetElement = null) {
GreenhouseUtils.displayError(`Greenhouse News Error: ${message}`);
console.error('News: General error display:', message);
},

/**
* @function initializeApplication
* @description Initializes the loaded application instance
*/
initializeApplication() {
try {
if (appState.currentAppInstance && typeof appState.currentAppInstance.init === 'function') {
console.log('News: Initializing application instance');
appState.currentAppInstance.init();
} else if (appState.currentAppInstance) {
console.log('News: Application instance loaded but has no init method');
} else {
console.log('News: No application instance to initialize');
}
} catch (error) {
console.error('News: Error initializing application instance:', error);
this.showErrorMessage('Application loaded but failed to initialize properly.');
}
},

/**
* @function init
* @description Main initialization function for the news application
* @param {string} targetSelector - The CSS selector for the element to load the app into
* @param {string} baseUrl - The base URL for fetching assets
*/
async init(targetSelector, baseUrl) {
if (appState.isInitialized || appState.isLoading) {
console.log('News: Already initialized or loading, skipping');
return;
}

appState.isLoading = true;
try {
// Load utility script
await this.loadScript('GreenhouseUtils.js');

console.log('News: Starting initialization');

// Set configuration
appState.targetSelector = targetSelector;
appState.baseUrl = baseUrl;

// Wait for target element to be available
appState.targetElement = await waitForElement(targetSelector);

// Load CSS first (non-blocking)
this.loadCSS().catch(error => {
console.warn('News: CSS loading failed, continuing with fallback:', error);
});

// Render the appropriate view
const appDomFragment = await this.renderView();

// Insert application into DOM with delay for Wix compatibility
await new Promise(resolve => setTimeout(resolve, config.dom.insertionDelay));

const appContainer = this.insertApplication(appDomFragment, appState.targetElement);

// Initialize the application instance (if any specific news app logic is needed)
this.initializeApplication();

// Fetch and display news after the app is inserted, with an additional delay
await new Promise(resolve => setTimeout(resolve, 500)); // Additional delay
await this.fetchAndDisplayNews();

appState.isInitialized = true;
console.log('News: Initialization completed successfully');

// Show success notification
GreenhouseUtils.displaySuccess('News application loaded successfully');

} catch (error) {
console.error('News: Initialization failed:', error);
appState.errors.push(error);

const errorMessage = error.message.includes('not found')
? `Target element "${targetSelector}" not found. Please check if the page has loaded completely.`
: `Failed to load the news application: ${error.message}`;

this.displayError(errorMessage, appState.targetElement);
// No critical overlay, just a notification
this.showErrorMessage('Failed to load news application');

} finally {
appState.isLoading = false;
}
}
};

/**
* Creates a DOM element with specified tag, attributes, and children.
* @param {string} tag - The HTML tag name.
* @param {object} [attributes={}] - An object of attribute key-value pairs.
* @param {...(HTMLElement|string)} children - Child elements or strings.
* @returns {HTMLElement} The created DOM element.
*/
function createElement(tag, attributes = {}, ...children) {
const element = document.createElement(tag);
for (const key in attributes) {
if (attributes.hasOwnProperty(key)) {
element.setAttribute(key, attributes[key]);
}
}
children.forEach(child => {
if (typeof child === 'string') {
element.appendChild(document.createTextNode(child));
} else {
element.appendChild(child);
}
});
return element;
}

// --- Main Execution Logic ---

/**
* Main execution function
*/
async function main() {
try {
// If a critical error has occurred, prevent further re-initialization attempts
if (appState.hasCriticalError) {
console.error('News: Critical error detected, preventing re-initialization.');
return;
}

// Validate configuration from script attributes
if (!validateConfiguration()) {
console.error('News: Invalid configuration, cannot proceed');
return;
}

// Add global error handler
window.addEventListener('error', (event) => {
if (event.filename && event.filename.includes('greenhouse')) {
console.error('News: Global error caught:', event.error);
appState.errors.push(event.error);
}
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
console.error('News: Unhandled promise rejection:', event.reason);
appState.errors.push(event.reason);
});

// Initialize the news application
await GreenhouseAppsNews.init(appState.targetSelector, appState.baseUrl);

} catch (error) {
console.error('News: Main execution failed:', error);
}
}

// Add CSS animations
const animationCSS = `
@keyframes slideInRight {
from { transform: translateX(100%); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
from { transform: translateX(0); opacity: 1; }
to { transform: translateX(100%); opacity: 0; }
}
`;

const animationStyle = createElement('style', { 'data-greenhouse-animations': 'true' }, animationCSS);
document.head.appendChild(animationStyle);

// Expose public API for debugging
window.GreenhouseNews = {
getState: () => ({ ...appState }),
getConfig: () => ({ ...config }),
reinitialize: () => {
appState.isInitialized = false;
appState.isLoading = false;
return main();
},
showNotification: GreenhouseAppsNews.showNotification.bind(GreenhouseAppsNews)
};

// Execute main function
main();

})();