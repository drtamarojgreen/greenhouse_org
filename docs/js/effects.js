/**
 * @file effects.js
 * @description Visual effects system for the Greenhouse Mental Health website.
 * Provides interactive animations including a watering can cursor effect with particle system.
 * 
 * @features
 * - Watering can cursor that follows mouse movement
 * - Particle system that creates water droplets
 * - Blooming effect on hover over target elements
 * - Robust element detection with fallback selectors
 * - Memory leak prevention with proper cleanup
 */

(function() {
    'use strict';

    /**
     * @description Configuration for the effects system
     */
    const config = {
        /**
         * Timeout for waiting for elements to appear (in milliseconds)
         */
        elementWaitTimeout: 10000,
        /**
         * Particle system configuration
         */
        particles: {
            interval: 100,        // ms between particle creation
            lifetime: 1000,       // ms particle lives before cleanup
            spoutOffsetX: 20,     // offset from can icon for droplet spawn
            spoutOffsetY: 30,
            randomness: 5         // random offset range for natural effect
        },
        /**
         * Primary selectors for target elements (specific to current Wix structure)
         */
        selectors: {
            heading: 'body div#SITE_CONTAINER div div#site-root.site-root div#masterPage.mesh-layout.masterPage.css-editing-scope header#SITE_HEADER div section div p span span'
        },
        /**
         * Fallback selectors to try if primary selectors fail
         */
        fallbackSelectors: {
            heading: [
                'header#SITE_HEADER p span span',
                'header p span span',
                '#SITE_HEADER span',
                'header span',
                'h1',
                'h2',
                '.site-title',
                '[data-testid="richTextElement"] span'
            ]
        }
    };

    /**
     * Module-level state variables
     */
    let state = {
        canIconElement: null,
        headingElement: null,
        pouringIntervalId: null,
        isActive: false,
        isInitialized: false
    };

    /**
     * @function waitForElement
     * @description Waits for an element to appear in the DOM with fallback options
     * @param {string|string[]} selectors - Primary selector or array of selectors to try
     * @param {number} [timeout=10000] - Maximum time to wait in milliseconds
     * @returns {Promise<Element>} Promise that resolves with the found element
     */
    function waitForElement(selectors, timeout = config.elementWaitTimeout) {
        return new Promise((resolve, reject) => {
            const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
            
            // Check if element already exists
            for (const selector of selectorArray) {
                try {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`Effects: Found element with selector: ${selector}`);
                        return resolve(element);
                    }
                } catch (e) {
                    console.warn(`Effects: Invalid selector: ${selector}`);
                }
            }
            
            console.log(`Effects: Waiting for element with selectors: ${selectorArray.join(', ')}`);
            
            const observer = new MutationObserver(() => {
                for (const selector of selectorArray) {
                    try {
                        const element = document.querySelector(selector);
                        if (element) {
                            console.log(`Effects: Element found with selector: ${selector}`);
                            observer.disconnect();
                            return resolve(element);
                        }
                    } catch (e) {
                        // Invalid selector, continue to next
                        continue;
                    }
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element not found within ${timeout}ms. Tried selectors: ${selectorArray.join(', ')}`));
            }, timeout);
        });
    }

    /**
     * Event handler functions with proper context binding
     */
    const eventHandlers = {
        handleMouseMove: (e) => {
            if (state.canIconElement && state.isActive) {
                // Offset the icon slightly so cursor is visible
                state.canIconElement.style.left = `${e.clientX + 10}px`;
                state.canIconElement.style.top = `${e.clientY - 10}px`;
            }
        },

        handleHeadingEnter: () => {
            if (state.headingElement && state.isActive) {
                state.headingElement.classList.add('blooming');
                particleSystem.start();
            }
        },

        handleHeadingLeave: () => {
            if (state.headingElement && state.isActive) {
                state.headingElement.classList.remove('blooming');
                particleSystem.stop();
            }
        },

        handleVisibilityChange: () => {
            if (document.hidden) {
                particleSystem.stop();
            }
        }
    };

    /**
     * Particle system for water droplet effects
     */
    const particleSystem = {
        start() {
            if (state.pouringIntervalId || !state.isActive) return; // Already running or inactive
            
            console.log('Effects: Starting particle system');
            state.pouringIntervalId = setInterval(() => {
                this.createParticle();
            }, config.particles.interval);
        },

        stop() {
            if (state.pouringIntervalId) {
                console.log('Effects: Stopping particle system');
                clearInterval(state.pouringIntervalId);
                state.pouringIntervalId = null;
            }
        },

        createParticle() {
            if (!state.canIconElement || !state.isActive) return;

            try {
                const droplet = document.createElement('div');
                droplet.className = 'water-droplet';
                droplet.setAttribute('aria-hidden', 'true'); // Accessibility

                const canRect = state.canIconElement.getBoundingClientRect();
                const randomX = Math.random() * config.particles.randomness * 2 - config.particles.randomness;
                const randomY = Math.random() * config.particles.randomness * 2 - config.particles.randomness;
                
                // Position drops to fall from the "spout" of the can icon
                const startX = canRect.left + config.particles.spoutOffsetX + randomX;
                const startY = canRect.top + config.particles.spoutOffsetY + randomY;
                
                droplet.style.left = `${startX}px`;
                droplet.style.top = `${startY}px`;
                
                document.body.appendChild(droplet);

                // Clean up after animation completes
                setTimeout(() => {
                    if (droplet.parentNode) {
                        droplet.remove();
                    }
                }, config.particles.lifetime);

            } catch (error) {
                console.error('Effects: Error creating particle:', error);
            }
        }
    };

    /**
     * @function createCanIcon
     * @description Creates and configures the watering can cursor icon
     */
    function createCanIcon() {
        if (state.canIconElement) return; // Already exists

        state.canIconElement = document.createElement('div');
        state.canIconElement.className = 'watering-can-icon';
        state.canIconElement.innerHTML = '🪴'; // Potted Plant emoji as the icon
        state.canIconElement.setAttribute('aria-hidden', 'true'); // Hide from screen readers
        state.canIconElement.style.pointerEvents = 'none'; // Don't interfere with mouse events
        
        document.body.appendChild(state.canIconElement);
        console.log('Effects: Watering can icon created');
    }

    /**
     * @function attachEventListeners
     * @description Attaches all necessary event listeners
     */
    function attachEventListeners() {
        window.addEventListener('mousemove', eventHandlers.handleMouseMove, { passive: true });
        document.addEventListener('visibilitychange', eventHandlers.handleVisibilityChange);
        
        if (state.headingElement) {
            state.headingElement.addEventListener('mouseenter', eventHandlers.handleHeadingEnter);
            state.headingElement.addEventListener('mouseleave', eventHandlers.handleHeadingLeave);
        }
        
        console.log('Effects: Event listeners attached');
    }

    /**
     * @function detachEventListeners
     * @description Removes all event listeners to prevent memory leaks
     */
    function detachEventListeners() {
        window.removeEventListener('mousemove', eventHandlers.handleMouseMove);
        document.removeEventListener('visibilitychange', eventHandlers.handleVisibilityChange);
        
        if (state.headingElement) {
            state.headingElement.removeEventListener('mouseenter', eventHandlers.handleHeadingEnter);
            state.headingElement.removeEventListener('mouseleave', eventHandlers.handleHeadingLeave);
        }
        
        console.log('Effects: Event listeners detached');
    }

    /**
     * @function activate
     * @description Activates the watering can effect
     */
    async function activate() {
        if (state.isActive) {
            console.log('Effects: Already active, skipping activation');
            return;
        }

        try {
            console.log('Effects: Activating watering can effect');

            // Check if effect is already present
            if (document.querySelector('.watering-can-icon')) {
                console.log('Effects: Watering can icon already exists');
                return;
            }

            // Build selectors array (primary + fallbacks)
            const selectorsToTry = [
                config.selectors.heading,
                ...config.fallbackSelectors.heading
            ].filter(Boolean);

            // Wait for heading element
            state.headingElement = await waitForElement(selectorsToTry);
            
            // Create icon and attach listeners
            createCanIcon();
            attachEventListeners();
            
            state.isActive = true;
            console.log('Effects: Watering can effect activated successfully');

        } catch (error) {
            console.warn('Effects: Could not activate watering can effect:', error.message);
            // Graceful degradation - don't break the page
        }
    }

    /**
     * @function deactivate
     * @description Deactivates the watering can effect and cleans up resources
     */
    function deactivate() {
        if (!state.isActive) return;

        console.log('Effects: Deactivating watering can effect');

        // Stop particle system
        particleSystem.stop();

        // Remove icon from DOM
        if (state.canIconElement) {
            state.canIconElement.remove();
            state.canIconElement = null;
        }

        // Clean up heading element state
        if (state.headingElement) {
            state.headingElement.classList.remove('blooming');
        }

        // Remove event listeners
        detachEventListeners();

        // Reset state
        state.isActive = false;
        state.headingElement = null;

        console.log('Effects: Watering can effect deactivated');
    }

    /**
     * @function initialize
     * @description Initializes the effects system
     */
    async function initialize() {
        if (state.isInitialized) return;

        console.log('Effects: Initializing effects system');
        
        // Handle page unload cleanup
        window.addEventListener('beforeunload', deactivate);
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                particleSystem.stop();
            }
        });

        state.isInitialized = true;
        
        // Activate the watering can effect
        await activate();
    }

    /**
     * Main execution - Wait for DOM then initialize
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM is ready, but give Wix a moment to finish rendering
        setTimeout(initialize, 500);
    }

    /**
     * Expose public API for debugging/external control
     */
    window.GreenhouseEffects = {
        activate,
        deactivate,
        getState: () => ({ ...state }),
        getConfig: () => ({ ...config })
    };

})();

(function() {
    'use strict';

    const config = {
        elementWaitTimeout: 10000,
        targetSelector: "#SITE_PAGES_TRANSITION_GROUP div section.wixui-section:nth-child(1) div section div > div > div.wixui-rich-text h2", // New config for selector
        idToApply: "greenhouse-title-for-vine-effect"
    };

    function waitForElementBySelector(selector, timeout = config.elementWaitTimeout) {
        return new Promise((resolve, reject) => {
            const findElement = () => {
                return document.querySelector(selector);
            };

            let element = findElement();
            if (element) {
                console.log(`Vine Effect: Element found with selector: ${selector}`); // Added log
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                element = findElement();
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                console.warn(`Vine Effect: Element with selector "${selector}" not found within ${timeout}ms. Skipping vine effect activation.`);
                resolve(null); // Resolve with null instead of rejecting
            }, timeout);
        });
    }

    async function activateVineEffect() {
        try {
            const heading = await waitForElementBySelector(config.targetSelector);
            if (!heading || heading.dataset.vineInitialized === 'true') return;

            heading.id = config.idToApply;
            heading.dataset.originalText = heading.textContent;
            heading.dataset.vineInitialized = 'true';
            heading.classList.add('vine-effect-active');

            heading.innerHTML = heading.dataset.originalText.split('').map(char => {
                return `<span>${char === ' ' ? '&nbsp;' : char}</span>`;
            }).join('');

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("class", "vine-svg");

            // --- Dynamic Path Generation ---
            const headingWidth = heading.offsetWidth;
            const originalWidth = 800; // The original width the path was designed for
            const scaleFactor = headingWidth / originalWidth;

            // Update viewBox to match the new width
            svg.setAttribute("viewBox", `0 0 ${headingWidth} 120`);

            // Scale the x-coordinates of the path
            const scaledPath = `M${10 * scaleFactor},110 C${150 * scaleFactor},-30 ${250 * scaleFactor},150 ${400 * scaleFactor},60 S${550 * scaleFactor},-30 ${700 * scaleFactor},60 S${790 * scaleFactor},100 ${790 * scaleFactor},100`;

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "vine-path");
            path.setAttribute("d", scaledPath);

            svg.appendChild(path);
            heading.appendChild(svg);

            const pathLength = path.getTotalLength();
            path.style.strokeDasharray = pathLength;

            // Function to run a single animation cycle
            const runAnimationCycle = () => {
                // 1. Reset the animation state
                heading.classList.remove('animation-running');
                path.style.transition = 'none'; // Disable transition for the reset
                path.style.strokeDashoffset = pathLength;

                // 2. Force a DOM reflow. This is a crucial step to ensure the browser applies the reset styles
                // before it tries to apply the new animation state.
                void heading.offsetWidth;

                // 3. Re-enable transitions and add the class to start the animation
                path.style.transition = 'stroke-dashoffset 4s ease-in-out';
                heading.classList.add('animation-running');
            };

            // Run the first animation cycle immediately after a short delay
            setTimeout(() => {
                runAnimationCycle();
                // Set an interval to repeat the animation.
                // The animation takes 4s. We'll add a 2s pause before repeating.
                setInterval(runAnimationCycle, 6000); // 4000ms animation + 2000ms pause
            }, 100);

        } catch (error) {
            console.error('Vine Effect Error:', error);
        }
    }

    function initialize() {
        activateVineEffect();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // Give Wix a moment to finish rendering
        setTimeout(initialize, 500);
    }

})();
