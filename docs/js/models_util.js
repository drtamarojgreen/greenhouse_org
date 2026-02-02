// docs/js/models_util.js

(function () {
    'use strict';

    /**
     * @class GreenhouseComponent
     * Base class for all visual components in the system.
     * Implements #36 Component-Based Architecture.
     */
    class GreenhouseComponent {
        constructor(name, layer = 10) {
            this.name = name;
            this.layer = layer; // Lower numbers draw first (background), higher numbers draw last (UI)
            this.active = true;
            this.initialized = false;
        }

        /**
         * Called once when the component is added to the system.
         * @param {GreenhouseSystem} system
         */
        init(system) {
            this.system = system;
            this.initialized = true;
        }

        /**
         * Called every frame to update state.
         * @param {number} deltaTime - Time since last frame in ms.
         */
        update(deltaTime) { }

        /**
         * Called every frame to draw to the canvas.
         * @param {CanvasRenderingContext2D} ctx
         */
        draw(ctx) { }
    }

    /**
     * @class GreenhouseSystem
     * Central rendering engine.
     * Implements #41 Error Boundary, #42 Configurable Render Quality, #8 Layered Canvases.
     */
    class GreenhouseSystem {
        constructor(canvas, config = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: false }); // Optimization
            this.components = [];
            this.quality = config.quality || 1.0;
            this.lastFrameTime = 0;

            // #41 Error Boundary
            this.errorHandler = config.errorHandler || ((e) => console.error("Rendering Error:", e));
        }

        /**
         * Adds a component to the system.
         * @param {GreenhouseComponent} component
         */
        addComponent(component) {
            this.components.push(component);
            this.components.sort((a, b) => a.layer - b.layer);
            if (!component.initialized) {
                component.init(this);
            }
        }

        /**
         * Renders a single frame.
         * @param {number} timestamp
         */
        renderFrame(timestamp = performance.now()) {
            try {
                const deltaTime = timestamp - this.lastFrameTime;
                this.lastFrameTime = timestamp;

                // #7 Integer Coordinates & #42 Render Quality
                const width = this.canvas.width;
                const height = this.canvas.height;

                // Clear Canvas
                this.ctx.clearRect(0, 0, width, height);

                // Render Loop
                for (const component of this.components) {
                    if (component.active) {
                        component.update(deltaTime);
                        component.draw(this.ctx, width, height);
                    }
                }

                // Signal for testing
                window.renderingComplete = true;

            } catch (error) {
                this.errorHandler(error);
            }
        }
    }

    /**
     * @class GreenhouseAssetManager
     * Manages assets and sprite atlases.
     * Implements #10 Asset Preloading, #5 Sprite Atlases.
     */
    class GreenhouseAssetManager {
        constructor() {
            this.assets = new Map();
            this.loading = false;
        }

        async loadImage(key, url) {
            if (this.assets.has(key)) return this.assets.get(key);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.assets.set(key, img);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = url;
            });
        }

        get(key) {
            return this.assets.get(key);
        }
    }

    const GreenhouseModelsUtil = {
        currentLanguage: 'en',

        translations: window.GreenhouseTranslations || {},

        createElement(tag, attributes, ...children) {
            const element = document.createElement(tag);
            for (const key in attributes) {
                if (key === 'className') {
                    element.className = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        },

        parseDynamicPath(pathString, context) {
            return pathString.replace(/\b(w|h|tw|psy)\b/g, match => context[match]);
        },

        t(key) {
            const lang = this.currentLanguage;
            // 1. Try direct key lookup in current language
            if (this.translations[lang] && this.translations[lang][key]) {
                return this.translations[lang][key];
            }
            // 2. Try direct key lookup in English (fallback)
            if (this.translations['en'] && this.translations['en'][key]) {
                return this.translations['en'][key];
            }

            // 3. If key is an English phrase (e.g. from config), try to find it in ES
            if (lang !== 'en') {
                return key;
            }

            return key;
        },

        setLanguage(lang) {
            if (this.translations[lang]) {
                this.currentLanguage = lang;
            }
        },

        toggleLanguage() {
            this.currentLanguage = this.currentLanguage === 'en' ? 'es' : 'en';
            window.dispatchEvent(new CustomEvent('greenhouseLanguageChanged', {
                detail: { language: this.currentLanguage }
            }));
            return this.currentLanguage;
        },

        getRegionDescription(regionKey) {
            const map = {
                pfc: 'pfc_desc',
                amygdala: 'amygdala_desc',
                hippocampus: 'hippocampus_desc',
                parietalLobe: 'parietalLobe_desc',
                occipitalLobe: 'occipitalLobe_desc',
                temporalLobe: 'temporalLobe_desc',
                cerebellum: 'cerebellum_desc',
                brainstem: 'brainstem_desc'
            };

            const key = map[regionKey] || 'no_info';
            return this.t(key);
        },

        wrapText(context, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        }
    };

    window.GreenhouseModelsUtil = GreenhouseModelsUtil;
})();
