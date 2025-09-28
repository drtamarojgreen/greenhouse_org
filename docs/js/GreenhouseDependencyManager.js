/**
 * @file GreenhouseDependencyManager.js
 * @description Centralized dependency management system for Greenhouse applications.
 * Provides event-based dependency loading, timeout handling, and debugging capabilities.
 * 
 * @version 1.0.0
 * @author Greenhouse Development Team
 */

window.GreenhouseDependencyManager = (function() {
    'use strict';

    /**
     * Configuration for the dependency manager
     */
    const config = {
        defaultTimeout: 15000,
        debugMode: false,
        eventPrefix: 'greenhouse:',
        retryAttempts: 3,
        retryDelay: 1000
    };

    /**
     * Internal state management
     */
    const state = {
        dependencies: new Map(),
        promises: new Map(),
        loadOrder: [],
        loadTimes: new Map(),
        errors: new Map(),
        debugLogs: []
    };

    /**
     * Debug logging function
     * @param {string} message - Debug message
     * @param {*} data - Additional data to log
     */
    function debugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, message, data };
        
        state.debugLogs.push(logEntry);
        
        if (config.debugMode) {
            console.log(`[GreenhouseDependencyManager] ${message}`, data || '');
        }
        
        // Keep only last 100 debug entries
        if (state.debugLogs.length > 100) {
            state.debugLogs.shift();
        }
    }

    /**
     * Register a dependency as available
     * @param {string} name - Dependency name
     * @param {*} value - Dependency value/object
     * @param {Object} metadata - Optional metadata about the dependency
     */
    function register(name, value, metadata = {}) {
        const startTime = Date.now();
        
        debugLog(`Registering dependency: ${name}`, { value, metadata });
        
        // Store the dependency
        state.dependencies.set(name, {
            value,
            metadata: {
                ...metadata,
                registeredAt: startTime,
                version: metadata.version || '1.0.0'
            }
        });
        
        // Record load order
        if (!state.loadOrder.includes(name)) {
            state.loadOrder.push(name);
        }
        
        // Resolve any waiting promises
        if (state.promises.has(name)) {
            const promiseData = state.promises.get(name);
            promiseData.resolve(value);
            state.promises.delete(name);
            
            // Record load time
            const loadTime = startTime - promiseData.requestedAt;
            state.loadTimes.set(name, loadTime);
            
            debugLog(`Dependency ${name} resolved after ${loadTime}ms`);
        }
        
        // Dispatch ready event
        const eventName = `${config.eventPrefix}${name}-ready`;
        window.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                name,
                value,
                metadata: state.dependencies.get(name).metadata,
                loadTime: state.loadTimes.get(name) || 0
            }
        }));
        
        debugLog(`Dispatched event: ${eventName}`);
    }

    /**
     * Wait for a dependency to become available
     * @param {string} name - Dependency name
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Promise that resolves with the dependency value
     */
    function waitFor(name, timeout = config.defaultTimeout) {
        debugLog(`Waiting for dependency: ${name}`, { timeout });
        
        // Check if dependency is already available
        if (state.dependencies.has(name)) {
            const dep = state.dependencies.get(name);
            debugLog(`Dependency ${name} already available`);
            return Promise.resolve(dep.value);
        }
        
        // Check if we're already waiting for this dependency
        if (state.promises.has(name)) {
            debugLog(`Already waiting for dependency: ${name}`);
            return state.promises.get(name).promise;
        }
        
        // Create new promise for this dependency
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        
        const promiseData = {
            promise,
            resolve,
            reject,
            requestedAt: Date.now(),
            timeout
        };
        
        state.promises.set(name, promiseData);
        
        // Set timeout
        const timeoutId = setTimeout(() => {
            if (state.promises.has(name)) {
                const error = new Error(`Dependency '${name}' not available within ${timeout}ms`);
                state.errors.set(name, error);
                state.promises.get(name).reject(error);
                state.promises.delete(name);
                
                debugLog(`Dependency ${name} timed out after ${timeout}ms`);
            }
        }, timeout);
        
        // Clean up timeout if resolved early
        promise.finally(() => {
            clearTimeout(timeoutId);
        });
        
        return promise;
    }

    /**
     * Wait for multiple dependencies
     * @param {string[]} names - Array of dependency names
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<Object>} Promise that resolves with an object containing all dependencies
     */
    async function waitForMultiple(names, timeout = config.defaultTimeout) {
        debugLog(`Waiting for multiple dependencies`, { names, timeout });
        
        const promises = names.map(name => 
            waitFor(name, timeout).then(value => ({ name, value }))
        );
        
        try {
            const results = await Promise.all(promises);
            const dependencies = {};
            results.forEach(({ name, value }) => {
                dependencies[name] = value;
            });
            
            debugLog(`All dependencies resolved`, { names });
            return dependencies;
        } catch (error) {
            debugLog(`Failed to resolve all dependencies`, { names, error: error.message });
            throw error;
        }
    }

    /**
     * Check if a dependency is available
     * @param {string} name - Dependency name
     * @returns {boolean} True if dependency is available
     */
    function isAvailable(name) {
        return state.dependencies.has(name);
    }

    /**
     * Get a dependency if available
     * @param {string} name - Dependency name
     * @returns {*} Dependency value or undefined
     */
    function get(name) {
        const dep = state.dependencies.get(name);
        return dep ? dep.value : undefined;
    }

    /**
     * Get dependency metadata
     * @param {string} name - Dependency name
     * @returns {Object} Dependency metadata or undefined
     */
    function getMetadata(name) {
        const dep = state.dependencies.get(name);
        return dep ? dep.metadata : undefined;
    }

    /**
     * Remove a dependency
     * @param {string} name - Dependency name
     * @returns {boolean} True if dependency was removed
     */
    function unregister(name) {
        debugLog(`Unregistering dependency: ${name}`);
        
        const removed = state.dependencies.delete(name);
        state.loadTimes.delete(name);
        state.errors.delete(name);
        
        // Remove from load order
        const index = state.loadOrder.indexOf(name);
        if (index > -1) {
            state.loadOrder.splice(index, 1);
        }
        
        // Reject any waiting promises
        if (state.promises.has(name)) {
            const promiseData = state.promises.get(name);
            promiseData.reject(new Error(`Dependency '${name}' was unregistered`));
            state.promises.delete(name);
        }
        
        return removed;
    }

    /**
     * Clear all dependencies
     */
    function clear() {
        debugLog('Clearing all dependencies');
        
        // Reject all waiting promises
        state.promises.forEach((promiseData, name) => {
            promiseData.reject(new Error(`Dependency '${name}' was cleared`));
        });
        
        state.dependencies.clear();
        state.promises.clear();
        state.loadOrder.length = 0;
        state.loadTimes.clear();
        state.errors.clear();
    }

    /**
     * Get system status and statistics
     * @returns {Object} System status information
     */
    function getStatus() {
        const now = Date.now();
        const availableDeps = Array.from(state.dependencies.keys());
        const waitingDeps = Array.from(state.promises.keys());
        const errorDeps = Array.from(state.errors.keys());
        
        const loadTimeStats = Array.from(state.loadTimes.values());
        const avgLoadTime = loadTimeStats.length > 0 
            ? loadTimeStats.reduce((a, b) => a + b, 0) / loadTimeStats.length 
            : 0;
        
        return {
            timestamp: now,
            available: availableDeps,
            waiting: waitingDeps,
            errors: errorDeps,
            loadOrder: [...state.loadOrder],
            statistics: {
                totalRegistered: availableDeps.length,
                totalWaiting: waitingDeps.length,
                totalErrors: errorDeps.length,
                averageLoadTime: Math.round(avgLoadTime),
                maxLoadTime: loadTimeStats.length > 0 ? Math.max(...loadTimeStats) : 0,
                minLoadTime: loadTimeStats.length > 0 ? Math.min(...loadTimeStats) : 0
            }
        };
    }

    /**
     * Get detailed debug information
     * @returns {Object} Debug information
     */
    function getDebugInfo() {
        return {
            config: { ...config },
            state: {
                dependencies: Array.from(state.dependencies.entries()).map(([name, data]) => ({
                    name,
                    metadata: data.metadata,
                    hasValue: !!data.value
                })),
                promises: Array.from(state.promises.keys()),
                loadOrder: [...state.loadOrder],
                loadTimes: Object.fromEntries(state.loadTimes),
                errors: Object.fromEntries(
                    Array.from(state.errors.entries()).map(([name, error]) => [
                        name, 
                        { message: error.message, stack: error.stack }
                    ])
                )
            },
            debugLogs: [...state.debugLogs]
        };
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    function setDebugMode(enabled) {
        config.debugMode = !!enabled;
        debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Create a dependency chain visualization
     * @returns {string} ASCII art representation of dependency chain
     */
    function visualizeDependencies() {
        const available = Array.from(state.dependencies.keys());
        const waiting = Array.from(state.promises.keys());
        const errors = Array.from(state.errors.keys());
        
        let visualization = '\n=== Greenhouse Dependency Chain ===\n\n';
        
        visualization += 'Load Order:\n';
        state.loadOrder.forEach((name, index) => {
            const loadTime = state.loadTimes.get(name);
            const timeStr = loadTime ? ` (${loadTime}ms)` : '';
            visualization += `  ${index + 1}. ${name}${timeStr}\n`;
        });
        
        visualization += '\nCurrent Status:\n';
        visualization += `  ✅ Available (${available.length}): ${available.join(', ')}\n`;
        visualization += `  ⏳ Waiting (${waiting.length}): ${waiting.join(', ')}\n`;
        visualization += `  ❌ Errors (${errors.length}): ${errors.join(', ')}\n`;
        
        return visualization;
    }

    // Initialize debug logging
    debugLog('GreenhouseDependencyManager initialized');

    // Public API
    return {
        // Core functionality
        register,
        waitFor,
        waitForMultiple,
        isAvailable,
        get,
        getMetadata,
        unregister,
        clear,
        
        // Status and debugging
        getStatus,
        getDebugInfo,
        setDebugMode,
        visualizeDependencies,
        
        // Configuration
        config: {
            get: (key) => config[key],
            set: (key, value) => {
                if (config.hasOwnProperty(key)) {
                    config[key] = value;
                    debugLog(`Configuration updated: ${key} = ${value}`);
                }
            }
        }
    };
})();

// Auto-register the dependency manager itself
window.GreenhouseDependencyManager.register('dependencyManager', window.GreenhouseDependencyManager, {
    version: '1.0.0',
    description: 'Centralized dependency management system'
});

console.log('GreenhouseDependencyManager: Initialized and ready');
