import { Greenhouse } from './context.js';
/**
 * @file GreenhouseDependencyManager.ts
 * @description Centralized dependency management system for Greenhouse applications.
 * Provides event-based dependency loading, timeout handling, and debugging capabilities.
 *
 * @version 1.0.0
 * @author Greenhouse Development Team
 */

export interface DependencyConfig {
    defaultTimeout: number;
    debugMode: boolean;
    eventPrefix: string;
    retryAttempts: number;
    retryDelay: number;
}

export interface DependencyMetadata {
    version?: string;
    description?: string;
    registeredAt?: number;
    [key: string]: any;
}

export interface DependencyRecord<T = any> {
    value: T;
    metadata: DependencyMetadata;
}

export interface PendingPromise<T = any> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
    requestedAt: number;
    timeout: number;
}

export interface DebugLogEntry {
    timestamp: string;
    message: string;
    data: any;
}

export interface DependencyStatus {
    timestamp: number;
    available: string[];
    waiting: string[];
    errors: string[];
    loadOrder: string[];
    statistics: {
        totalRegistered: number;
        totalWaiting: number;
        totalErrors: number;
        averageLoadTime: number;
        maxLoadTime: number;
        minLoadTime: number;
    };
}

/**
 * Configuration for the dependency manager
 */
const config: DependencyConfig = {
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
    dependencies: new Map<string, DependencyRecord>(),
    promises: new Map<string, PendingPromise>(),
    loadOrder: [] as string[],
    loadTimes: new Map<string, number>(),
    errors: new Map<string, Error>(),
    debugLogs: [] as DebugLogEntry[]
};

/**
 * Debug logging function
 */
function debugLog(message: string, data: any = null): void {
    const timestamp = new Date().toISOString();
    const logEntry: DebugLogEntry = { timestamp, message, data };

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
 */
function register<T = any>(name: string, value: T, metadata: DependencyMetadata = {}): void {
    const startTime = Date.now();

    debugLog(`Registering dependency: ${name}`, { value, metadata });

    const enrichedMetadata: DependencyMetadata = {
        ...metadata,
        registeredAt: startTime,
        version: metadata.version || '1.0.0'
    };

    // Store the dependency
    state.dependencies.set(name, {
        value,
        metadata: enrichedMetadata
    });

    // Record load order
    if (!state.loadOrder.includes(name)) {
        state.loadOrder.push(name);
    }

    // Resolve any waiting promises
    if (state.promises.has(name)) {
        const promiseData = state.promises.get(name)!;
        promiseData.resolve(value);
        state.promises.delete(name);

        // Record load time
        const loadTime = startTime - promiseData.requestedAt;
        state.loadTimes.set(name, loadTime);

        debugLog(`Dependency ${name} resolved after ${loadTime}ms`);
    }

    // Dispatch ready event
    const eventName = `${config.eventPrefix}${name}-ready`;
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                name,
                value,
                metadata: enrichedMetadata,
                loadTime: state.loadTimes.get(name) || 0
            }
        }));
    }

    debugLog(`Dispatched event: ${eventName}`);
}

/**
 * Wait for a dependency to become available
 */
function waitFor<T = any>(name: string, timeout: number = config.defaultTimeout): Promise<T> {
    debugLog(`Waiting for dependency: ${name}`, { timeout });

    // Check if dependency is already available
    if (state.dependencies.has(name)) {
        const dep = state.dependencies.get(name)!;
        debugLog(`Dependency ${name} already available`);
        return Promise.resolve(dep.value);
    }

    // Check if we're already waiting for this dependency
    if (state.promises.has(name)) {
        debugLog(`Already waiting for dependency: ${name}`);
        return state.promises.get(name)!.promise;
    }

    // Create new promise for this dependency
    let resolve!: (value: T) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    const promiseData: PendingPromise<T> = {
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
            state.promises.get(name)!.reject(error);
            state.promises.delete(name);

            debugLog(`Dependency ${name} timed out after ${timeout}ms`);
        }
    }, timeout);

    // Clean up timeout if resolved early
    promise.then(() => {
        clearTimeout(timeoutId);
    }, () => {
        clearTimeout(timeoutId);
    });

    return promise;
}

/**
 * Wait for multiple dependencies
 */
async function waitForMultiple(
    names: string[],
    timeout: number = config.defaultTimeout
): Promise<Record<string, any>> {
    debugLog(`Waiting for multiple dependencies`, { names, timeout });

    const promises = names.map(name =>
        waitFor(name, timeout).then(value => ({ name, value }))
    );

    try {
        const results = await Promise.all(promises);
        const dependencies: Record<string, any> = {};
        results.forEach(({ name, value }) => {
            dependencies[name] = value;
        });

        debugLog(`All dependencies resolved`, { names });
        return dependencies;
    } catch (error: any) {
        debugLog(`Failed to resolve all dependencies`, { names, error: error.message });
        throw error;
    }
}

/**
 * Check if a dependency is available
 */
function isAvailable(name: string): boolean {
    return state.dependencies.has(name);
}

/**
 * Get a dependency if available
 */
function get<T = any>(name: string): T | undefined {
    const dep = state.dependencies.get(name);
    return dep ? dep.value : undefined;
}

/**
 * Get dependency metadata
 */
function getMetadata(name: string): DependencyMetadata | undefined {
    const dep = state.dependencies.get(name);
    return dep ? dep.metadata : undefined;
}

/**
 * Remove a dependency
 */
function unregister(name: string): boolean {
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
        const promiseData = state.promises.get(name)!;
        promiseData.reject(new Error(`Dependency '${name}' was unregistered`));
        state.promises.delete(name);
    }

    return removed;
}

/**
 * Clear all dependencies
 */
function clear(): void {
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
 */
function getStatus(): DependencyStatus {
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
 */
function setDebugMode(enabled: boolean): void {
    config.debugMode = !!enabled;
    debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Create a dependency chain visualization
 */
function visualizeDependencies(): string {
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
const GreenhouseDependencyManager = {
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
        get: <K extends keyof DependencyConfig>(key: K): DependencyConfig[K] => config[key],
        set: <K extends keyof DependencyConfig>(key: K, value: DependencyConfig[K]): void => {
            if (Object.prototype.hasOwnProperty.call(config, key)) {
                config[key] = value;
                debugLog(`Configuration updated: ${String(key)} = ${value}`);
            }
        }
    }
};

// Auto-register the dependency manager itself
GreenhouseDependencyManager.register('dependencyManager', GreenhouseDependencyManager, {
    version: '1.0.0',
    description: 'Centralized dependency management system'
});

console.log('GreenhouseDependencyManager: Initialized and ready');

export { GreenhouseDependencyManager };
