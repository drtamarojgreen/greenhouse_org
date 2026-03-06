/**
 * @file rna_repair_physics.js
 * @description Physics and environmental engine for RNA repair simulation.
 * Handles secondary structure folding and environmental sensitivity.
 */

(function () {
    'use strict';

    window.Greenhouse = window.Greenhouse || {};

    /**
     * @class RNAFoldingEngine
     * @description Simulates secondary structure formation (hairpins/loops).
     */
    class RNAFoldingEngine {
        constructor() {
            this.hairpins = [];
            this.foldingStrength = 0;
            this.targetStrength = 0;
        }

        /**
         * Update folding state.
         * @param {number} dt
         */
        update(dt) {
            // Gradually transition folding strength
            this.foldingStrength += (this.targetStrength - this.foldingStrength) * 0.01;

            if (Math.random() < 0.001) {
                this.targetStrength = Math.random() > 0.7 ? 1.0 : 0.0;
            }
        }

        /**
         * Calculates positional offsets for a base based on folding.
         * @param {number} index
         * @param {number} totalBases
         * @returns {object} {offsetX, offsetY}
         */
        getFoldingOffset(index, totalBases) {
            if (this.foldingStrength <= 0) return { x: 0, y: 0 };

            // Simple hairpin simulation in the middle of the strand
            const mid = Math.floor(totalBases / 2);
            const range = 6;
            const dist = Math.abs(index - mid);

            if (dist < range) {
                const angle = (dist / range) * Math.PI;
                const radius = 40 * this.foldingStrength;
                return {
                    x: Math.sin(angle) * radius,
                    y: (Math.cos(angle) - 1) * radius
                };
            }

            return { x: 0, y: 0 };
        }
    }

    /**
     * @class RNAEnvironmentManager
     * @description Manages simulated pH and Temperature effects.
     */
    class RNAEnvironmentManager {
        constructor() {
            this.ph = 7.4;
            this.temperature = 37.0; // Celsius
            this.targetPh = 7.4;
            this.targetTemperature = 37.0;
        }

        update(dt) {
            this.ph += (this.targetPh - this.ph) * 0.005;
            this.temperature += (this.targetTemperature - this.temperature) * 0.005;

            // Random environmental fluctuations
            if (Math.random() < 0.002) {
                this.targetPh = 6.5 + Math.random() * 2.0;
                this.targetTemperature = 35.0 + Math.random() * 10.0;
            }
        }

        /**
         * Returns a multiplier for thermal noise based on temperature.
         */
        getNoiseMultiplier() {
            return 1.0 + (this.temperature - 37.0) * 0.1;
        }

        /**
         * Returns a multiplier for damage rate based on pH extremes.
         */
        getDamageMultiplier() {
            const phDev = Math.abs(this.ph - 7.4);
            return 1.0 + phDev * 2.0;
        }

        getStatus() {
            return {
                ph: this.ph.toFixed(1),
                temp: this.temperature.toFixed(1)
            };
        }
    }

    window.Greenhouse.RNAFoldingEngine = RNAFoldingEngine;
    window.Greenhouse.RNAEnvironmentManager = RNAEnvironmentManager;
    console.log("RNA Physics module loaded.");
})();
