// Version: 0.0.2
/**
 * @file videos.js
 * @description Core functionality for the Greenhouse videos application.
 */

import { get_getLatestVideosFromFeed } from 'backend/getLatestVideosFromFeed';

(function() {
    'use strict';

    console.log("Loading Greenhouse Videos - Version 0.0.2");

    const config = {
        loadTimeout: 15000,
        retries: {
            maxAttempts: 3,
            delay: 1000
        },
        dom: {
            insertionDelay: 500,
            observerTimeout: 10000
        },
        // api: { // No longer needed with direct backend import
        //     getVideos: '/_functions/getLatestVideosFromFeed'
        // }
    };

    const scriptElement = document.currentScript;

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
        hasCriticalError: false
    };

    function validateConfiguration() {
        const globalAttributes = (window._greenhouseAllScriptAttributes && window._greenhouseAllScriptAttributes['videos.js'])
            ? window._greenhouseAllScriptAttributes['videos.js']
            : (window._greenhouseScriptAttributes || {});

        appState.targetSelector = globalAttributes['target-selector-left']
                                 || globalAttributes['target-selector']
                                 || scriptElement?.getAttribute('data-target-selector');
        appState.baseUrl = globalAttributes['base-url'] || scriptElement?.getAttribute('data-base-url');
        const view = globalAttributes['view'] || scriptElement?.getAttribute('data-view');

        if (!appState.targetSelector) {
            console.error('Videos: Missing required data-target-selector attribute');
            return false;
        }
        if (!appState.baseUrl) {
            console.error('Videos: Missing required data-base-url attribute');
            return false;
        }
        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'default';

        console.log(`Videos: Config validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
        return true;
    }

    function waitForElement(selector, timeout = config.dom.observerTimeout) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Target element not found within ${timeout}ms: ${selector}`));
            }, timeout);
        });
    }

    async function retryOperation(operation, operationName, maxAttempts = config.retries.maxAttempts) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    const delay = config.retries.delay * Math.pow(2, attempt - 1);
                    await new Promise(res => setTimeout(res, delay));
                }
            }
        }
        throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
    }

    const GreenhouseAppsVideos = {
        observeVideosListElement(elementToObserve) {
            if (!elementToObserve) return;
            const observer = new MutationObserver((mutations) => {
                let wasRemoved = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                        for (const removedNode of mutation.removedNodes) {
                            if (removedNode === elementToObserve || (removedNode.contains && removedNode.contains(elementToObserve))) {
                                wasRemoved = true;
                                break;
                            }
                        }
                    }
                }
                if (wasRemoved) {
                    observer.disconnect();
                    appState.isInitialized = false;
                    appState.isLoading = false;
                    main();
                }
            });
            if (elementToObserve.parentElement) {
                observer.observe(elementToObserve.parentElement, { childList: true, subtree: true });
            }
        },

        async loadScript(scriptName) {
            if (appState.loadedScripts.has(scriptName)) return;

            const loadOperation = async () => {
                const response = await fetch(`${appState.baseUrl}js/${scriptName}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return await response.text();
            };

            const scriptText = await retryOperation(loadOperation, `Loading script ${scriptName}`);

            if (document.querySelector(`script[data-script-name="${scriptName}"]`)) {
                appState.loadedScripts.add(scriptName);
                return;
            }

            const newScript = document.createElement('script');
            newScript.dataset.scriptName = scriptName;
            newScript.dataset.loadedBy = 'greenhouse-videos';
            newScript.textContent = scriptText;
            document.body.appendChild(newScript);

            appState.loadedScripts.add(scriptName);
        },

        async loadCSS() {
            // pages.css is loaded globally, no need to inject here.
        },

        async fetchVideos() {
            try {
                const jsonLdElement = document.querySelector('script[type="application/ld+json"]');
                if (!jsonLdElement) {
                    throw new Error('Structured data script with type "application/ld+json" not found on the page.');
                }

                const structuredData = JSON.parse(jsonLdElement.textContent);
                const videoItems = structuredData.itemListElement;

                if (!videoItems || !Array.isArray(videoItems)) {
                    throw new Error('The "itemListElement" property was not found in the structured data.');
                }

                // The repeater expects 'title' but the data has 'name'. Let's map it.
                return videoItems.map(item => {
                    const video = item.item || item;
                    return {
                        id: video['@id'] || video.thumbnailUrl.split('/')[4],
                        title: video.name, // Map 'name' to 'title'
                        description: video.description,
                        embedUrl: video.embedUrl,
                        published: video.uploadDate
                    };
                });
            } catch (error) {
                console.error("Error evaluating video data from page:", error);
                const videosListElement = document.getElementById('videos-list');
                if (videosListElement) {
                    videosListElement.innerHTML = '';
                    videosListElement.appendChild(createElement('p', {}, `Failed to load videos: ${error.message}`));
                }
                GreenhouseUtils.displayError(`Failed to load videos: ${error.message}`);
                // Fallback to placeholder data if evaluation fails
                return [
                    { title: 'Placeholder Video 1', description: 'Could not load video data from page.', embedUrl: 'https://www.youtube.com/embed/placeholder1' },
                    { title: 'Placeholder Video 2', description: 'Please check console for errors.', embedUrl: 'https://www.youtube.com/embed/placeholder2' }
                ];
            }
        },

        async renderView() {
            let appDomFragment;
            try {
                appDomFragment = this.createDefaultVideosView();
                const videosListContainer = appDomFragment.querySelector('#videos-list');
                if (videosListContainer) {
                    const videos = await this.fetchVideos();
                    this.displayVideos(videos, videosListContainer);
                }
                return appDomFragment;
            } catch (error) {
                GreenhouseUtils.displayError(`Failed to load ${appState.currentView} view: ${error.message}`);
                return this.createErrorView(`Failed to load ${appState.currentView} view: ${error.message}`);
            }
        },

        createDefaultVideosView() {
            const videosDiv = createElement('div', { className: 'greenhouse-videos-view' },
                createElement('div', { className: 'greenhouse-videos-content' },
                    createElement('h2', {}, 'Greenhouse Shorts'),
                    createElement('p', {}, 'Check out the latest short videos from @greenhousemhd!'),
                    createElement('div', { id: 'videos-list', className: 'greenhouse-layout-container' },
                        createElement('p', {}, 'Loading videos...')
                    )
                )
            );
            return videosDiv;
        },

        displayVideos(videos, container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            const videosToDisplay = (videos && videos.length > 0) ? videos : [
                { title: 'Placeholder Video 1', description: 'No content available.', embedUrl: 'https://www.youtube.com/embed/placeholder1' },
                { title: 'Placeholder Video 2', description: 'No content available.', embedUrl: 'https://www.youtube.com/embed/placeholder2' }
            ];
            const videoGridContainer = createElement('div', { className: 'video-grid-container' });
            container.appendChild(videoGridContainer);

            videosToDisplay.forEach((video) => {
                const videoItem = createElement('div', { className: 'video-item' });
                if (!videos || videos.length === 0) {
                    videoItem.classList.add('placeholder');
                }
                const videoContent = createElement('div', { className: 'video-content' },
                    createElement('h2', { className: 'video-title' }, video.title || 'Untitled Video'),
                    createElement('p', { className: 'video-description' }, video.description || '')
                );
                const videoPlayerContainer = createElement('div', { className: 'video-player-container' },
                    createElement('iframe', {
                        src: video.embedUrl || video.url,
                        frameBorder: '0',
                        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                        allowfullscreen: ''
                    })
                );
                videoItem.appendChild(videoPlayerContainer);
                videoItem.appendChild(videoContent);
                videoGridContainer.appendChild(videoItem);
            });
        },

        createErrorView(message) {
            const errorDiv = createElement('div', { className: 'greenhouse-error-view' },
                createElement('div', { className: 'greenhouse-error-content' },
                    createElement('h2', {}, 'Unable to Load Application'),
                    createElement('p', {}, message),
                    createElement('p', {}, 'Please refresh the page or contact support.'),
                    createElement('button', { className: 'greenhouse-btn greenhouse-btn-primary' }, 'Refresh Page')
                )
            );
            const btn = errorDiv.querySelector('button');
            btn.addEventListener('click', () => window.location.reload());
            return errorDiv;
        },

        showSuccessMessage(message) { GreenhouseUtils.displaySuccess(message); },
        showErrorMessage(message) { GreenhouseUtils.displayError(message); },
        showNotification(message, type = 'info', duration = 5000) {
            if (type === 'success') GreenhouseUtils.displaySuccess(message, duration);
            else if (type === 'error') GreenhouseUtils.displayError(message, duration);
            else GreenhouseUtils.displayInfo(message, duration);
        },

        async init(targetSelector, baseUrl) {
            if (appState.isInitialized || appState.isLoading) return;
            appState.isLoading = true;
            try {
                await this.loadScript('GreenhouseUtils.js'); // Load GreenhouseUtils
                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;
                appState.targetElement = await waitForElement(targetSelector);
                this.loadCSS();
                const appDomFragment = await this.renderView();
                await new Promise(res => setTimeout(res, config.dom.insertionDelay));
                const appContainer = createElement('section', {
                    id: 'greenhouse-app-container',
                    className: 'greenhouse-app-container',
                    'data-greenhouse-app': appState.currentView
                }, appDomFragment);
                appState.targetElement.prepend(appContainer);
                appState.isInitialized = true;
                this.showNotification('Videos app loaded successfully', 'success', 3000);
            } catch (error) {
                appState.errors.push(error);
                this.showErrorMessage('Failed to load videos application');
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
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        return element;
    }

    async function main() {
        if (appState.hasCriticalError || appState.isLoading) return;
        if (!validateConfiguration()) return;
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('greenhouse')) {
                appState.errors.push(event.error);
            }
        });
        window.addEventListener('unhandledrejection', (event) => {
            appState.errors.push(event.reason);
        });
        await GreenhouseAppsVideos.init(appState.targetSelector, appState.baseUrl);
    }

    window.GreenhouseVideos = {
        getState: () => ({ ...appState }),
        getConfig: () => ({ ...config }),
        reinitialize: () => { appState.isInitialized = false; appState.isLoading = false; return main(); },
        showNotification: GreenhouseAppsVideos.showNotification.bind(GreenhouseAppsVideos)
    };

    main();

})();
