// docs/js/models_3d_postprocess.js
// Centralized Post-processor for 3D Models
// Implements Bloom, TAA (Approx), FXAA, and HDR Presets

(function () {
    'use strict';

    const GreenhousePostProcessor = {
        enabled: true,
        settings: {
            bloom: true,
            bloomThreshold: 0.8,
            bloomIntensity: 0.4,
            fxaa: true,
            taa: true, // Temporal Anti-Aliasing (Approximate via frame blending)
            taaFactor: 0.8,
            tonemapping: 'aces'
        },

        _prevFrame: null,

        /**
         * Apply post-processing to a canvas frame
         */
        apply(ctx, width, height) {
            if (!this.enabled) return;

            // 1. TAA - Temporal Anti-Aliasing (Approximate using frame blending) (Item 7)
            if (this.settings.taa && this._prevFrame) {
                ctx.save();
                ctx.globalAlpha = 1.0 - this.settings.taaFactor;
                ctx.drawImage(this._prevFrame, 0, 0);
                ctx.restore();
            }

            // 2. Bloom (Item 30)
            if (this.settings.bloom) {
                this.applyBloom(ctx, width, height);
            }

            // 3. FXAA (Item 8)
            // Simplified FXAA: Subtle blur on high-contrast edges
            if (this.settings.fxaa) {
                ctx.filter = 'blur(0.3px)';
                ctx.drawImage(ctx.canvas, 0, 0);
                ctx.filter = 'none';
            }

            // Capture current frame for TAA
            if (this.settings.taa) {
                if (!this._prevFrame) {
                    this._prevFrame = document.createElement('canvas');
                    this._prevFrame.width = width;
                    this._prevFrame.height = height;
                }
                const pCtx = this._prevFrame.getContext('2d');
                pCtx.clearRect(0, 0, width, height);
                pCtx.drawImage(ctx.canvas, 0, 0);
            }
        },

        applyBloom(ctx, width, height) {
            // Extract highlights
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width / 4;
            tempCanvas.height = height / 4;
            const tCtx = tempCanvas.getContext('2d');

            tCtx.filter = `brightness(${this.settings.bloomThreshold * 200}%) blur(2px)`;
            tCtx.drawImage(ctx.canvas, 0, 0, width / 4, height / 4);

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = this.settings.bloomIntensity;
            ctx.drawImage(tempCanvas, 0, 0, width, height);
            ctx.restore();
        }
    };

    window.GreenhousePostProcessor = GreenhousePostProcessor;
})();
