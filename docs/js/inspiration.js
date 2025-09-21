
(function() {
    'use strict';

    console.log("Loading Greenhouse Inspiration - Version 0.1.0");

    const config = {
        loadTimeout: 15000,
        retries: {
            maxAttempts: 3,
            delay: 1000
        },
        dom: {
            insertionDelay: 500,
            observerTimeout: 10000
        }
    };

    const scriptElement = document.currentScript;

    const appState = {
        isInitialized: false,
        isLoading: false,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        errors: [],
    };

    function validateConfiguration() {
        appState.targetSelector = scriptElement?.getAttribute('data-target-selector');
        appState.baseUrl = scriptElement?.getAttribute('data-base-url');

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

        console.log(`Inspiration: Configuration validated - Target: ${appState.targetSelector}`);
        return true;
    }

    function waitForElement(selector, timeout = config.dom.observerTimeout) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Inspiration: Found target element immediately: ${selector}`);
                return resolve(element);
            }

            console.log(`Inspiration: Waiting for target element: ${selector}`);

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    console.log(`Inspiration: Target element found: ${selector}`);
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

    async function retryOperation(operation, operationName, maxAttempts = config.retries.maxAttempts) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`Inspiration: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`Inspiration: ${operationName} failed on attempt ${attempt}:`, error.message);
                
                if (attempt < maxAttempts) {
                    const delay = config.retries.delay * Math.pow(2, attempt - 1);
                    console.log(`Inspiration: Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
    }

    const GreenhouseInspiration = {
        async fetchAndDisplayInspiration() {
            try {
                const response = await fetch(`${appState.baseUrl}endpoints/inspiration.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Populate summary sections
                if (data.summary) {
                    this.updateElementText('#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div > section.wixui-section > div:nth-child(2) > div > section > div > div:nth-child(1) > div:nth-child(2) > div > div.comp-mfe19kc3 > button', data.summary.pageTitle);
                    this.updateElementText('#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div > section.wixui-section > div:nth-child(2) > div > section > div > div:nth-child(2) > div:nth-child(2) > div > div > p > span', data.summary.titleButton);
                    this.updateElementText('#SITE_PAGES_TRANSITION_GROUP > div > div.HT5ybB > div > div > div > section.Oqnisf.comp-mfe19kd4.wixui-section > div:nth-child(2) > div > section > div.V5AUxf > div > div:nth-child(2) > div > div.Z_l5lU.ku3DBC.zQ9jDz.qvSjx3.Vq6kJx.comp-mfe19kdj.wixui-rich-text > h2 > span', data.summary.sectionTitle);
                    this.updateElementText('#SITE_PAGES_TRANSITION_GROUP > div > div > div > div > div > section.wixui-section > div:nth-child(2) > div > section > div > div > div:nth-child(2) > div > div:nth-child(1) > h2 > span', data.summary.sectionSubtitle);
                    this.updateElementText('#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div > section.wixui-section > div:nth-child(2) > div > section > div > div > div:nth-child(2) > div > div:nth-child(3) > p > span', data.summary.sectionText);
                }

                // Populate quotes
                const quotes = data.quotes;
                const quoteContainer = document.querySelector(appState.targetSelector);
                if (quoteContainer && quotes && quotes.length > 0) {
                    quoteContainer.innerHTML = ''; // Clear existing content
                    quotes.forEach(quote => {
                        const quoteElement = this.createQuoteElement(quote);
                        quoteContainer.appendChild(quoteElement);
                    });
                } else {
                    console.warn('Inspiration: Quote container or quotes not found.');
                }

            } catch (error) {
                console.error("Inspiration: Error fetching inspiration data:", error);
            }
        },

        updateElementText(selector, text) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            } else {
                console.warn(`Inspiration: Element with selector "${selector}" not found.`);
            }
        },

        createQuoteElement(quote) {
            const element = document.createElement('div');
            element.className = 'inspiration-quote';
            element.innerHTML = `
                <p class="quote-text">"${quote.text}"</p>
                <p class="quote-author">- ${quote.author}</p>
            `;
            return element;
        },

        async init(targetSelector, baseUrl) {
            if (appState.isInitialized || appState.isLoading) {
                console.log('Inspiration: Already initialized or loading, skipping');
                return;
            }

            appState.isLoading = true;
            try {
                console.log('Inspiration: Starting initialization');

                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;

                appState.targetElement = await waitForElement(targetSelector);

                await this.fetchAndDisplayInspiration();

                appState.isInitialized = true;
                console.log('Inspiration: Initialization completed successfully');

            } catch (error) {
                console.error('Inspiration: Initialization failed:', error);
                appState.errors.push(error);
            } finally {
                appState.isLoading = false;
            }
        }
    };

    async function main() {
        try {
            if (!validateConfiguration()) {
                console.error('Inspiration: Invalid configuration, cannot proceed');
                return;
            }

            await GreenhouseInspiration.init(appState.targetSelector, appState.baseUrl);

        } catch (error) {
            console.error('Inspiration: Main execution failed:', error);
        }
    }

    window.GreenhouseInspiration = {
        getState: () => ({ ...appState }),
        reinitialize: () => {
            appState.isInitialized = false;
            appState.isLoading = false;
            return main();
        }
    };

    main();

})();
