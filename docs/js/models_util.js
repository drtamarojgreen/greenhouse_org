// docs/js/models_util.js

(function() {
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
        update(deltaTime) {}

        /**
         * Called every frame to draw to the canvas.
         * @param {CanvasRenderingContext2D} ctx
         */
        draw(ctx) {}
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

        translations: {
            en: {
                // Consent Screen
                consent_title: "Exploring Neural Plasticity: A CBT & DBT Model",
                consent_desc: "An interactive simulation to help you visualize how therapeutic practices can change the brain.",
                disclaimer: "Please Note: This is an educational simulation, not a medical tool.",
                consent_check: "I acknowledge that this is an educational tool and not a substitute for professional medical advice.",
                launch_btn: "Launch Simulation",

                // Simulation Interface
                edu_banner: "For Educational Purposes: This model simulates conceptual brain activity.",

                // Metrics
                metrics_title_synaptic: "Real-Time Metrics (synaptic)",
                metrics_title_network: "Real-Time Metrics (network)",
                metric_weight: "Synaptic Weight",
                metric_neuro: "Neurotransmitters Released",
                metric_ions: "Ions Crossed",
                metric_learning: "Learning Metric",

                // Controls
                controls_title_synaptic: "Simulation Controls (synaptic)",
                controls_title_network: "Simulation Controls (network)",
                controls_title_environment: "Environment Controls",
                controls_title_general: "General Controls",

                label_intensity: "Practice Intensity",
                label_speed: "Simulation Speed",
                option_slow: "Slow",
                option_normal: "Normal",
                option_fast: "Fast",

                btn_play: "Play",
                btn_pause: "Pause",
                btn_reset_plasticity: "Reset Plasticity",

                label_stress: "Environmental Stress",
                label_support: "Social Support Level",
                label_genetic: "Genetic Factors",
                btn_gene_a: "Gene A",
                btn_gene_b: "Gene B",

                btn_reset_sim: "Reset Simulation",
                btn_share: "Share View",
                btn_download: "Download Image",
                btn_dark_mode: "Toggle Dark Mode",
                btn_fullscreen: "Full Screen",
                btn_language: "Español", // Label to switch TO Spanish

                how_to_title: "How to Use",
                how_to_synaptic: "Use the controls to see how different parameters affect the strength of neural connections in real-time.",
                how_to_env: "Use the sliders to adjust environmental stress and social support. Click the gene buttons to simulate genetic predispositions.",

                loading: "Loading Simulation...",

                // Environment Canvas
                env_title: "Mental Health Environment",
                env_subtitle: "Interactive Model",
                legend_title: "Influences",
                legend_family: "Family",
                legend_society: "Society",
                legend_community: "Community",
                label_therapy: "Therapy",
                label_medication: "Medication",

                // Config Labels (Keys match the English text in config)
                "Environmental Stress": "Environmental Stress",
                "Genetic Factors": "Genetic Factors",
                "Community": "Community",
                "Personal Growth": "Personal Growth",

                // Region Descriptions
                pfc_desc: "The Prefrontal Cortex is crucial for executive functions like planning, decision-making, and regulating social behavior.",
                amygdala_desc: "The Amygdala is central to processing emotions, particularly fear, and is a key part of the brain’s threat-detection system.",
                hippocampus_desc: "The Hippocampus plays a major role in learning and memory, converting short-term memories into more permanent ones.",
                no_info: "No information available for this region.",

                // Hovers
                activation_label: "Activation",

                // Regions Names
                "Prefrontal Cortex": "Prefrontal Cortex",
                "Amygdala": "Amygdala",
                "Hippocampus": "Hippocampus"
            },
            es: {
                // Consent Screen
                consent_title: "Explorando la Plasticidad Neuronal: Un Modelo de TCC y DBT",
                consent_desc: "Una simulación interactiva para ayudarte a visualizar cómo las prácticas terapéuticas pueden cambiar el cerebro.",
                disclaimer: "Nota: Esta es una simulación educativa, no una herramienta médica.",
                consent_check: "Reconozco que esta es una herramienta educativa y no un sustituto del consejo médico profesional.",
                launch_btn: "Iniciar Simulación",

                // Simulation Interface
                edu_banner: "Para Fines Educativos: Este modelo simula la actividad cerebral conceptual.",

                // Metrics
                metrics_title_synaptic: "Métricas en Tiempo Real (sinápticas)",
                metrics_title_network: "Métricas en Tiempo Real (red)",
                metric_weight: "Peso Sináptico",
                metric_neuro: "Neurotransmisores Liberados",
                metric_ions: "Iones Cruzados",
                metric_learning: "Métrica de Aprendizaje",

                // Controls
                controls_title_synaptic: "Controles de Simulación (sinápticos)",
                controls_title_network: "Controles de Simulación (red)",
                controls_title_environment: "Controles del Entorno",
                controls_title_general: "Controles Generales",

                label_intensity: "Intensidad de Práctica",
                label_speed: "Velocidad de Simulación",
                option_slow: "Lento",
                option_normal: "Normal",
                option_fast: "Rápido",

                btn_play: "Reproducir",
                btn_pause: "Pausa",
                btn_reset_plasticity: "Restablecer Plasticidad",

                label_stress: "Estrés Ambiental",
                label_support: "Nivel de Apoyo Social",
                label_genetic: "Factores Genéticos",
                btn_gene_a: "Gen A",
                btn_gene_b: "Gen B",

                btn_reset_sim: "Restablecer Simulación",
                btn_share: "Compartir Vista",
                btn_download: "Descargar Imagen",
                btn_dark_mode: "Modo Oscuro",
                btn_fullscreen: "Pantalla Completa",
                btn_language: "English", // Label to switch TO English

                how_to_title: "Cómo Usar",
                how_to_synaptic: "Usa los controles para ver cómo diferentes parámetros afectan la fuerza de las conexiones neuronales en tiempo real.",
                how_to_env: "Usa los deslizadores para ajustar el estrés ambiental y el apoyo social. Haz clic en los botones de genes para simular predisposiciones genéticas.",

                loading: "Cargando Simulación...",

                // Environment Canvas
                env_title: "Entorno de Salud Mental",
                env_subtitle: "Modelo Interactivo",
                legend_title: "Influencias",
                legend_family: "Familia",
                legend_society: "Sociedad",
                legend_community: "Comunidad",
                label_therapy: "Terapia",
                label_medication: "Medicación",

                // Config Labels
                "Environmental Stress": "Estrés Ambiental",
                "Genetic Factors": "Factores Genéticos",
                "Community": "Comunidad",
                "Personal Growth": "Crecimiento Personal",

                // Region Descriptions
                pfc_desc: "La Corteza Prefrontal es crucial para funciones ejecutivas como la planificación, toma de decisiones y regulación del comportamiento social.",
                amygdala_desc: "La Amígdala es central para procesar emociones, particularmente el miedo, y es una parte clave del sistema de detección de amenazas del cerebro.",
                hippocampus_desc: "El Hipocampo juega un papel mayor en el aprendizaje y la memoria, convirtiendo memorias de corto plazo en permanentes.",
                no_info: "No hay información disponible para esta región.",

                // Hovers
                activation_label: "Activación",

                // Regions Names
                "Prefrontal Cortex": "Corteza Prefrontal",
                "Amygdala": "Amígdala",
                "Hippocampus": "Hipocampus"
            }
        },
        GreenhouseComponent,
        GreenhouseSystem,
        GreenhouseAssetManager,

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
                // If the key IS the english text, we are good.
                // But if we passed a code like 'consent_title' and it's missing in ES but present in EN, we return EN.
                return this.translations['en'][key];
            }

            // 3. If key is an English phrase (e.g. from config), try to find it in ES
            if (lang !== 'en') {
                // Check if the key exists as a value in the 'en' dictionary, or if we should just assume the key IS the english text.
                // In our translations object, we added "Environmental Stress": "..." so direct lookup (step 1) should have handled it
                // IF the key passed in was "Environmental Stress".
                // So if we are here, the key is likely unknown or missing.
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
            return this.currentLanguage;
        },

        getRegionDescription(regionKey) {
            // Map region keys to translation keys if necessary, or just use the keys directly if they match
            const map = {
                pfc: 'pfc_desc',
                amygdala: 'amygdala_desc',
                hippocampus: 'hippocampus_desc'
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
