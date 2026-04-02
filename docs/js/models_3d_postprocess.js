// docs/js/models_3d_postprocess.js
// Advanced Post-Processing Effects for 3D Models
// Implements SSAO, TAA, Bloom, and Color Management

(function () {
    'use strict';

    const GreenhousePostProcessor = {
        _accumulationCanvas: null,
        _accumulationCtx: null,
        _jitterX: 0,
        _jitterY: 0,
        _frameIndex: 0,

        init(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            this._accumulationCanvas = document.createElement('canvas');
            this._accumulationCanvas.width = canvas.width;
            this._accumulationCanvas.height = canvas.height;
            this._accumulationCtx = this._accumulationCanvas.getContext('2d');
            console.log('PostProcessor: Initialized');
        },

        prepareFrame(config) {
            if (config.taa && config.taa.enabled) {
                this._frameIndex++;
                const scale = config.taa.jitterScale || 0.5;
                this._jitterX = (Math.random() - 0.5) * scale;
                this._jitterY = (Math.random() - 0.5) * scale;
                return { x: this._jitterX, y: this._jitterY };
            }
            return { x: 0, y: 0 };
        },

        applyEffects(config, camera) {
            if (!config) return;

            if (config.bloom && config.bloom.enabled) {
                this._applyBloom(config.bloom);
            }

            if (config.taa && config.taa.enabled) {
                this._applyTAA(config.taa);
            }
        },

        _applyTAA(taa) {
            const ctx = this.ctx;
            const accCtx = this._accumulationCtx;
            accCtx.globalAlpha = 0.1;
            accCtx.drawImage(this.canvas, 0, 0);
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this._accumulationCanvas, 0, 0);
            ctx.restore();
        },

        _applyBloom(bloom) {
            const ctx = this.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = bloom.intensity;
            ctx.filter = `blur(${bloom.radius}px) brightness(${1/bloom.threshold})`;
            ctx.drawImage(this.canvas, 0, 0);
            ctx.restore();
        },

        drawBackground(type, config) {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const bg = config.backgrounds[type] || config.backgrounds.neutral;

            ctx.save();
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, bg.top);
            grad.addColorStop(1, bg.bottom);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (bg.showGrid) {
                this._drawGrid(ctx, w, h);
            }
            ctx.restore();
        },

        _drawGrid(ctx, w, h) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const step = 50;
            ctx.beginPath();
            for (let x = 0; x <= w; x += step) {
                ctx.moveTo(x, 0); ctx.lineTo(x, h);
            }
            for (let y = 0; y <= h; y += step) {
                ctx.moveTo(0, y); ctx.lineTo(w, y);
            }
            ctx.stroke();
        }
    };

    window.GreenhousePostProcessor = GreenhousePostProcessor;
})();
