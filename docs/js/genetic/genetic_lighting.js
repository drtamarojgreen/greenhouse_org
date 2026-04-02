// docs/js/genetic/genetic_lighting.js
// Enhanced PBR-lite Lighting System for Realistic 3D Rendering

(function () {
    'use strict';

    const GreenhouseGeneticLighting = {
        config: null,
        lights: [],

        init(config) {
            this.config = config || window.GreenhouseGeneticConfig;
            this.setupLights();
            console.log('GeneticLighting: PBR-lite System initialized');
        },

        setupLights() {
            this.lights = [];
            const presetKey = this.config.get('lighting.preset') || 'clinical';
            const preset = this.config.get(`lighting.presets.${presetKey}`);

            if (preset) {
                this.lights.push({
                    type: 'ambient',
                    intensity: preset.ambient.intensity,
                    color: preset.ambient.color
                });
                const dir = preset.directional.direction;
                const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
                this.lights.push({
                    type: 'directional',
                    intensity: preset.directional.intensity,
                    color: preset.directional.color,
                    direction: { x: dir.x / len, y: dir.y / len, z: dir.z / len }
                });
                this.exposure = preset.exposure || 1.0;
            } else {
                this.lights.push({
                    type: 'ambient',
                    intensity: this.config.get('lighting.ambient.intensity'),
                    color: this.config.get('lighting.ambient.color')
                });
                const dir = this.config.get('lighting.directional.direction');
                const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
                this.lights.push({
                    type: 'directional',
                    intensity: this.config.get('lighting.directional.intensity'),
                    color: this.config.get('lighting.directional.color'),
                    direction: { x: dir.x / len, y: dir.y / len, z: dir.z / len }
                });
                this.exposure = 1.0;
            }
        },

        calculateLighting(normal, position, camera, material) {
            let totalR = 0, totalG = 0, totalB = 0;

            const viewX = camera.x - position.x;
            const viewY = camera.y - position.y;
            const viewZ = camera.z - position.z;
            const viewLen = Math.sqrt(viewX * viewX + viewY * viewY + viewZ * viewZ);
            const viewDir = { x: viewX / viewLen, y: viewY / viewLen, z: viewZ / viewLen };

            const baseColor = this._toLinear(material.baseColor || { r: 255, g: 255, b: 255 });
            const metallic = material.metallic || 0.2;
            const roughness = material.roughness || 0.6;

            this.lights.forEach(light => {
                const lightColor = this._toLinear(light.color);

                if (light.type === 'ambient') {
                    totalR += baseColor.r * lightColor.r * light.intensity;
                    totalG += baseColor.g * lightColor.g * light.intensity;
                    totalB += baseColor.b * lightColor.b * light.intensity;
                } else if (light.type === 'directional') {
                    const NdotL = Math.max(0, normal.x * light.direction.x + normal.y * light.direction.y + normal.z * light.direction.z);
                    const halfX = light.direction.x + viewDir.x;
                    const halfY = light.direction.y + viewDir.y;
                    const halfZ = light.direction.z + viewDir.z;
                    const halfLen = Math.sqrt(halfX * halfX + halfY * halfY + halfZ * halfZ);
                    const halfDir = { x: halfX / halfLen, y: halfY / halfLen, z: halfZ / halfLen };

                    const NdotH = Math.max(0, normal.x * halfDir.x + normal.y * halfDir.y + normal.z * halfDir.z);
                    const specPower = Math.pow(NdotH, (1.0 - roughness) * 128);
                    const specular = specPower * (1.0 - roughness) * (0.04 + 0.96 * metallic);

                    const VdotH = Math.max(0, viewDir.x * halfDir.x + viewDir.y * halfDir.y + viewDir.z * halfDir.z);
                    const fresnel = 0.04 + 0.96 * Math.pow(1.0 - VdotH, 5);

                    const diffuseContrib = NdotL * (1.0 - fresnel) * (1.0 - metallic);
                    const specContrib = fresnel * specular;

                    totalR += (baseColor.r * diffuseContrib + specContrib) * lightColor.r * light.intensity;
                    totalG += (baseColor.g * diffuseContrib + specContrib) * lightColor.g * light.intensity;
                    totalB += (baseColor.b * diffuseContrib + specContrib) * lightColor.b * light.intensity;
                }
            });

            totalR *= this.exposure; totalG *= this.exposure; totalB *= this.exposure;
            const final = this._toSRGB({ r: totalR, g: totalG, b: totalB });

            return {
                r: Math.min(255, final.r * 255),
                g: Math.min(255, final.g * 255),
                b: Math.min(255, final.b * 255),
                a: material.alpha || 1
            };
        },

        _toLinear(c) {
            return { r: Math.pow(c.r / 255, 2.2), g: Math.pow(c.g / 255, 2.2), b: Math.pow(c.b / 255, 2.2) };
        },

        _toSRGB(c) {
            return { r: Math.pow(c.r, 1 / 2.2), g: Math.pow(c.g, 1 / 2.2), b: Math.pow(c.b, 1 / 2.2) };
        },

        toRGBA(color) {
            return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
        },

        getDirectionalLight() {
            return this.lights.find(l => l.type === 'directional')?.direction || { x: 0.5, y: -0.5, z: 1 };
        }
    };

    window.GreenhouseGeneticLighting = GreenhouseGeneticLighting;
})();
