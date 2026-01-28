/**
 * @file GreenhouseBaseApp.js
 * @description Unified base architecture for Greenhouse 3D simulation applications.
 * Provides standardized container management, 3D engine initialization, and resilience patterns.
 */

(function () {
    'use strict';

    const GreenhouseBaseApp = {
        /**
         * Standardized initialization for simulation containers.
         * @param {string|HTMLElement} selector
         * @param {Object} options
         */
        initContainer(selector, options = {}) {
            const container = (typeof selector === 'string') ? document.querySelector(selector) : selector;
            if (!container) {
                console.error('GreenhouseBaseApp: Target container not found:', selector);
                return null;
            }

            container.innerHTML = '';
            container.style.position = 'relative';
            container.style.backgroundColor = options.backgroundColor || '#050510';
            container.style.minHeight = options.minHeight || '600px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.overflow = 'hidden';

            return container;
        },

        /**
         * Standardized canvas setup.
         * @param {HTMLElement} container
         * @returns {HTMLCanvasElement}
         */
        setupCanvas(container) {
            const canvas = document.createElement('canvas');
            canvas.style.display = 'block';
            canvas.style.flex = '1';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            container.appendChild(canvas);
            return canvas;
        },

        /**
         * Handle canvas and projection resizing.
         * @param {HTMLCanvasElement} canvas
         * @param {Object} projection
         */
        handleResize(canvas, projection) {
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                if (projection) {
                    projection.width = canvas.width;
                    projection.height = canvas.height;
                }
                return true;
            }
            return false;
        },

        /**
         * Standard resilience binding.
         * @param {HTMLElement} container
         * @param {string} selector
         * @param {Object} appInstance
         */
        applyResilience(container, selector, appInstance) {
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, appInstance, 'init');
                if (appInstance.startSentinel) {
                    window.GreenhouseUtils.startSentinel(container, selector, appInstance, 'init');
                }
            }
        },

        /**
         * Standard 3D Camera initialization.
         */
        getDefaultCamera() {
            return { x: 0, y: 0, z: -600, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 600 };
        }
    };

    window.GreenhouseBaseApp = GreenhouseBaseApp;
})();
