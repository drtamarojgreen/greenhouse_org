'''// Version: 0.1.0 (Debug Build)
/**
 * @file inspiration.js
 * @description Core functionality for the Greenhouse inspiration application.
 * Debug build with verbose logging.
 */

(function () {
    'use strict';

    console.log("🔵 Loading Greenhouse Inspiration (Debug Build) - Version 0.1.0");

    /** ---------------- CONFIG ---------------- */
    const config = {
        loadTimeout: 15000,
        retries: { maxAttempts: 3, delay: 1000 },
        dom: { insertionDelay: 500, observerTimeout: 10000 },
        api: { getInspiration: '/_functions/getInspiration' }
    };

    /** ---------------- STATE ---------------- */
    const appState = {
        isInitialized: false,
        isLoading: false,
        currentView: 'default',
        currentAppInstance: null,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        loadedScripts: new Set(),
        errors: []
    };

    /** ---------------- UTILITIES ---------------- */
    function createElement(tag, attributes = {}, ...children) {
        console.debug(`🔧 createElement called: <${tag}>`, attributes, children);
        const element = document.createElement(tag);
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                element.setAttribute(key, attributes[key]);
            }
        }
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        return element;
    }

    function waitForElement(selector, timeout = config.loadTimeout) {
        console.debug(`⏳ waitForElement: Waiting for "${selector}" (timeout: ${timeout}ms)`);
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                console.debug(`✅ Found element immediately: ${selector}`);
                return resolve(element);
            }

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    console.debug(`✅ Found element later: ${selector}`);
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                console.error(`❌ Timeout waiting for element: ${selector}`);
                reject(new Error(`Timeout: Element ${selector} not found`));
            }, timeout);
        });
    }

    function loadScript(src) {
        console.debug(`📜 loadScript: ${src}`);
        return new Promise((resolve, reject) => {
            if (appState.loadedScripts.has(src)) {
                console.debug(`✔️ Script already loaded: ${src}`);
                return resolve();
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.debug(`✅ Script loaded: ${src}`);
                appState.loadedScripts.add(src);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    /** ---------------- APP METHODS ---------------- */
    const GreenhouseAppsInspiration = {
        async loadCSS() {
            console.debug("🎨 loadCSS called");
            const cssPath = `${appState.baseUrl}css/inspiration.css`;
            if (document.querySelector(`link[href="${cssPath}"]`)) {
                console.debug("✔️ CSS already loaded");
                return;
            }
            const link = createElement('link', {
                rel: 'stylesheet',
                href: cssPath
            });
            document.head.appendChild(link);
            console.debug("✅ CSS loading initiated");
        },

        async fetchInspiration() {
            console.debug("🌐 fetchInspiration called");
            try {
                const response = await fetch(config.api.getInspiration);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const inspirationData = data.items;
                console.debug("✅ Inspiration data received:", inspirationData);
                return inspirationData;
            } catch (error) {
                console.error("❌ fetchInspiration failed:", error);
                this.showErrorMessage('Failed to load inspiration. Please try again later.');
                return [];
            }
        },

        createDefaultInspirationView() {
            console.debug("📰 createDefaultInspirationView called");
            const inspirationListContainer = createElement('div', { id: 'inspiration-list', className: 'greenhouse-layout-container' });
            inspirationListContainer.appendChild(createElement('p', {}, 'Loading inspiration...'));

            return createElement('div', { className: 'greenhouse-inspiration-view' },
                createElement('div', { className: 'greenhouse-inspiration-content' },
                    createElement('h2', {}, 'Greenhouse Inspiration'),
                    createElement('p', {}, 'Find your daily dose of inspiration!'),
                    inspirationListContainer
                )
            );
        },

        displayInspiration(inspirationItems, container) {
            console.debug("🖼️ displayInspiration called:", inspirationItems);
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            if (inspirationItems && inspirationItems.length > 0) {
                inspirationItems.forEach(item => {
                    const inspirationItem = createElement('div', { className: 'greenhouse-card greenhouse-inspiration-item' },
                        createElement('h3', { className: 'greenhouse-inspiration-title' },
                            item.link
                                ? createElement('a', { href: item.link, target: '_blank', rel: 'noopener noreferrer' }, item.title || 'Untitled Inspiration')
                                : (item.title || 'Untitled Inspiration')
                        ),
                        createElement('p', { className: 'greenhouse-inspiration-source' }, item.source ? `Source: ${item.source}` : ''),
                        createElement('p', {}, item.quote || '')
                    );
                    container.appendChild(inspirationItem);
                });
                console.debug(`✅ Displayed ${inspirationItems.length} inspiration items`);
            } else {
                console.warn("⚠️ No inspiration items found");
                container.appendChild(createElement('p', {}, 'No inspiration found at this time.'));
            }
        },

        async renderView() {
            console.debug(`🖌️ renderView called: ${appState.currentView}`);
            try {
                const appDomElement = this.createDefaultInspirationView();
                const inspirationListContainer = appDomElement.querySelector('#inspiration-list');
                if (inspirationListContainer) {
                    const inspirationItems = await this.fetchInspiration();
                    this.displayInspiration(inspirationItems, inspirationListContainer);
                }
                return appDomElement;
            } catch (error) {
                console.error("❌ renderView failed:", error);
                return createElement('div', { className: 'greenhouse-error-view' },
                    createElement('div', { className: 'greenhouse-error-content' },
                        createElement('h2', {}, 'Unable to Load Application'),
                        createElement('p', {}, 'An unexpected error occurred while loading inspiration. Please try again later.'),
                        createElement('button', {
                            onclick: 'window.location.reload()',
                            className: 'greenhouse-btn greenhouse-btn-primary'
                        }, 'Refresh Page')
                    )
                );
            }
        },

        insertApplication(appDomFragment, targetElement) {
            console.debug("📥 insertApplication called");
            const appContainer = createElement('section', {
                id: 'greenhouse-app-container',
                className: 'greenhouse-app-container',
                'data-greenhouse-app': appState.currentView
            }, appDomFragment);

            targetElement.prepend(appContainer);
            console.debug("✅ Application inserted into DOM");
            return appContainer;
        },

        showSuccessMessage(message) { console.debug("✅ showSuccessMessage:", message); GreenhouseUtils.displaySuccess(message); },
        showErrorMessage(message) { console.error("❌ showErrorMessage:", message); GreenhouseUtils.displayError(message); },
        showNotification(message, type = 'info', duration = 5000) {
            console.debug(`🔔 showNotification: [${type}] ${message} (${duration}ms)`);
            if (type === 'success') GreenhouseUtils.displaySuccess(message, duration);
            else if (type === 'error') GreenhouseUtils.displayError(message, duration);
            else GreenhouseUtils.displayInfo(message, duration);
        },

        async init(targetSelector, baseUrl) {
            console.debug("🚀 init called:", { targetSelector, baseUrl });
            if (appState.isInitialized || appState.isLoading) {
                console.warn("⚠️ Already initialized or loading, skipping");
                return;
            }

            appState.isLoading = true;
            try {
                await loadScript(`${baseUrl}js/GreenhouseUtils.js`);
                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;
                appState.targetElement = await waitForElement(targetSelector);

                this.loadCSS().catch(err => console.warn('⚠️ CSS load failed:', err));

                const appDomFragment = await this.renderView();
                await new Promise(res => setTimeout(res, config.dom.insertionDelay));
                this.insertApplication(appDomFragment, appState.targetElement);

                appState.isInitialized = true;
                console.log("✅ Inspiration app initialized successfully");
                this.showNotification('Inspiration application loaded successfully', 'success', 3000);

            } catch (error) {
                console.error("❌ init failed:", error);
                appState.errors.push(error);
                this.showErrorMessage('Failed to load inspiration application');
            } finally {
                appState.isLoading = false;
            }
        }
    };

    function validateConfiguration() {
        const scriptElement = document.currentScript;
        const globalAttributes = (window._greenhouseAllScriptAttributes && window._greenhouseAllScriptAttributes['inspiration.js'])
            ? window._greenhouseAllScriptAttributes['inspiration.js']
            : (window._greenhouseScriptAttributes || {});

        appState.targetSelector = globalAttributes['target-selector-left']
                                 || globalAttributes['target-selector']
                                 || scriptElement?.getAttribute('data-target-selector');
        appState.baseUrl = globalAttributes['base-url'] || scriptElement?.getAttribute('data-base-url');
        const view = globalAttributes['view'] || scriptElement?.getAttribute('data-view');

        if (!appState.targetSelector) {
            console.error('Inspiration: Missing required data-target-selector attribute');
            return false;
        }

        if (!appState.baseUrl) {
            console.error('Inspiration: Missing required data-base-url attribute');
            return false;
        }

        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'default';

        console.log(`Inspiration: Configuration validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
        return true;
    }

    /** ---------------- MAIN EXECUTION ---------------- */
    async function main() {
        try {
            if (!validateConfiguration()) {
                console.error('Inspiration: Invalid configuration, cannot proceed');
                return;
            }

            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('greenhouse')) {
                    console.error('Inspiration: Global error caught:', event.error);
                    appState.errors.push(event.error);
                }
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Inspiration: Unhandled promise rejection:', event.reason);
                appState.errors.push(event.reason);
            });

            await GreenhouseAppsInspiration.init(appState.targetSelector, appState.baseUrl);

        } catch (error) {
            console.error('Inspiration: Main execution failed:', error);
        }
    }

    window.GreenhouseInspiration = {
        getState: () => ({ ...appState }),
        getConfig: () => ({ ...config }),
        reinitialize: () => {
            console.debug("🔄 Reinitialize called");
            appState.isInitialized = false;
            appState.isLoading = false;
            return main();
        },
        showNotification: GreenhouseAppsInspiration.showNotification.bind(GreenhouseAppsInspiration)
    };

    main();

})();
''