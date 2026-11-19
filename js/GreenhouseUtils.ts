import { Greenhouse } from './context.js';
import { GreenhouseModelsTOC } from './models_toc.js';

export interface UtilsConfig {
    [key: string]: any;
    loadTimeout: number;
    retries: {
        maxAttempts: number;
        delay: number;
    };
    dom: {
        insertionDelay: number;
        observerTimeout: number;
    };
}

export interface UtilsAppState {
    [key: string]: any;
    isInitialized: boolean;
    isLoading: boolean;
    currentView: string | null;
    currentAppInstance: any;
    targetElementLeft: HTMLElement | null;
    targetElementRight: HTMLElement | null;
    baseUrl: string | null;
    targetSelectorLeft: string | null;
    targetSelectorRight: string | null;
    errors: any[];
}

export interface ModelDescriptionItem {
    id: string | null;
    title: string;
    url: string;
}

/**
 * @description Configuration for shared utilities and application state.
 */
const config: UtilsConfig = {
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
        insertionDelay: 2000,  // Delay before inserting into DOM (for Wix compatibility)
        observerTimeout: 10000
    }
};

/**
 * Application state management
 */
const appState: UtilsAppState = {
    isInitialized: false,
    isLoading: false,
    currentView: null,
    currentAppInstance: null,
    targetElementLeft: null,
    targetElementRight: null,
    baseUrl: null,
    targetSelectorLeft: null,
    targetSelectorRight: null,
    errors: []
};

/**
 * @function displayMessage
 * @description Display a non-blocking notification
 * @param message - The message text
 * @param type - Message type
 * @param duration - How long to show message (ms)
 */
function displayMessage(
    message: string,
    type: 'error' | 'success' | 'info' = 'error',
    duration: number = 5000
): void {
    console.debug(`[GreenhouseUtils] Showing ${type} message: "${message}"`);

    // Create container
    const notif = document.createElement('div');
    notif.className = `greenhouse-notification greenhouse-notification-${type}`;

    // Message span
    const messageSpan = document.createElement('span');
    messageSpan.className = 'greenhouse-notification-message';
    messageSpan.textContent = message;
    notif.appendChild(messageSpan);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'greenhouse-notification-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => removeNotification(notif);
    notif.appendChild(closeBtn);

    document.body.appendChild(notif);

    // Auto-remove after duration
    setTimeout(() => removeNotification(notif), duration);
}

/** Animate and remove notification */
function removeNotification(notif: HTMLElement): void {
    notif.style.animation = 'slideOutRight 0.3s ease forwards';
    notif.addEventListener('animationend', () => notif.remove());
}

/**
 * @function waitForElement
 * @description Waits for an element to appear in the DOM, with fallback options.
 * @param selectors - Primary selector or array of selectors to try.
 * @param timeout - Maximum time to wait in milliseconds.
 * @returns Promise that resolves with the found element.
 */
