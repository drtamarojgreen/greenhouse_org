import { Greenhouse } from './context.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
// Version: 0.1.0 (Debug Build)
/**
 * @file news.js
 * @description Core functionality for the Greenhouse news application.
 * Debug build with verbose logging.
 */

var _exported_GreenhouseNews: any;
(function () {
    'use strict';

    console.log("🔵 Loading Greenhouse News (Debug Build) - Version 0.1.0");

    /** ---------------- CONFIG ---------------- */
    const config = {
        loadTimeout: 15000,
        retries: { maxAttempts: 3, delay: 1000 },
        dom: { insertionDelay: 500, observerTimeout: 10000 },
        api: { getNews: '/_functions/getNews' }
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

    
    /** ---------------- APP METHODS ---------------- */
    const GreenhouseAppsNews = {
        async loadCSS() {
            console.debug("🎨 loadCSS called");
            // No CSS specific to news app to load dynamically.
            // pages.css is loaded globally.
        },

        async fetchNews() {
            console.debug("🌐 fetchNews called");
            try {
                const response = await fetch(config.api.getNews);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const newsData = data.items;
                console.debug("✅ News data received:", newsData);
                return newsData;
            } catch (error) {
                console.error("❌ fetchNews failed:", error);
                this.showErrorMessage('Failed to load news. Please try again later.');
                return [];
            }
        },

        createDefaultNewsView() {
            console.debug("📰 createDefaultNewsView called");
            const newsListContainer = createElement('div', { id: 'news-list', className: 'greenhouse-layout-container' });
            newsListContainer.appendChild(createElement('p', {}, 'Loading news...'));

            return createElement('div', { className: 'greenhouse-news-view' },
                createElement('div', { className: 'greenhouse-news-content' },
                    createElement('h2', {}, 'Greenhouse News'),
                    createElement('p', {}, 'Stay up-to-date with the latest news from Greenhouse Mental Health!'),
                    newsListContainer
                )
            );
        },

        displayNews(newsItems, container) {
            console.debug("🖼️ displayNews called:", newsItems);
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            if (newsItems && newsItems.length > 0) {
                newsItems.forEach(item => {
                    const newsItem = createElement('div', { className: 'greenhouse-card greenhouse-news-item' },
                        createElement('h3', { className: 'greenhouse-news-title' },
                            item.link
                                ? createElement('a', { href: item.link, target: '_blank', rel: 'noopener noreferrer' }, item.title || 'Untitled News')
                                : (item.title || 'Untitled News')
                        ),
                        createElement('p', { className: 'greenhouse-news-date' }, item.date ? new Date(item.date).toLocaleDateString() : ''),
                        createElement('p', {}, item.description || '')
                    );
                    container.appendChild(newsItem);
                });
                console.debug(`✅ Displayed ${newsItems.length} news items`);
            } else {
                console.warn("⚠️ No news items found");
                container.appendChild(createElement('p', {}, 'No news found at this time.'));
            }
        },

        async renderView() {
            console.debug(`🖌️ renderView called: ${appState.currentView}`);
            try {
                const appDomElement = this.createDefaultNewsView();
                const newsListContainer = appDomElement.querySelector('#news-list');
                if (newsListContainer) {
                    const newsItems = await this.fetchNews();
                    this.displayNews(newsItems, newsListContainer);
                }
                return appDomElement;
            } catch (error) {
                console.error("❌ renderView failed:", error);
                // Fallback to a generic error message if view rendering fails
                return createElement('div', { className: 'greenhouse-error-view' },
                    createElement('div', { className: 'greenhouse-error-content' },
                        createElement('h2', {}, 'Unable to Load Application'),
                        createElement('p', {}, 'An unexpected error occurred while loading the news. Please try again later.'),
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
                
                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;
                appState.targetElement = await waitForElement(targetSelector);

                this.loadCSS().catch(err => console.warn('⚠️ CSS load failed:', err));

                const appDomFragment = await this.renderView();
                await new Promise(res => setTimeout(res, config.dom.insertionDelay));
                this.insertApplication(appDomFragment, appState.targetElement);

                appState.isInitialized = true;
                console.log("✅ News app initialized successfully");
                this.showNotification('News application loaded successfully', 'success', 3000);

            } catch (error) {
                console.error("❌ init failed:", error);
                appState.errors.push(error);
                this.showErrorMessage('Failed to load news application');
            } finally {
                appState.isLoading = false;
            }
        }
    };

    /**
     * @function validateConfiguration
     * @description Validates the configuration passed from the loader script
     * @returns {boolean} True if configuration is valid
     */
    function validateConfiguration() {
        appState.targetSelector = scriptElement?.getAttribute('data-target-selector');
        appState.baseUrl = scriptElement?.getAttribute('data-base-url');
        const view = scriptElement?.getAttribute('data-view');

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

    /** ---------------- MAIN EXECUTION ---------------- */
    async function main() {
        try {
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

    const scriptElement = document.currentScript;
    _exported_GreenhouseNews = {
        getState: () => ({ ...appState }),
        getConfig: () => ({ ...config }),
        reinitialize: () => {
            console.debug("🔄 Reinitialize called");
            appState.isInitialized = false;
            appState.isLoading = false;
            return main();
        },
        showNotification: GreenhouseAppsNews.showNotification.bind(GreenhouseAppsNews)
    };

    main();

})();


export var GreenhouseNews = _exported_GreenhouseNews;
