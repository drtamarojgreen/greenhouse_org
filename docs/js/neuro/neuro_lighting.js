// docs/js/neuro/neuro_lighting.js
// Enhanced PBR-lite Lighting System for Realistic 3D Rendering

(function () {
    'use strict';

    const GreenhouseNeuroLighting = {
        config: null,
        lights: [],
        presets: {
            clinical: {
                ambient: { intensity: 0.15, color: { r: 200, g: 210, b: 224 } },
                directional: { intensity: 1.0, color: { r: 255, g: 255, b: 255 }, direction: { x: 0.5, y: -0.5, z: 1 } },
                rim: { intensity: 0.4, color: { r: 255, g: 255, b: 255 } }
            },
            presentation: {
                ambient: { intensity: 0.1, color: { r: 224, g: 200, b: 180 } },
                directional: { intensity: 0.8, color: { r: 255, g: 240, b: 220 }, direction: { x: -0.5, y: -0.5, z: 1 } },
                rim: { intensity: 0.6, color: { r: 255, g: 220, b: 180 } }
            }
        },

        init(config) {
            this.config = config || window.GreenhouseNeuroConfig;
            this.setupLights();
            console.log('NeuroLighting: Enhanced System initialized');
        },

        setupLights() {
            this.lights = [];
            // Default Three-point lighting (Item 11)
            this.lights.push({ type: 'ambient', intensity: 0.2, color: { r: 255, g: 255, b: 255 } });
            this.lights.push({ type: 'directional', intensity: 0.7, color: { r: 255, g: 255, b: 255 }, direction: { x: 0.5, y: -0.5, z: 1 } }); // Key
            this.lights.push({ type: 'directional', intensity: 0.3, color: { r: 200, g: 220, b: 255 }, direction: { x: -0.5, y: 0.5, z: -0.5 } }); // Fill
            this.lights.push({ type: 'rim', intensity: 0.5, color: { r: 255, g: 255, b: 255 } }); // Rim (Item 19)
        },

        calculateLighting(normal, position, camera, material, state = {}) {
            let totalR = 0, totalG = 0, totalB = 0;
            const viewDir = this.normalize({ x: camera.x - position.x, y: camera.y - position.y, z: camera.z - position.z });

            // Item 4: PBR Properties
            const roughness = material.roughness ?? 0.4;
            const metalness = material.metalness ?? 0.0;
            const baseColor = material.baseColor ?? { r: 224, g: 224, b: 224 };

            this.lights.forEach(light => {
                if (light.type === 'ambient') {
                    totalR += light.color.r * light.intensity;
                    totalG += light.color.g * light.intensity;
                    totalB += light.color.b * light.intensity;
                } else if (light.type === 'directional') {
                    const L = this.normalize(light.direction);
                    const N = normal;
                    const H = this.normalize({ x: L.x + viewDir.x, y: L.y + viewDir.y, z: L.z + viewDir.z });

                    const diffuse = Math.max(0, N.x * L.x + N.y * L.y + N.z * L.z);
                    const NdotH = Math.max(0, N.x * H.x + N.y * H.y + N.z * H.z);
                    const specular = Math.pow(NdotH, (1.0 - roughness) * 128) * (1.0 - roughness);

                    totalR += (light.color.r * diffuse + light.color.r * specular * metalness) * light.intensity;
                    totalG += (light.color.g * diffuse + light.color.g * specular * metalness) * light.intensity;
                    totalB += (light.color.b * diffuse + light.color.b * specular * metalness) * light.intensity;
                } else if (light.type === 'rim') {
                    // Item 19: Fresnel Rim-light
                    const fresnel = Math.pow(1.0 - Math.max(0, normal.x * viewDir.x + normal.y * viewDir.y + normal.z * viewDir.z), 3);
                    totalR += light.color.r * fresnel * light.intensity;
                    totalG += light.color.g * fresnel * light.intensity;
                    totalB += light.color.b * fresnel * light.intensity;
                }
            });

            // Item 5: Subsurface Scattering (SSS)
            if (material.sss) {
                const sss = Math.pow(1.0 - Math.max(0, normal.x * viewDir.x + normal.y * viewDir.y + normal.z * viewDir.z), 2) * 0.3;
                totalR += 255 * sss; totalG += 200 * sss; totalB += 180 * sss;
            }

            let finalR = baseColor.r * (totalR / 255);
            let finalG = baseColor.g * (totalG / 255);
            let finalB = baseColor.b * (totalB / 255);

            // Item 15: ACES Tone-mapping (Approximate)
            finalR = this.aces(finalR / 255) * 255;
            finalG = this.aces(finalG / 255) * 255;
            finalB = this.aces(finalB / 255) * 255;

            return { r: Math.min(255, finalR), g: Math.min(255, finalG), b: Math.min(255, finalB), a: material.alpha || 1 };
        },

        normalize(v) {
            const l = Math.sqrt(v.x**2 + v.y**2 + v.z**2);
            return l > 0 ? { x: v.x / l, y: v.y / l, z: v.z / l } : v;
        },

        aces(x) {
            const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
            return Math.max(0, Math.min(1, (x * (a * x + b)) / (x * (c * x + d) + e)));
        }
    };

    window.GreenhouseNeuroLighting = GreenhouseNeuroLighting;
})();