function waitForElement(
    selectors: string | string[],
    timeout: number = config.loadTimeout
): Promise<Element> {
    return new Promise((resolve, reject) => {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

        // Check if element already exists
        for (const selector of selectorArray) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`GreenhouseUtils: Found element with selector: ${selector}`);
                return resolve(element);
            }
        }

        console.log(`GreenhouseUtils: Waiting for element with selectors: ${selectorArray.join(', ')}`);

        const observer = new MutationObserver(() => {
            for (const selector of selectorArray) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`GreenhouseUtils: Element found with selector: ${selector}`);
                    observer.disconnect();
                    return resolve(element);
                }
            }
        });

        // Observe changes to the entire document
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        // Set timeout
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element not found within ${timeout}ms. Tried selectors: ${selectorArray.join(', ')}`));
        }, timeout);
    });
}

/**
 * @function retryOperation
 * @description Retries an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param operationName - Name for logging
 * @param maxAttempts - Maximum retry attempts
 * @returns Result of the operation
 */
async function retryOperation<T = any>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = config.retries.maxAttempts
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`GreenhouseUtils: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
            return await operation();
        } catch (error: any) {
            lastError = error;
            console.warn(`GreenhouseUtils: ${operationName} failed on attempt ${attempt}:`, error.message);

            if (attempt < maxAttempts) {
                const delay = config.retries.delay * Math.pow(2, attempt - 1);
                console.log(`GreenhouseUtils: Retrying ${operationName} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
}

/**
 * @function validateField
 * @description Validates a single form field based on its attributes (e.g., required, type).
 * It also handles displaying/hiding error messages.
 * @param field - The form field to validate.
 * @param errorElement - The element to display validation errors in.
 * @returns True if the field is valid, false otherwise.
 */
function validateField(
    field: HTMLInputElement | HTMLSelectElement,
    errorElement: HTMLElement | null
): boolean {
    let isValid = true;
    let errorMessage = '';

    // Check if required field is empty
    if (field.required && !field.value.trim()) {
        isValid = false;
        errorMessage = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required.`;
    }

    // Additional validation based on field type
    if (isValid && field.value.trim()) {
        switch (field.type) {
            case 'date': {
                const selectedDate = new Date(field.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    isValid = false;
                    errorMessage = 'Please select a future date.';
                }
                break;
            }
            case 'time': {
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid time.';
                }
                break;
            }
            // Add more validation types as needed (e.g., email, number)
        }
    }

    // Show/hide error message
    if (errorElement) {
        if (isValid) {
            errorElement.classList.add('greenhouse-hidden');
            field.classList.remove('greenhouse-form-error-input');
        } else {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('greenhouse-hidden');
            field.classList.add('greenhouse-form-error-input');
        }
    }

    return isValid;
}

/**
 * @function validateForm
 * @description Validates an entire form by iterating over its required fields.
 * It expects error elements to be associated with each field via a data-identifier.
 * @param form - The form element to validate.
 * @param errorIdentifierPrefix - The prefix for data-identifier attributes of error elements (e.g., 'patient-app-error-').
 * @returns True if the entire form is valid, false otherwise.
 */
function validateForm(form: HTMLFormElement, errorIdentifierPrefix: string): boolean {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isFormValid = true;

    inputs.forEach(input => {
        const formField = input as HTMLInputElement | HTMLSelectElement;
        const errorEl = form.querySelector(`[data-identifier="${errorIdentifierPrefix}${formField.name}"]`) as HTMLElement | null;
        if (!validateField(formField, errorEl)) {
            isFormValid = false;
        }
    });

    return isFormValid;
}

/**
 * @function observeAndReinitializeApplication
 * @description Observes the document body for removal of the application's container and triggers re-initialization.
 * @param container - The container element to monitor.
 * @param selector - The CSS selector for the container (optional, used to find replacement if removal detected).
 * @param appInstance - The application instance (e.g., `G`).
 * @param reinitFunctionName - The name of the initialization function on the app instance (e.g., 'initialize' or 'init').
 * @returns The observer instance.
 */
