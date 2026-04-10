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
                autoRotateSpeed: 0.001, // Reduced for accessibility
                panSpeed: 0.002,
                zoomSpeed: 0.1,
                rotateSpeed: 0.005,
                inertia: true,
                inertiaDamping: 0.95,
                minZoom: -150,
                maxZoom: -1200 // Tightened to prevent model from moving off-screen
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
            preset: 'clinical', // 'clinical', 'lab', 'presentation'
            presets: {
                clinical: {
                    ambient: { intensity: 0.2, color: { r: 255, g: 255, b: 255 } },
                    directional: { intensity: 1.0, direction: { x: 0.5, y: -0.5, z: 1 }, color: { r: 255, g: 255, b: 255 } },
                    exposure: 1.0
                },
                lab: {
                    ambient: { intensity: 0.1, color: { r: 200, g: 220, b: 255 } },
                    directional: { intensity: 1.5, direction: { x: -0.5, y: -1, z: 0.5 }, color: { r: 255, g: 245, b: 230 } },
                    exposure: 1.2
                },
                presentation: {
                    ambient: { intensity: 0.4, color: { r: 255, g: 255, b: 255 } },
                    directional: { intensity: 0.8, direction: { x: 0, y: 0, z: 1 }, color: { r: 255, g: 255, b: 255 } },
                    exposure: 1.1
                }
            },
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
                strand1Color: '#E0E0E0', // Premium Off-White
                strand2Color: '#D0D0D0', // Silver
                baseColors: {
                    A: '#E0E0E0', // Adenine
                    T: '#E0E0E0', // Thymine
                    G: '#D0D0D0', // Guanine
                    C: '#D0D0D0'  // Cytosine
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
                activeColor: '#E0E0E0', // Premium Off-White
                inactiveColor: '#A0AEC0', // Gray
                highlightColor: '#D0D0D0', // Silver
                alpha: 0.95,
                metallic: 0.5,
                roughness: 0.3,
                emissive: true,
                emissiveIntensity: 0.4
            },
            protein: {
                backboneColor: '#A0AEC0', // Neural Gray
                sideChainColors: ['#E0E0E0', '#D0D0D0', '#A0AEC0', '#B0B0B0'],
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
                baseColors: ['#E0E0E0', '#D0D0D0', '#A0AEC0'],
                alpha: 0.9,
                metallic: 0.5,
                roughness: 0.3,
                emissive: true,
                emissiveIntensity: 0.3
            },
            connection: {
                baseColor: { r: 160, g: 174, b: 192 },
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
            ssao: {
                enabled: true,
                intensity: 0.4,
                radius: 10
            },
            shadows: {
                enabled: true,
                quality: 'medium', // 'low', 'medium', 'high'
                opacity: 0.3
            },
            taa: {
                enabled: true,
                jitterScale: 0.5
            },
            dof: {
                enabled: false,
                focusDepth: 0.5,
                aperture: 0.1,
                maxBlur: 3
            },
            depthFog: {
                enabled: true,
                start: 0.6,
                end: 1.0,
                color: { r: 5, g: 5, b: 16 } // Match #050510 background
            },
            bloom: {
                enabled: true,
                threshold: 0.7,
                intensity: 0.6,
                radius: 3
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
                strand1: '#E0E0E0',
                strand2: '#D0D0D0',
                backbone: '#A0AEC0',
                basePairs: '#E0E0E0'
            }
        },

        // Brain Regions Configuration - Anatomically correct monochromatic hierarchy
        regions: {
            pfc: {
                name: 'Prefrontal Cortex',
                color: 'rgba(224, 224, 224, 0.6)', // Lightest (Frontal)
                position: { x: 0, y: -100, z: 150 }
            },
            amygdala: {
                name: 'Amygdala',
                color: 'rgba(180, 180, 180, 0.7)', // Mid-Tone Deep
                position: { x: 50, y: 0, z: 0 }
            },
            hippocampus: {
                name: 'Hippocampus',
                color: 'rgba(180, 180, 180, 0.7)', // Mid-Tone Deep
                position: { x: -50, y: 0, z: 0 }
            },
            temporalLobe: {
                name: 'Temporal Lobe',
                color: 'rgba(180, 180, 180, 0.5)', // Mid-Gray
                position: { x: 100, y: 50, z: 0 }
            },
            parietalLobe: {
                name: 'Parietal Lobe',
                color: 'rgba(200, 200, 200, 0.5)', // Neutral Mid
                position: { x: 0, y: -50, z: 0 }
            },
            occipitalLobe: {
                name: 'Occipital Lobe',
                color: 'rgba(140, 140, 140, 0.6)', // Darker (Sensory)
                position: { x: 0, y: 0, z: -150 }
            },
            cerebellum: {
                name: 'Cerebellum',
                color: 'rgba(120, 120, 120, 0.7)', // Distinct Dark
                position: { x: 0, y: 150, z: -100 }
            },
            brainstem: {
                name: 'Brainstem',
                color: 'rgba(100, 100, 100, 0.8)', // Darkest
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
            backgroundColor: '#050510',
            textColor: '#ffffff',
            background: 'neutral', // 'neutral', 'dark', 'white', 'grid'
            backgrounds: {
                neutral: { top: '#1a1a1a', bottom: '#0d0d0d' },
                dark: { top: '#050505', bottom: '#000000' },
                white: { top: '#ffffff', bottom: '#f0f0f0' },
                grid: { top: '#111', bottom: '#111', showGrid: true }
            }
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
