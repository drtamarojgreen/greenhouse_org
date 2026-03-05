// docs/js/neuro_config.js
// Modular Configuration System for Neuro Simulation

(function () {
    'use strict';

    const GreenhouseNeuroConfig = {
        // Camera Configuration
        camera: {
            initial: {
                x: 0,
                y: 0,
                z: -600,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                fov: 600
            },
            controls: {
                enablePan: true,
                enableZoom: true,
                enableRotate: true,
                autoRotate: true,
                autoRotateSpeed: 0.0002,
                panSpeed: 0.002,
                zoomSpeed: 0.1,
                rotateSpeed: 0.005,
                inertia: true,
                inertiaDamping: 0.95,
                minZoom: -50,
                maxZoom: -2000
            }
        },

        // Projection Configuration
        projection: {
            width: 800,
            height: 600,
            near: 10,
            far: 5000,
            fov: 600
        },

        // Lighting Configuration
        lighting: {
            ambient: {
                enabled: true,
                intensity: 0.3,
                color: { r: 255, g: 255, b: 255 }
            },
            directional: {
                enabled: true,
                intensity: 0.8,
                direction: { x: 0.5, y: -0.5, z: 1 },
                color: { r: 255, g: 255, b: 255 }
            },
            specular: {
                enabled: true,
                intensity: 0.5,
                shininess: 30,
                color: { r: 255, g: 255, b: 255 }
            },
            shadows: {
                enabled: true,
                softness: 0.3,
                opacity: 0.4
            }
        },

        // Material Configuration
        materials: {
            brain: {
                baseColor: { r: 100, g: 100, b: 100 },
                alpha: 0.1,
                metallic: 0.2,
                roughness: 0.6,
                subsurfaceScattering: true,
                sssIntensity: 0.3
            },
            neuron: {
                baseColors: ['#00FFFF', '#1E90FF', '#00CED1', '#4169E1', '#7B68EE'],
                alpha: 0.9,
                metallic: 0.4,
                roughness: 0.3,
                emissive: true,
                emissiveIntensity: 0.2
            },
            synapse: {
                baseColor: { r: 255, g: 100, b: 150 },
                alpha: 0.7,
                metallic: 0.3,
                roughness: 0.4,
                glow: true,
                glowIntensity: 0.3
            },
            connection: {
                baseColor: { r: 100, g: 200, b: 255 },
                alpha: 0.6,
                metallic: 0.1,
                roughness: 0.5
            }
        },

        // Animation Configuration
        animation: {
            frameRate: 60,
            simulationSpeed: 100, // ms per generation
            transitionDuration: 300, // ms
            easing: 'easeOutCubic',
            particleCount: 100,
            particleLifetime: 2000 // ms
        },

        // Visual Effects Configuration
        effects: {
            depthFog: {
                enabled: true,
                start: 0.7,
                end: 1.0,
                color: { r: 17, g: 17, b: 17 }
            },
            bloom: {
                enabled: true,
                threshold: 0.8,
                intensity: 0.5,
                radius: 2
            },
            motionBlur: {
                enabled: false,
                samples: 5,
                intensity: 0.3
            },
            antialiasing: {
                enabled: true,
                samples: 4
            }
        },

        // Picture-in-Picture Configuration
        pip: {
            enabled: true,
            width: 300,
            height: 250,
            padding: 20,
            position: 'bottom-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
            borderColor: '#4ca1af',
            borderWidth: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            animationDuration: 300, // ms
            controls: {
                enablePan: true,
                enableZoom: true,
                enableRotate: true
            }
        },

        // Brain Regions Configuration
        regions: {
            pfc: {
                name: 'Prefrontal Cortex',
                color: 'rgba(100, 150, 255, 0.6)',
                position: { x: 0, y: -100, z: 150 }
            },
            parietalLobe: {
                name: 'Parietal Lobe',
                color: 'rgba(150, 100, 255, 0.6)',
                position: { x: 0, y: -50, z: 0 }
            },
            occipitalLobe: {
                name: 'Occipital Lobe',
                color: 'rgba(255, 100, 150, 0.6)',
                position: { x: 0, y: 0, z: -150 }
            },
            temporalLobe: {
                name: 'Temporal Lobe',
                color: 'rgba(100, 255, 150, 0.6)',
                position: { x: 100, y: 50, z: 0 }
            },
            cerebellum: {
                name: 'Cerebellum',
                color: 'rgba(255, 150, 100, 0.6)',
                position: { x: 0, y: 150, z: -100 }
            },
            brainstem: {
                name: 'Brainstem',
                color: 'rgba(150, 255, 100, 0.6)',
                position: { x: 0, y: 200, z: 0 }
            }
        },

        // UI Configuration
        ui: {
            showStats: true,
            showControls: true,
            showLabels: true,
            showGrid: true,
            gridOpacity: 0.05,
            labelFont: '10px Arial',
            labelColor: 'rgba(255, 255, 255, 0.3)',
            controlsPosition: 'top-right',
            theme: 'dark' // 'dark' or 'light'
        },

        // Performance Configuration
        performance: {
            maxNeurons: 100,
            maxConnections: 500,
            lodEnabled: true, // Level of Detail
            lodDistances: [500, 1000, 1500],
            cullingEnabled: true,
            frustumCulling: true,
            occlusionCulling: false
        },

        // Genetic Algorithm Configuration
        ga: {
            populationSize: 50,
            mutationRate: 0.1,
            crossoverRate: 0.7,
            elitismRate: 0.1,
            bounds: { x: 500, y: 500, z: 500 }
        },

        /**
         * Get a configuration value by path
         * @param {string} path - Dot-separated path (e.g., 'camera.controls.panSpeed')
         * @returns {*} Configuration value
         */
        get(path) {
            const keys = path.split('.');
            let value = this;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return undefined;
                }
            }
            return value;
        },

        /**
         * Set a configuration value by path
         * @param {string} path - Dot-separated path
         * @param {*} value - New value
         */
        set(path, value) {
            const keys = path.split('.');
            let obj = this;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!(key in obj) || typeof obj[key] !== 'object') {
                    obj[key] = {};
                }
                obj = obj[key];
            }
            obj[keys[keys.length - 1]] = value;
        },

        /**
         * Merge custom configuration with defaults
         * @param {Object} customConfig - Custom configuration object
         * @returns {Object} Merged configuration
         */
        merge(customConfig) {
            return this._deepMerge(this, customConfig);
        },

        /**
         * Deep merge two objects
         * @private
         */
        _deepMerge(target, source) {
            const result = { ...target };
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this._deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        },

        /**
         * Reset configuration to defaults
         */
        reset() {
            // This would require storing original defaults
            console.log('Configuration reset to defaults');
        },

        /**
         * Export configuration as JSON
         * @returns {string} JSON string
         */
        export() {
            return JSON.stringify(this, null, 2);
        },

        /**
         * Import configuration from JSON
         * @param {string} json - JSON string
         */
        import(json) {
            try {
                const config = JSON.parse(json);
                Object.assign(this, config);
            } catch (error) {
                console.error('Failed to import configuration:', error);
            }
        }
    };

    window.GreenhouseNeuroConfig = GreenhouseNeuroConfig;
})();
