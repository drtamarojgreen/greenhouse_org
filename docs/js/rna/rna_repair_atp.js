/**
 * @file rna_repair_atp.js
 * @description Advanced ATP/GTP energy currency management for RNA repair simulations.
 */

(function () {
    'use strict';

    window.Greenhouse = window.Greenhouse || {};

    /**
     * @class RNAAtpManager
     * @description Manages ATP state, regeneration, and consumption.
     */
    class RNAAtpManager {
        constructor(initialAtp = 100) {
            this.atp = initialAtp;
            this.atpConsumed = 0;
            this.regenRate = 0.05;
        }

        /**
         * Update ATP regeneration.
         * @param {number} dt Delta time
         */
        update(dt) {
            if (this.atp < 100) {
                this.atp += this.regenRate * (dt / 16);
                if (this.atp > 100) this.atp = 100;
            }
        }

        /**
         * Consume ATP if available.
         * @param {number} amount
         * @returns {boolean} Success
         */
        consume(amount) {
            if (this.atp >= amount) {
                this.atp -= amount;
                this.atpConsumed += amount;
                return true;
            }
            return false;
        }

        /**
         * Gets the current ATP factor (0.2 to 1.0) affecting kinetics.
         */
        getKineticsFactor() {
            return Math.max(0.2, this.atp / 100);
        }

        getStatus() {
            return {
                atp: Math.floor(this.atp),
                consumed: this.atpConsumed.toFixed(1)
            };
        }
    }

    window.Greenhouse.RNAAtpManager = RNAAtpManager;
    console.log("RNA ATP Manager module loaded.");
})();
