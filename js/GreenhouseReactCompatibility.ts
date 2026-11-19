/**
 * @file GreenhouseReactCompatibility.ts
 * @description React compatibility layer for Greenhouse dependency loading system.
 * Addresses Firefox-specific React hydration and rendering issues.
 *
 * @version 1.0.0
 * @author Greenhouse Development Team
 */

/// <reference path="types/globals.d.ts" />
import { GreenhouseDependencyManager } from './GreenhouseDependencyManager.js';

export interface ReactCompatibilityStatus {
    isFirefox: boolean;
    reactDetected: boolean;
    reactVersion: string | null;
    isStabilizing: boolean;
    pendingOperations: number;
}

/**
 * Configuration for React compatibility
 */
const config = {
    isFirefox: typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent.toLowerCase().includes('firefox')
        : false,
    reactCheckInterval: 100,
    maxReactChecks: 50,
    domMutationDelay: 16, // One frame at 60fps
    reactStabilizationDelay: 100
};

/**
 * State management
 */
const state = {
    reactDetected: false,
    reactVersion: null as string | null,
    pendingOperations: [] as any[],
    isStabilizing: false
};

/**
 * Detect if React is present and get version
 */
function detectReact(): boolean {
    if (typeof window !== 'undefined') {
        if (window.React) {
            state.reactDetected = true;
            state.reactVersion = window.React.version || 'unknown';
            console.log(`GreenhouseReactCompatibility: React ${state.reactVersion} detected`);
            return true;
        }

        // Check for React DevTools
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            state.reactDetected = true;
            console.log('GreenhouseReactCompatibility: React detected via DevTools hook');
            return true;
        }
    }

    // Check for React fiber nodes in DOM
    if (typeof document !== 'undefined') {
        const reactNodes = document.querySelectorAll('[data-reactroot], [data-reactid]');
        if (reactNodes.length > 0) {
            state.reactDetected = true;
            console.log('GreenhouseReactCompatibility: React detected via DOM nodes');
            return true;
        }
    }

    return false;
}

/**
 * Wait for React to stabilize before performing DOM operations
 */
function waitForReactStabilization(): Promise<void> {
    return new Promise((resolve) => {
        if (!state.reactDetected || !config.isFirefox) {
            resolve();
            return;
        }

        if (state.isStabilizing) {
            // Already stabilizing, wait for it to complete
            const checkStabilization = () => {
                if (!state.isStabilizing) {
                    resolve();
                } else {
                    setTimeout(checkStabilization, 10);
                }
            };
            checkStabilization();
            return;
        }

        state.isStabilizing = true;

        // Wait for React to finish any pending updates
        if (typeof window !== 'undefined' && window.React && window.React.unstable_batchedUpdates) {
            window.React.unstable_batchedUpdates(() => {
                setTimeout(() => {
                    state.isStabilizing = false;
                    resolve();
                }, config.reactStabilizationDelay);
            });
        } else {
            // Fallback: just wait for a short period
            setTimeout(() => {
                state.isStabilizing = false;
                resolve();
            }, config.reactStabilizationDelay);
        }
    });
}

/**
 * Safe DOM manipulation that respects React's lifecycle
 */
async function safeDOMOperation<T = any>(
    operation: () => T,
    description: string = 'DOM operation'
): Promise<T> {
    if (!config.isFirefox || !state.reactDetected) {
        // Not Firefox or no React detected, proceed normally
        return operation();
    }

    console.log(`GreenhouseReactCompatibility: Performing safe ${description}`);

    // Wait for React to stabilize
    await waitForReactStabilization();

    // Use requestAnimationFrame to ensure we're not interrupting React's render cycle
    return new Promise((resolve, reject) => {
        requestAnimationFrame(() => {
            try {
                const result = operation();

                // Give React time to process any changes
                setTimeout(() => {
                    resolve(result);
                }, config.domMutationDelay);
            } catch (error) {
                console.error(`GreenhouseReactCompatibility: Error in ${description}:`, error);
                reject(error);
            }
        });
    });
}

/**
 * Safe element creation that avoids React conflicts
 */
function createElementSafely(
    tagName: string,
    attributes: Record<string, any> = {},
    textContent: string = ''
): HTMLElement {
    const element = document.createElement(tagName);

    // Set attributes safely
    Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('data-') || key === 'id' || key === 'class' || key === 'className') {
            element.setAttribute(key, value);
        } else {
            (element as any)[key] = value;
        }
    });

    if (textContent) {
        element.textContent = textContent;
    }

    // Mark as Greenhouse-created to avoid React conflicts
    element.setAttribute('data-greenhouse-created', 'true');

    return element;
}

/**
 * Safe element insertion that respects React boundaries
 */
async function insertElementSafely(
    parent: HTMLElement | null,
    element: HTMLElement | null,
    description: string = 'element insertion'
): Promise<HTMLElement | false> {
    if (!parent || !element) {
        console.warn('GreenhouseReactCompatibility: Invalid parent or element for insertion');
        return false;
    }

    return safeDOMOperation(() => {
        // Check if parent is a React component root
        if (parent.hasAttribute('data-reactroot') || (parent as any)._reactInternalFiber) {
            console.warn('GreenhouseReactCompatibility: Attempting to insert into React root, creating wrapper');

            // Create a wrapper div to isolate from React
            const wrapper = createElementSafely('div', {
                'data-greenhouse-wrapper': 'true',
                'style': 'contents' // CSS contents value to not affect layout
            });

            wrapper.appendChild(element);
            parent.appendChild(wrapper);
            return wrapper;
        } else {
            parent.appendChild(element);
            return element;
        }
    }, description);
}

