// Version: 0.0.2
/**
 * @file videos.js
 * @description Core functionality for the Greenhouse videos application.
 */

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
        api: {
            getVideos: '/_functions/getLatestVideosFromFeed'
        }
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
        appState.targetSelector = scriptElement?.getAttribute('data-target-selector');
        appState.baseUrl = scriptElement?.getAttribute('data-base-url');
        const view = scriptElement?.getAttribute('data-view');

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
            const loadOperation = async (cssFileName) => {
                const response = await fetch(`${appState.baseUrl}css/${cssFileName}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return await response.text();
            };
            try {
                const videosCssText = await retryOperation(() => loadOperation('videos.css'), 'Loading videos.css');
                if (!document.querySelector('style[data-greenhouse-videos-css]')) {
                    const styleElement = document.createElement('style');
                    styleElement.setAttribute('data-greenhouse-videos-css', 'true');
                    styleElement.textContent = videosCssText;
                    document.head.appendChild(styleElement);
                }
                const videoCssText = await retryOperation(() => loadOperation('video.css'), 'Loading video.css');
                if (!document.querySelector('style[data-greenhouse-video-css]')) {
                    const styleElement = document.createElement('style');
                    styleElement.setAttribute('data-greenhouse-video-css', 'true');
                    styleElement.textContent = videoCssText;
                    document.head.appendChild(styleElement);
                }
            } catch {
                this.loadFallbackCSS();
            }
        },

        loadFallbackCSS() {
            const fallbackCSS = `
                .greenhouse-layout-container { display: flex; flex-wrap: wrap; gap: 20px; }
                .greenhouse-video-item { flex: 1; min-width: 300px; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                .greenhouse-video-title { font-weight: bold; margin-bottom: 10px; }
                .greenhouse-video-player { width: 100%; height: 200px; background-color: #000; margin-bottom: 10px; }
                .greenhouse-loading-spinner { display: flex; align-items: center; gap: 10px; }
            `;
            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-greenhouse-videos-fallback-css', 'true');
            styleElement.textContent = fallbackCSS;
            document.head.appendChild(styleElement);
        },

        async fetchVideos() {
            try {
                const response = await fetch(config.api.getVideos);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error(`Unexpected response type: ${contentType}`);
                }
                return await response.json();
            } catch (error) {
                const videosListElement = document.getElementById('videos-list');
                if (videosListElement) {
                    videosListElement.innerHTML = `<p>Failed to load videos: ${error.message}</p>`;
                }
                if (error.message.includes('status: 404')) {
                    appState.hasCriticalError = true;
                    this.displayCriticalErrorOverlay(`Failed to load videos: ${error.message}`);
                }
                return [];
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
                return this.createErrorView(`Failed to load ${appState.currentView} view: ${error.message}`);
            }
        },

        createDefaultVideosView() {
            const fragment = document.createDocumentFragment();
            const videosDiv = document.createElement('div');
            videosDiv.className = 'greenhouse-videos-view';
            videosDiv.innerHTML = `
                <div class="greenhouse-videos-content">
                    <h2>Greenhouse Shorts</h2>
                    <p>Check out the latest short videos from @greenhousemhd!</p>
                    <div id="videos-list" class="greenhouse-layout-container">
                        <p>Loading videos...</p>
                    </div>
                </div>
            `;
            fragment.appendChild(videosDiv);
            return fragment;
        },

        displayVideos(videos, container) {
            container.innerHTML = '';
            const videosToDisplay = (videos && videos.length > 0) ? videos : [
                { title: 'Placeholder Video 1', description: 'No content available.', embedUrl: 'https://www.youtube.com/embed/placeholder1' },
                { title: 'Placeholder Video 2', description: 'No content available.', embedUrl: 'https://www.youtube.com/embed/placeholder2' }
            ];
            const videoGridContainer = document.createElement('div');
            videoGridContainer.className = 'video-grid-container';
            container.appendChild(videoGridContainer);

            videosToDisplay.forEach((video) => {
                const videoItem = document.createElement('div');
                videoItem.className = 'video-item';
                if (!videos || videos.length === 0) {
                    videoItem.classList.add('placeholder');
                }
                const videoContent = document.createElement('div');
                videoContent.className = 'video-content';
                const videoTitle = document.createElement('h2');
                videoTitle.className = 'video-title';
                videoTitle.textContent = video.title || 'Untitled Video';
                const videoDescription = document.createElement('p');
                videoDescription.className = 'video-description';
                videoDescription.textContent = video.description || '';
                const videoPlayerContainer = document.createElement('div');
                videoPlayerContainer.className = 'video-player-container';
                const iframe = document.createElement('iframe');
                iframe.src = video.embedUrl || video.url;
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.setAttribute('allowfullscreen', '');
                videoPlayerContainer.appendChild(iframe);
                videoContent.appendChild(videoTitle);
                videoContent.appendChild(videoDescription);
                videoItem.appendChild(videoPlayerContainer);
                videoItem.appendChild(videoContent);
                videoGridContainer.appendChild(videoItem);
            });
        },

        createErrorView(message) {
            const fragment = document.createDocumentFragment();
            const errorDiv = document.createElement('div');
            errorDiv.className = 'greenhouse-error-view';
            errorDiv.innerHTML = `
                <div class="greenhouse-error-content">
                    <h2>Unable to Load Application</h2>
                    <p>${message}</p>
                    <p>Please refresh the page or contact support.</p>
                    <button class="greenhouse-btn greenhouse-btn-primary">Refresh Page</button>
                </div>
            `;
            const btn = errorDiv.querySelector('button');
            btn.addEventListener('click', () => window.location.reload());
            fragment.appendChild(errorDiv);
            return fragment;
        },

        showNotification(message, type = 'info', duration = 5000) {
            const existing = document.querySelectorAll('.greenhouse-notification');
            existing.forEach(el => el.remove());
            const notification = document.createElement('div');
            notification.className = `greenhouse-notification greenhouse-notification-${type}`;
            notification.innerHTML = `
                <div class="greenhouse-notification-content">
                    <span>${message}</span>
                    <button type="button">&times;</button>
                </div>
            `;
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                padding: 15px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                background: #d1ecf1; color: #0c5460;
            `;
            document.body.appendChild(notification);
            const closeBtn = notification.querySelector('button');
            closeBtn.addEventListener('click', () => notification.remove());
            if (duration > 0) {
                setTimeout(() => notification.remove(), duration);
            }
        },

        async init(targetSelector, baseUrl) {
            if (appState.isInitialized || appState.isLoading) return;
            appState.isLoading = true;
            try {
                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;
                appState.targetElement = await waitForElement(targetSelector);
                this.loadCSS().catch(() => this.loadFallbackCSS());
                const appDomFragment = await this.renderView();
                await new Promise(res => setTimeout(res, config.dom.insertionDelay));
                const appContainer = document.createElement('section');
                appContainer.id = 'greenhouse-app-container';
                appContainer.appendChild(appDomFragment);
                appState.targetElement.prepend(appContainer);
                appState.isInitialized = true;
                this.showNotification('Videos app loaded', 'success', 3000);
            } catch (error) {
                appState.errors.push(error);
                if (error.message.includes('status: 404')) {
                    appState.hasCriticalError = true;
                    this.displayCriticalErrorOverlay(error.message);
                } else {
                    this.showNotification('Failed to load videos app', 'error');
                }
            } finally {
                appState.isLoading = false;
            }
        },

        displayCriticalErrorOverlay(message) {
            const existingError = document.getElementById('greenhouse-critical-error-overlay');
            if (existingError) existingError.remove();
            const errorDiv = document.createElement('div');
            errorDiv.id = 'greenhouse-critical-error-overlay';
            errorDiv.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(255,255,255,0.95); display: flex;
                justify-content: center; align-items: center; z-index: 100000;
            `;
            errorDiv.innerHTML = `
                <div style="background:#f8d7da; padding:30px; border-radius:8px;">
                    <h2>Greenhouse Videos Application Error</h2>
                    <p>${message}</p>
                    <button>Reload Page</button>
                </div>
            `;
            document.body.appendChild(errorDiv);
            const btn = errorDiv.querySelector('button');
            btn.addEventListener('click', () => window.location.reload());
        }
    };

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
    const animationStyle = document.createElement('style');
    animationStyle.textContent = animationCSS;
    document.head.appendChild(animationStyle);

    window.GreenhouseVideos = {
        getState: () => ({ ...appState }),
        getConfig: () => ({ ...config }),
        reinitialize: () => { appState.isInitialized = false; appState.isLoading = false; return main(); },
        showNotification: GreenhouseAppsVideos.showNotification.bind(GreenhouseAppsVideos)
    };

    main();

})();
