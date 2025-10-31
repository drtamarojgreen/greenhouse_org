// docs/js/models.js

(function() {
    'use strict';
    console.log('Models App: Script execution started.');

    let GreenhouseUtils; // Will be assigned after loading
    let resilienceObserver = null;

    // --- Robust Dependency Loading from scheduler.js ---
    const loadDependencies = async () => {
        console.log('Models App: loadDependencies started.');
        if (window.GreenhouseDependencyManager) {
            console.log('Models App: Using GreenhouseDependencyManager for dependency loading');
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
                console.log('Models App: GreenhouseUtils loaded via dependency manager');
            } catch (error) {
                console.error('Models App: Failed to load GreenhouseUtils via dependency manager:', error.message);
            }
        } else {
            console.log('Models App: Using fallback event-based system with polling');
            await new Promise(resolve => {
                if (window.GreenhouseUtils) {
                    console.log('Models App: GreenhouseUtils already available');
                    resolve();
                    return;
                }
                const handleReady = () => {
                    window.removeEventListener('greenhouse:utils-ready', handleReady);
                    clearInterval(pollInterval);
                    clearTimeout(timeoutId);
                    resolve();
                };
                window.addEventListener('greenhouse:utils-ready', handleReady);
                let attempts = 0;
                const maxAttempts = 200;
                const pollInterval = setInterval(() => {
                    if (window.GreenhouseUtils) {
                        clearInterval(pollInterval);
                        clearTimeout(timeoutId);
                        window.removeEventListener('greenhouse:utils-ready', handleReady);
                        resolve();
                    } else if (++attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        clearTimeout(timeoutId);
                        window.removeEventListener('greenhouse:utils-ready', handleReady);
                        console.error('Models App: GreenhouseUtils not available after 10 second timeout');
                        resolve();
                    }
                }, 50);
                const timeoutId = setTimeout(() => {
                    clearInterval(pollInterval);
                    window.removeEventListener('greenhouse:utils-ready', handleReady);
                    console.error('Models App: Final timeout reached');
                    resolve();
                }, 12000);
            });
        }
        console.log('Models App: loadDependencies finished.');
    };

    const GreenhouseModels = {
        state: { isInitialized: false, isLoading: false, /* ... rest of state ... */ },
        async init() {
            console.log('Models App: init() called.');
            if (this.state.isInitialized || this.state.isLoading) return;
            this.state.isLoading = true;
            try {
                if (resilienceObserver) resilienceObserver.disconnect();
                if (!this.getConfiguration()) throw new Error("Missing configuration from script tag.");
                console.log(`Models App: Configuration loaded. Target: ${this.state.targetSelector}`);
                this.state.targetElement = await GreenhouseUtils.waitForElement(this.state.targetSelector, 15000);
                console.log('Models App: Target element found.');
                await this.loadCSS();
                console.log('Models App: CSS loaded.');
                this.renderConsentScreen();
                this.state.isInitialized = true;
                this.observeAndReinitializeApp(this.state.targetElement);
            } catch (error) {
                console.error('Models App: Initialization failed:', error);
                GreenhouseUtils.displayError(`Failed to load simulation: ${error.message}`);
            } finally {
                this.state.isLoading = false;
            }
        },
        getConfiguration() {
            const scriptElement = document.currentScript;
            if (!scriptElement) {
                console.error('Models App: Could not find current script element.');
                return false;
            }
            this.state.targetSelector = scriptElement.getAttribute('data-target-selector-left');
            this.state.baseUrl = scriptElement.getAttribute('data-base-url');
            return !!(this.state.targetSelector && this.state.baseUrl);
        },
        async loadCSS() {
            const cssUrl = `${this.state.baseUrl}css/model.css`;
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssUrl;
                document.head.appendChild(link);
                await new Promise((resolve, reject) => { link.onload = resolve; link.onerror = reject; });
            }
        },
        observeAndReinitializeApp(container) {
            if (!container) return;
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.classList.contains('greenhouse-landing-container')));
                if (wasRemoved) {
                    console.warn('Models App Resilience: Main container removed. Re-initializing.');
                    if (resilienceObserver) resilienceObserver.disconnect();
                    this.state.isInitialized = false;
                    this.init();
                }
            };
            resilienceObserver = new MutationObserver(observerCallback);
            resilienceObserver.observe(container, { childList: true });
        },
        renderConsentScreen() {
            console.log('Models App: renderConsentScreen() called.');
            this.state.targetElement.innerHTML = '';
            const container = this.createElement('div', { className: 'greenhouse-landing-container' });
            container.innerHTML = `
                <h1 class="greenhouse-simulation-title">Neural Plasticity & CBT/DBT</h1>
                <p>This is a browser-based educational simulation...</p>
                <div class="greenhouse-disclaimer-banner">Simulation — Educational model only...</div>
                <label class="greenhouse-consent-label">
                    <input type="checkbox" id="consent-checkbox" class="greenhouse-consent-checkbox" data-testid="consent-checkbox">
                    I understand this simulation is educational only and not a substitute for clinical care.
                </label>
                <button id="start-simulation-btn" class="greenhouse-btn-primary" disabled>Start Simulation</button>
            `;
            this.state.targetElement.appendChild(container);
            this.addConsentListeners();
        },
        renderSimulationInterface() { /* ... UI rendering logic ... */ },
        addConsentListeners() {
            const check = document.getElementById('consent-checkbox');
            const btn = document.getElementById('start-simulation-btn');
            check.addEventListener('change', () => { btn.disabled = !check.checked; });
            btn.addEventListener('click', () => this.renderSimulationInterface());
        },
        // ... (rest of the GreenhouseModels methods are unchanged)
        populateMetricsPanel(panel) { panel.innerHTML = `...`; },
        populateControlsPanel(container) { container.innerHTML = `...`; },
        addSimulationListeners() { /* ... */ },
        simulationLoop() { /* ... */ },
        updateMetrics() { /* ... */ },
        drawCanvas() { /* ... */ },
        resizeCanvas() { /* ... */ },
        createElement(tag, attributes = {}, ...children) {
            const el = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
            children.forEach(child => el.append(child));
            return el;
        }
    };

    async function main() {
        console.log('Models App: main() started.');
        await loadDependencies();
        GreenhouseUtils = window.GreenhouseUtils;
        if (!GreenhouseUtils) {
            console.error('Models App: CRITICAL - Aborting main() due to missing GreenhouseUtils.');
            return;
        }
        console.log('Models App: GreenhouseUtils is available, proceeding with init.');
        GreenhouseModels.init();
    }

    // --- Main Execution Logic ---
    main();

    window.GreenhouseModels = {
        reinitialize: () => {
            GreenhouseModels.state.isInitialized = false;
            return GreenhouseModels.init();
        }
    };
})();