function observeAndReinitializeApplication(
    container: HTMLElement | null,
    selector: string | null,
    appInstance: any,
    reinitFunctionName: string = 'initialize'
): MutationObserver | null {
    if (!container) return null;

    // Clean up previous observer if it exists on the app instance
    if (appInstance._resilienceObserver) {
        appInstance._resilienceObserver.disconnect();
    }

    const observerCallback = (mutations: MutationRecord[]) => {
        // Check if the container itself or a parent was removed
        const wasRemoved = mutations.some(m =>
            Array.from(m.removedNodes).some(
                n => n === container || (n.nodeType === 1 && (n as HTMLElement).contains(container))
            )
        );

        if (wasRemoved) {
            console.log(`GreenhouseUtils: Application container removal detected for ${selector || 'unnamed container'}.`);

            if (appInstance.isRunning !== undefined) appInstance.isRunning = false;
            if (appInstance.stop) appInstance.stop();
            if (appInstance.stopSimulation) appInstance.stopSimulation();

            if (appInstance._resilienceObserver) {
                appInstance._resilienceObserver.disconnect();
            }

            setTimeout(() => {
                let newContainer: HTMLElement | null = container.id ? document.getElementById(container.id) : null;
                if (!newContainer && selector) {
                    newContainer = document.querySelector(selector) as HTMLElement | null;
                }

                if (newContainer && document.body.contains(newContainer)) {
                    console.log(`GreenhouseUtils: Re-initializing application via ${reinitFunctionName}...`);
                    if (typeof appInstance[reinitFunctionName] === 'function') {
                        // Call reinit using selector if available, or just container
                        // Standardizing: prefer calling with (container, selector) signature if supported, or just (container)
                        try {
                            appInstance[reinitFunctionName](newContainer, selector);
                        } catch (e) {
                            console.warn(`GreenhouseUtils: Failed to re-initialize with (container, selector), falling back to (container).`, e);
                            appInstance[reinitFunctionName](newContainer);
                        }
                    }
                } else {
                    console.log('GreenhouseUtils: Re-init failed. Container not found.');
                }
            }, 1000); // Wait for React/DOM to settle
        }
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    // Store observer on instance for cleanup
    appInstance._resilienceObserver = observer;
    return observer;
}

/**
 * @function startSentinel
 * @description Starts a polling interval to check if the application's critical elements (e.g., canvas) are still in the DOM.
 * @param container - The initial container element.
 * @param selector - The CSS selector for the container.
 * @param appInstance - The application instance.
 * @param reinitFunctionName - The name of the initialization function.
 * @param criticalSelector - CSS selector for a critical child element to check (e.g., 'canvas').
 * @returns The interval ID.
 */
function startSentinel(
    container: HTMLElement,
    selector: string | null,
    appInstance: any,
    reinitFunctionName: string = 'initialize',
    criticalSelector: string = 'canvas'
): ReturnType<typeof setInterval> {
    if (appInstance._sentinelInterval) clearInterval(appInstance._sentinelInterval);

    const intervalId = setInterval(() => {
        let currentContainer: HTMLElement | null = container.id ? document.getElementById(container.id) : container;
        if ((!currentContainer || !document.body.contains(currentContainer)) && selector) {
            currentContainer = document.querySelector(selector) as HTMLElement | null;
        }

        const criticalElement = currentContainer ? currentContainer.querySelector(criticalSelector) : null;
        const isRunning = appInstance.isRunning !== undefined ? appInstance.isRunning : true;

        if (isRunning && (!currentContainer || !criticalElement || !document.body.contains(criticalElement))) {
            console.log(`GreenhouseUtils: Sentinel detected DOM loss for ${selector}. Re-initializing...`);

            if (appInstance.isRunning !== undefined) appInstance.isRunning = false;

            if (currentContainer && document.body.contains(currentContainer)) {
                if (typeof appInstance[reinitFunctionName] === 'function') {
                    try {
                        appInstance[reinitFunctionName](currentContainer, selector);
                    } catch (e) {
                        appInstance[reinitFunctionName](currentContainer);
                    }
                }
            } else if (selector) {
                const newContainer = document.querySelector(selector) as HTMLElement | null;
                if (newContainer && typeof appInstance[reinitFunctionName] === 'function') {
                    try {
                        appInstance[reinitFunctionName](newContainer, selector);
                    } catch (e) {
                        appInstance[reinitFunctionName](newContainer);
                    }
                }
            }
        }
    }, 3000);

    appInstance._sentinelInterval = intervalId;
    return intervalId;
}

/**
 * @function renderModelsTOC
 * @description Renders the models table of contents at the bottom of the simulation.
 * @param targetSelector - Optional selector for placement. If not provided, appends to the bottom of the body.
 */
async function renderModelsTOC(targetSelector: string | null = null): Promise<void> {
    console.log('[GreenhouseUtils] Preparing bottom navigation TOC...');

    const baseUrl = appState.baseUrl || '/';
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    // Load CSS if not present
    if (!document.querySelector('link[href*="models_toc.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${normalizedBaseUrl}css/models_toc.css`;
        document.head.appendChild(link);
    }

    // The Models entry imports this dependency explicitly before calling
    // renderModelsTOC. Keep this helper free of runtime script loading.
    if (!GreenhouseModelsTOC) {
        console.error('[GreenhouseUtils] Models TOC module was not imported.');
        return;
    }

    // Create or find the footer container
    let tocContainer = document.getElementById('greenhouse-models-footer-toc');
    if (!tocContainer) {
        tocContainer = document.createElement('div');
        tocContainer.id = 'greenhouse-models-footer-toc';
        tocContainer.className = 'models-toc-footer-section';

        // Add style block for the footer section
        if (!document.getElementById('greenhouse-footer-styles')) {
            const style = document.createElement('style');
            style.id = 'greenhouse-footer-styles';
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
                
                .models-toc-footer-section {
                    display: block !important;
                    flex: 0 0 100% !important; /* Force full width in flexbox */
                    width: 100% !important;
                    grid-column: 1 / -1 !important; /* For Grid */
                    order: 9999 !important; /* Push to end in flexbox */
                    background: linear-gradient(to bottom, #000 0%, #0a100a 100%);
                    border-top: 2px solid #1a2a1a;
                    padding: 80px 20px;
                    margin-top: 50px;
                    position: relative;
                    z-index: 10; /* Lower z-index to avoid covering fixed UI */
                    min-height: 400px;
                    color: #fff;
                    box-shadow: 0 -30px 60px rgba(0, 0, 0, 0.6);
                    clear: both !important;
                }
                .models-toc-footer-section .models-toc-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100% !important;
                }
                .models-toc-footer-header {
                    text-align: center;
                    margin-bottom: 60px;
                }
                .models-toc-footer-header h2 {
                    font-family: 'Quicksand', sans-serif;
                    font-size: 2.8rem;
                    font-weight: 300;
                    color: #4ca1af;
                    letter-spacing: 2px;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                }
                .models-toc-footer-header .accent-line {
                    width: 80px;
                    height: 3px;
                    background: linear-gradient(to right, transparent, #4ca1af, transparent);
                    margin: 0 auto;
                }
                
                /* Force scrolling if the app was previously locked */
                html, body {
                    overflow-y: auto !important;
                    height: auto !important;
                    min-height: 100% !important;
                }
                
                /* Dark Mode Theme Overrides for TOC Cards */
                .models-toc-footer-section .model-toc-card {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(12px);
                    transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .models-toc-footer-section .model-toc-card:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #4ca1af;
                    transform: translateY(-12px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(76, 161, 175, 0.2);
                }
                .models-toc-footer-section .model-toc-card h3 {
                    color: #4ca1af;
                    border-bottom-color: rgba(255, 255, 255, 0.05);
                    font-family: 'Quicksand', sans-serif;
                }
                .models-toc-footer-section .model-toc-card p {
                    color: #bbb;
                }
                .models-toc-footer-section .models-toc-intro {
                    display: none; /* Hide intro text in the footer/bottom view */
                }
            `;
            document.head.appendChild(style);
        }

        // Add Footer Header
        const header = document.createElement('div');
        header.className = 'models-toc-footer-header';
        header.innerHTML = `
            <h2>Greenhouse Models</h2>
            <div class="accent-line"></div>
        `;
        tocContainer.appendChild(header);

        // Append to body after the main app container
        const mainApp = targetSelector ? document.querySelector(targetSelector) as HTMLElement | null : null;
        if (mainApp && mainApp.parentNode) {
            const parent = mainApp.parentNode as HTMLElement;

            // Force wrap for flex parents
            try {
                const computedStyle = window.getComputedStyle(parent);
                if (computedStyle.display.includes('flex')) {
                    parent.style.flexWrap = 'wrap';
                }
            } catch (e) { }

            // Check if mainApp has no height (likely absolute/fixed)
            const mainHeight = mainApp.offsetHeight;
            if (mainHeight < 100) {
                // If simulation doesn't take space, simulate some flow offset
                tocContainer.style.marginTop = '600px';
            }

            // Insert after the main simulation container
            parent.insertBefore(tocContainer, mainApp.nextSibling);
        } else {
            document.body.appendChild(tocContainer);
        }
    }

    // Initialize the TOC component inside the new footer container
    GreenhouseModelsTOC.init({ target: tocContainer, baseUrl: normalizedBaseUrl });
}

/**
 * @function isMobileUser
 * @description Unified mobile detection using feature detection and UA fallback.
 * Combines screen width, touch support, and User Agent sniffing to avoid
 * false positives on desktop touchscreens.
 */
function isMobileUser(): boolean {
    const isNarrow = window.innerWidth <= 1024;
    const ua = navigator.userAgent;

    // 0. Manual override via query parameter for testing
    if (window.location.search.includes('mobile=true')) return true;

    // 1. Specialized detection for iPad Pro (identifies as MacIntel but has multi-touch)
    const isIPadPro = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !window.MSStream);

    // 2. Check for touch event support and maxTouchPoints (modern, MDN recommended)
    let hasTouchScreen = false;
    if ('maxTouchPoints' in navigator) {
        hasTouchScreen = navigator.maxTouchPoints > 0;
    } else {
        // Fallback for older browsers
        const mQ = (window as any).matchMedia && (window as any).matchMedia('(pointer:coarse)');
        if (mQ && mQ.media === '(pointer:coarse)') {
            hasTouchScreen = !!mQ.matches;
        } else if ('orientation' in window) {
            hasTouchScreen = true; // Deprecated, but useful fallback
        }
    }

    // 3. User Agent sniffing and legacy touch
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    const hasLegacyTouch = ('ontouchstart' in window);

    // Combined Logic: treat as mobile if it's a known mobile UA, or iPad Pro,
    // OR if it has touch support AND is a narrow screen (mobile/tablet size).
    return isMobileUA || isIPadPro || (isNarrow && (hasTouchScreen || hasLegacyTouch));
}

/**
 * @function fetchModelDescriptions
 * @description Fetches model metadata from the central XML repository.
 */
async function fetchModelDescriptions(): Promise<ModelDescriptionItem[]> {
    const baseUrl = appState.baseUrl || '/';
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const xmlUrl = `${normalizedBaseUrl}endpoints/model_descriptions.xml`;

    try {
        // Add a 5 second timeout to the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(xmlUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        const models: ModelDescriptionItem[] = Array.from(xmlDoc.querySelectorAll('model')).map(model => {
            const titleEl = model.querySelector('title');
            const urlEl = model.querySelector('url');
            return {
                id: model.getAttribute('id'),
                title: titleEl ? (titleEl.textContent || 'Unknown Model') : (model.getAttribute('id') || 'Unknown Model'),
                url: urlEl ? (urlEl.textContent || `/${model.getAttribute('id')}`) : `/${model.getAttribute('id')}`
            };
        });

        if (models.length === 0) throw new Error('No models found in XML');
        return models;

    } catch (e) {
        console.warn('[GreenhouseUtils] Failed to fetch model descriptions, using fallback', e);
        return [
            { id: 'genetic', title: 'Genetic Model', url: '/genetic' },
            { id: 'neuro', title: 'Neuro Model', url: '/neuro' },
            { id: 'pathway', title: 'Pathway Model', url: '/pathway' },
            { id: 'synapse', title: 'Synapse Model', url: '/synapse' },
            { id: 'dna', title: 'DNA Repair Model', url: '/dna' },
            { id: 'rna', title: 'RNA Repair Model', url: '/rna' },
            { id: 'dopamine', title: 'Dopamine Signaling', url: '/dopamine' },
            { id: 'serotonin', title: 'Serotonin Structural', url: '/serotonin' },
            { id: 'emotion', title: 'Emotion Model', url: '/emotion' },
            { id: 'cognition', title: 'Cognition Model', url: '/cognition' }
        ];
    }
}

// Public API
const GreenhouseUtils = {
    displayError: (msg: string, duration?: number) => displayMessage(msg, 'error', duration),
    displaySuccess: (msg: string, duration?: number) => displayMessage(msg, 'success', duration),
    displayInfo: (msg: string, duration?: number) => displayMessage(msg, 'info', duration),
    waitForElement,
    appState,
    config,
    retryOperation,
    validateField,
    validateForm,
    observeAndReinitializeApplication,
    startSentinel,
    renderModelsTOC,
    isMobileUser,
    fetchModelDescriptions
};

export { GreenhouseUtils };
