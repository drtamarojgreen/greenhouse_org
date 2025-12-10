// docs/js/genetic_config.js
// Modular Configuration System for Genetic Simulation

(function () {
    'use strict';

    const GreenhouseGeneticConfig = {
        // Camera Configuration
        camera: {
            initial: {
                x: 0,
                y: 0,
                z: -300,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                fov: 500
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
                maxZoom: -3000
            }
        },

        // Projection Configuration
        projection: {
            width: 800,
            height: 600,
            near: 10,
            far: 2000
        },

        // Lighting Configuration
        lighting: {
            ambient: {
                enabled: true,
                intensity: 0.4,
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
                intensity: 0.6,
                shininess: 40,
                color: { r: 255, g: 255, b: 255 }
            },
            shadows: {
                enabled: true,
                softness: 0.3,
                opacity: 0.5
            }
        },

        // Material Configuration
        materials: {
            dna: {
                strand1Color: '#00D9FF', // Bright cyan
                strand2Color: '#FF6B9D', // Bright pink
                baseColors: {
                    A: '#FF6B9D', // Adenine - Pink
                    T: '#00D9FF', // Thymine - Cyan
                    G: '#FFD93D', // Guanine - Yellow
                    C: '#6BCF7F'  // Cytosine - Green
                },
                alpha: 0.9,
                metallic: 0.3,
                roughness: 0.4,
                emissive: true,
                emissiveIntensity: 0.3,
                glow: true,
                glowIntensity: 0.4
            },
            gene: {
                activeColor: '#00FF88', // Bright green for active genes
                inactiveColor: '#4A5568', // Gray for inactive
                highlightColor: '#FFD700', // Gold for selected
                alpha: 0.95,
                metallic: 0.5,
                roughness: 0.3,
                emissive: true,
                emissiveIntensity: 0.4
            },
            protein: {
                backboneColor: '#9B59B6', // Purple
                sideChainColors: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#1ABC9C'],
                alpha: 0.85,
                metallic: 0.4,
                roughness: 0.5,
                subsurfaceScattering: true,
                sssIntensity: 0.2
            },
            brain: {
                baseColor: { r: 120, g: 120, b: 140 },
                alpha: 0.15,
                metallic: 0.2,
                roughness: 0.6,
                subsurfaceScattering: true,
                sssIntensity: 0.3
            },
            neuron: {
                baseColors: ['#00FFFF', '#1E90FF', '#00CED1', '#4169E1', '#7B68EE', '#9370DB'],
                alpha: 0.9,
                metallic: 0.5,
                roughness: 0.3,
                emissive: true,
                emissiveIntensity: 0.3
            },
            connection: {
                baseColor: { r: 100, g: 200, b: 255 },
                alpha: 0.6,
                metallic: 0.2,
                roughness: 0.5,
                pulseSpeed: 2.0,
                pulseIntensity: 0.5
            }
        },

        // Animation Configuration
        animation: {
            frameRate: 60,
            evolutionSpeed: 100, // ms per generation
            transitionDuration: 500, // ms
            easing: 'easeOutCubic',
            particleCount: 150,
            particleLifetime: 3000, // ms
            helixRotationSpeed: 0.001,
            proteinFoldingSpeed: 0.5
        },

        // Visual Effects Configuration
        effects: {
            depthFog: {
                enabled: true,
                start: 0.6,
                end: 1.0,
                color: { r: 15, g: 23, b: 42 } // Match canvas background
            },
            bloom: {
                enabled: true,
                threshold: 0.7,
                intensity: 0.6,
                radius: 3
            },
            motionBlur: {
                enabled: false,
                samples: 5,
                intensity: 0.3
            },
            antialiasing: {
                enabled: true,
                samples: 4
            },
            glow: {
                enabled: true,
                intensity: 0.5,
                color: { r: 100, g: 200, b: 255 }
            }
        },

        // Picture-in-Picture Configuration
        pip: {
            enabled: true,
            width: 200,
            height: 150,
            gap: 10,
            position: 'right', // 'left', 'right'
            borderColor: '#444',
            borderWidth: 1,
            backgroundColor: 'rgba(10, 10, 20, 0.9)',
            titleColor: '#aaa',
            titleFont: '12px Arial',
            animationDuration: 300 // ms
        },

        // Helix Configuration
        helix: {
            radius: 50,
            pitch: 100, // Vertical distance per turn
            turns: 5,
            strandsDistance: 30,
            baseSpacing: 10,
            offset: -200, // X offset for helix position
            colors: {
                strand1: '#00D9FF',
                strand2: '#FF6B9D',
                backbone: '#FFFFFF',
                basePairs: '#FFD93D'
            }
        },

        // Brain Regions Configuration
        regions: {
            pfc: {
                name: 'Prefrontal Cortex',
                color: 'rgba(100, 150, 255, 0.6)',
                position: { x: 0, y: -100, z: 150 }
            },
            amygdala: {
                name: 'Amygdala',
                color: 'rgba(255, 100, 100, 0.6)',
                position: { x: 50, y: 0, z: 0 }
            },
            hippocampus: {
                name: 'Hippocampus',
                color: 'rgba(100, 255, 150, 0.6)',
                position: { x: -50, y: 0, z: 0 }
            },
            temporalLobe: {
                name: 'Temporal Lobe',
                color: 'rgba(100, 255, 150, 0.6)',
                position: { x: 100, y: 50, z: 0 }
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
            showGrid: false,
            gridOpacity: 0.1,
            labelFont: '12px Arial',
            labelColor: 'rgba(255, 255, 255, 0.7)',
            controlsPosition: 'bottom',
            theme: 'dark', // 'dark' or 'light'
            backgroundColor: '#0f172a',
            textColor: '#ffffff'
        },

        // Performance Configuration
        performance: {
            maxGenes: 100,
            maxConnections: 500,
            maxProteinAtoms: 200,
            lodEnabled: true,
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
            maxGenerations: 1000
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

    window.GreenhouseGeneticConfig = GreenhouseGeneticConfig;
})();
