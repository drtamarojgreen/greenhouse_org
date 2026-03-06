// docs/js/neuro_lighting.js
// Enhanced Lighting System for Realistic 3D Rendering

(function () {
    'use strict';

    const GreenhouseNeuroLighting = {
        config: null,
        lights: [],

        /**
         * Initialize lighting system
         * @param {Object} config - Configuration object
         */
        init(config) {
            this.config = config || window.GreenhouseNeuroConfig;
            this.setupLights();
            console.log('NeuroLighting: System initialized');
        },

        /**
         * Setup lights from configuration
         */
        setupLights() {
            this.lights = [];

            // Ambient light
            if (this.config.get('lighting.ambient.enabled')) {
                this.lights.push({
                    type: 'ambient',
                    intensity: this.config.get('lighting.ambient.intensity'),
                    color: this.config.get('lighting.ambient.color')
                });
            }

            // Directional light
            if (this.config.get('lighting.directional.enabled')) {
                const dir = this.config.get('lighting.directional.direction');
                const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
                
                this.lights.push({
                    type: 'directional',
                    intensity: this.config.get('lighting.directional.intensity'),
                    color: this.config.get('lighting.directional.color'),
                    direction: {
                        x: dir.x / len,
                        y: dir.y / len,
                        z: dir.z / len
                    }
                });
            }
        },

        /**
         * Calculate lighting for a surface
         * @param {Object} normal - Surface normal {x, y, z}
         * @param {Object} position - Surface position {x, y, z}
         * @param {Object} camera - Camera object
         * @param {Object} material - Material properties
         * @returns {Object} {r, g, b, a} - Final color with lighting
         */
        calculateLighting(normal, position, camera, material) {
            let totalR = 0, totalG = 0, totalB = 0;

            // Process each light
            this.lights.forEach(light => {
                if (light.type === 'ambient') {
                    // Ambient light - constant contribution
                    totalR += light.color.r * light.intensity;
                    totalG += light.color.g * light.intensity;
                    totalB += light.color.b * light.intensity;
                } else if (light.type === 'directional') {
                    // Diffuse lighting (Lambertian)
                    const diffuse = Math.max(0, 
                        normal.x * light.direction.x + 
                        normal.y * light.direction.y + 
                        normal.z * light.direction.z
                    );

                    totalR += light.color.r * light.intensity * diffuse;
                    totalG += light.color.g * light.intensity * diffuse;
                    totalB += light.color.b * light.intensity * diffuse;

                    // Specular lighting (Blinn-Phong)
                    if (this.config.get('lighting.specular.enabled')) {
                        const specular = this.calculateSpecular(
                            normal, 
                            light.direction, 
                            position, 
                            camera
                        );

                        const specColor = this.config.get('lighting.specular.color');
                        const specIntensity = this.config.get('lighting.specular.intensity');
                        
                        totalR += specColor.r * specIntensity * specular;
                        totalG += specColor.g * specIntensity * specular;
                        totalB += specColor.b * specIntensity * specular;
                    }
                }
            });

            // Apply material properties
            const baseColor = material.baseColor || { r: 255, g: 255, b: 255 };
            const metallic = material.metallic || 0;
            const roughness = material.roughness || 0.5;

            // Metallic surfaces reflect more light
            const metallicFactor = 1 + metallic * 0.5;
            
            // Roughness reduces specular highlights
            const roughnessFactor = 1 - roughness * 0.3;

            let finalR = baseColor.r * (totalR / 255) * metallicFactor * roughnessFactor;
            let finalG = baseColor.g * (totalG / 255) * metallicFactor * roughnessFactor;
            let finalB = baseColor.b * (totalB / 255) * metallicFactor * roughnessFactor;

            // Add emissive lighting
            if (material.emissive && material.emissiveIntensity) {
                finalR += baseColor.r * material.emissiveIntensity;
                finalG += baseColor.g * material.emissiveIntensity;
                finalB += baseColor.b * material.emissiveIntensity;
            }

            // Clamp values
            finalR = Math.min(255, Math.max(0, finalR));
            finalG = Math.min(255, Math.max(0, finalG));
            finalB = Math.min(255, Math.max(0, finalB));

            return {
                r: finalR,
                g: finalG,
                b: finalB,
                a: material.alpha || 1
            };
        },

        /**
         * Calculate specular highlight (Blinn-Phong)
         * @param {Object} normal - Surface normal
         * @param {Object} lightDir - Light direction
         * @param {Object} position - Surface position
         * @param {Object} camera - Camera object
         * @returns {number} Specular intensity
         */
        calculateSpecular(normal, lightDir, position, camera) {
            // View direction (from surface to camera)
            const viewX = camera.x - position.x;
            const viewY = camera.y - position.y;
            const viewZ = camera.z - position.z;
            const viewLen = Math.sqrt(viewX * viewX + viewY * viewY + viewZ * viewZ);
            
            const viewDirX = viewX / viewLen;
            const viewDirY = viewY / viewLen;
            const viewDirZ = viewZ / viewLen;

            // Half vector (between light and view)
            const halfX = (lightDir.x + viewDirX) / 2;
            const halfY = (lightDir.y + viewDirY) / 2;
            const halfZ = (lightDir.z + viewDirZ) / 2;
            const halfLen = Math.sqrt(halfX * halfX + halfY * halfY + halfZ * halfZ);
            
            const halfDirX = halfX / halfLen;
            const halfDirY = halfY / halfLen;
            const halfDirZ = halfZ / halfLen;

            // Specular = (N · H)^shininess
            const NdotH = Math.max(0, 
                normal.x * halfDirX + 
                normal.y * halfDirY + 
                normal.z * halfDirZ
            );

            const shininess = this.config.get('lighting.specular.shininess') || 30;
            return Math.pow(NdotH, shininess);
        },

        /**
         * Calculate shadow intensity
         * @param {Object} position - Surface position
         * @param {Object} normal - Surface normal
         * @param {Array} occluders - Array of objects that can cast shadows
         * @returns {number} Shadow factor (0 = full shadow, 1 = no shadow)
         */
        calculateShadow(position, normal, occluders) {
            if (!this.config.get('lighting.shadows.enabled')) {
                return 1.0;
            }

            const shadowOpacity = this.config.get('lighting.shadows.opacity') || 0.4;
            const softness = this.config.get('lighting.shadows.softness') || 0.3;

            // Simple shadow calculation
            // In a full implementation, this would do ray tracing
            let shadowFactor = 1.0;

            // For now, just apply a simple ambient occlusion-like effect
            // based on the normal direction
            const upDot = Math.max(0, normal.y);
            shadowFactor = 1.0 - (1.0 - upDot) * shadowOpacity;

            return shadowFactor;
        },

        /**
         * Apply subsurface scattering effect
         * @param {Object} color - Base color
         * @param {Object} normal - Surface normal
         * @param {Object} lightDir - Light direction
         * @param {number} thickness - Material thickness
         * @returns {Object} Modified color
         */
        applySubsurfaceScattering(color, normal, lightDir, thickness) {
            // Calculate light penetration
            const backDot = Math.max(0, -(
                normal.x * lightDir.x + 
                normal.y * lightDir.y + 
                normal.z * lightDir.z
            ));

            const sssIntensity = this.config.get('materials.brain.sssIntensity') || 0.3;
            const penetration = backDot * sssIntensity * (1 - thickness);

            // Add warm glow to simulate light passing through tissue
            return {
                r: Math.min(255, color.r + penetration * 50),
                g: Math.min(255, color.g + penetration * 30),
                b: Math.min(255, color.b + penetration * 20),
                a: color.a
            };
        },

        /**
         * Apply glow effect
         * @param {Object} color - Base color
         * @param {number} intensity - Glow intensity
         * @returns {Object} Modified color with glow
         */
        applyGlow(color, intensity) {
            const glowFactor = 1 + intensity;
            return {
                r: Math.min(255, color.r * glowFactor),
                g: Math.min(255, color.g * glowFactor),
                b: Math.min(255, color.b * glowFactor),
                a: color.a
            };
        },

        /**
         * Convert color object to CSS rgba string
         * @param {Object} color - Color object {r, g, b, a}
         * @returns {string} CSS rgba string
         */
        toRGBA(color) {
            return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
        },

        /**
         * Parse CSS color to color object
         * @param {string} cssColor - CSS color string
         * @returns {Object} Color object {r, g, b, a}
         */
        parseColor(cssColor) {
            const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3]),
                    a: parseFloat(match[4] || 1)
                };
            }
            
            // Fallback for hex colors
            if (cssColor.startsWith('#')) {
                const hex = cssColor.slice(1);
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: 1
                };
            }

            return { r: 255, g: 255, b: 255, a: 1 };
        },

        /**
         * Update light direction (useful for dynamic lighting)
         * @param {string} lightType - Type of light ('directional', etc.)
         * @param {Object} direction - New direction {x, y, z}
         */
        updateLightDirection(lightType, direction) {
            const light = this.lights.find(l => l.type === lightType);
            if (light) {
                const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
                light.direction = {
                    x: direction.x / len,
                    y: direction.y / len,
                    z: direction.z / len
                };
            }
        },

        /**
         * Update light intensity
         * @param {string} lightType - Type of light
         * @param {number} intensity - New intensity
         */
        updateLightIntensity(lightType, intensity) {
            const light = this.lights.find(l => l.type === lightType);
            if (light) {
                light.intensity = intensity;
            }
        }
    };

    window.GreenhouseNeuroLighting = GreenhouseNeuroLighting;
})();
