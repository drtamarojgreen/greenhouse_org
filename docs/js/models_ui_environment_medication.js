(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentMedication = {
        state: null,
        util: null,
        regions: {
            antidepressants: { path: null, name: 'Anti-depressants', description: 'Medications designed to alleviate symptoms of depression by affecting neurotransmitters in the brain.', x: 600, y: 850, width: 60, height: 30 },
            ssris: { path: null, name: 'SSRIs', description: 'Selective Serotonin Reuptake Inhibitors: A class of drugs that are typically used as antidepressants in the treatment of major depressive disorder, anxiety disorders, and other psychological conditions.', x: 520, y: 750, width: 60, height: 30 },
            ssnis: { path: null, name: 'SSNIs', description: 'Serotonin and Norepinephrine Reuptake Inhibitors: A class of medications that are effective in treating depression and anxiety by increasing the levels of serotonin and norepinephrine in the brain.', x: 620, y: 680, width: 60, height: 30 }
        },

        init(state, util) {
            this.state = state;
            this.util = util;
        },

        draw(ctx, width, height) {
            ctx.save();

            // Shared transform logic (must match hovers.js)
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            for (const key in this.regions) {
                const region = this.regions[key];
                this._drawPill(ctx, region);
            }

            ctx.restore();
        },

        _drawPill(ctx, region) {

            const { x, y, width, height } = region;
            const radius = height / 2;

            const path = new Path2D();
            path.moveTo(x + radius, y);
            path.lineTo(x + width - radius, y);
            path.arc(x + width - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
            path.lineTo(x + radius, y + height);
            path.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2);
            path.closePath();

            region.path = path;

            ctx.save();
            ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
            ctx.fill(path);
            ctx.strokeStyle = 'rgba(0, 0, 100, 1.0)';
            ctx.lineWidth = 2;
            ctx.stroke(path);

            // Highlight
            ctx.beginPath();
            ctx.moveTo(x + radius, y + height * 0.3);
            ctx.lineTo(x + width - radius, y + height * 0.3);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        },



        handleMouseMove(event, canvas, context) {
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                return window.GreenhouseModelsUIEnvironmentHovers.handleMouseMove(event, canvas, context, this.regions);
            }
        },

        drawTooltip(ctx) {
            // Delegated to GreenhouseModelsUIEnvironmentHovers
        }
    };

    window.GreenhouseModelsUIEnvironmentMedication = GreenhouseModelsUIEnvironmentMedication;
})();