/**
 * Safe element removal that respects React lifecycle
 */
async function removeElementSafely(
    element: HTMLElement | null,
    description: string = 'element removal'
): Promise<boolean> {
    if (!element || !element.parentNode) {
        return false;
    }

    return safeDOMOperation(() => {
        // Check if element is React-managed
        if ((element as any)._reactInternalFiber || (element as any).__reactInternalInstance) {
            console.warn('GreenhouseReactCompatibility: Attempting to remove React-managed element');
            return false;
        }

        element.parentNode!.removeChild(element);
        return true;
    }, description);
}

/**
 * Enhanced dependency loading that respects React
 */
async function loadDependencyWithReactSupport<T = any>(
    loadFunction: () => Promise<T> | T,
    dependencyName: string
): Promise<T> {
    console.log(`GreenhouseReactCompatibility: Loading ${dependencyName} with React support`);

    // Detect React if not already done
    if (!state.reactDetected) {
        detectReact();
    }

    if (config.isFirefox && state.reactDetected) {
        // Wait for React to stabilize before loading dependencies
        await waitForReactStabilization();

        // Use React's scheduling if available
        if (typeof window !== 'undefined' && window.React && window.React.unstable_scheduleCallback) {
            return new Promise((resolve, reject) => {
                window.React.unstable_scheduleCallback(
                    window.React.unstable_LowPriority,
                    async () => {
                        try {
                            const result = await loadFunction();
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        }
    }

    // Fallback to normal loading
    return loadFunction();
}

/**
 * Monitor for React errors and provide debugging info
 */
function setupReactErrorMonitoring(): void {
    if (!config.isFirefox || typeof window === 'undefined') return;

    // Listen for React errors
    window.addEventListener('error', (event) => {
        const error = event.error;
        if (error && error.message && error.message.includes('Minified React error')) {
            console.error('GreenhouseReactCompatibility: React error detected:', {
                message: error.message,
                stack: error.stack,
                reactDetected: state.reactDetected,
                reactVersion: state.reactVersion,
                isStabilizing: state.isStabilizing,
                pendingOperations: state.pendingOperations.length
            });

            // Try to provide helpful debugging info
            const errorNumber = error.message.match(/#(\d+)/);
            if (errorNumber) {
                console.log(`GreenhouseReactCompatibility: React error ${errorNumber[1]} detected. This may be related to DOM manipulation conflicts.`);

                if (errorNumber[1] === '418') {
                    console.log('GreenhouseReactCompatibility: Error 418 is typically a hydration mismatch. Ensuring DOM operations are deferred.');
                } else if (errorNumber[1] === '423') {
                    console.log('GreenhouseReactCompatibility: Error 423 is typically an invalid hook call. Checking for component rendering conflicts.');
                }
            }
        }
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('React')) {
            console.error('GreenhouseReactCompatibility: Unhandled React promise rejection:', event.reason);
        }
    });
}

/**
 * Initialize React compatibility layer
 */
function initialize(): void {
    console.log('GreenhouseReactCompatibility: Initializing React compatibility layer');
    console.log(`GreenhouseReactCompatibility: Firefox detected: ${config.isFirefox}`);

    // Detect React
    detectReact();

    // Set up error monitoring
    setupReactErrorMonitoring();

    // Periodically check for React if not initially detected
    if (!state.reactDetected) {
        let checks = 0;
        const reactCheckInterval = setInterval(() => {
            checks++;
            if (detectReact() || checks >= config.maxReactChecks) {
                clearInterval(reactCheckInterval);
            }
        }, config.reactCheckInterval);
    }

    console.log(`GreenhouseReactCompatibility: Initialized (React detected: ${state.reactDetected})`);
}

/**
 * Get compatibility status
 */
function getStatus(): ReactCompatibilityStatus {
    return {
        isFirefox: config.isFirefox,
        reactDetected: state.reactDetected,
        reactVersion: state.reactVersion,
        isStabilizing: state.isStabilizing,
        pendingOperations: state.pendingOperations.length
    };
}

// Initialize in browser DOM context
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    initialize();
}

// Public API
const GreenhouseReactCompatibility = {
    // Core functions
    safeDOMOperation,
    createElementSafely,
    insertElementSafely,
    removeElementSafely,
    loadDependencyWithReactSupport,
    waitForReactStabilization,

    // Utility functions
    detectReact,
    getStatus,

    // State access
    get isFirefox() { return config.isFirefox; },
    get reactDetected() { return state.reactDetected; },
    get reactVersion() { return state.reactVersion; }
};

// Register with dependency manager
GreenhouseDependencyManager.register('reactCompatibility', GreenhouseReactCompatibility, {
    version: '1.0.0',
    description: 'React compatibility layer for Firefox',
    features: ['Safe DOM operations', 'React error monitoring', 'Hydration conflict prevention']
});

console.log('GreenhouseReactCompatibility: Loaded and ready');

export { GreenhouseReactCompatibility };
