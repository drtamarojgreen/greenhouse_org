(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentMedication = {
        state: null,
        util: null,
        regions: {},

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

            // Define positions in logical 1536x1024 space
            // Placing them below the brain (approx 800-900 Y)
            const baseX = 1536 / 2 - 150;
            const baseY = 850;

            const pills = [
                { id: 'antidepressants', label: 'Anti-depressants', color: 'rgba(200, 200, 255, 0.9)', x: baseX, y: baseY },
                { id: 'ssris', label: 'SSRIs', color: 'rgba(200, 220, 255, 0.9)', x: baseX + 30, y: baseY - 15 },
                { id: 'ssnis', label: 'SSNIs', color: 'rgba(220, 200, 255, 0.9)', x: baseX + 60, y: baseY }
            ];

            pills.forEach(pill => {
                this._drawPill(ctx, pill);
            });

            // Draw Label
            const darkMode = window.GreenhouseModelsUI && window.GreenhouseModelsUI.state && window.GreenhouseModelsUI.state.darkMode;
            ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '16px "Helvetica Neue", Arial, sans-serif'; // Larger font for scaled view
            ctx.textAlign = 'center';
            ctx.fillText('Medication', baseX + 30, baseY + 35);

            ctx.restore();
        },

        _drawPill(ctx, pill) {
            const width = 40;
            const height = 20;
            const radius = 10;
            const { x, y, color, id, label } = pill;

            const path = new Path2D();
            path.moveTo(x + radius, y);
            path.lineTo(x + width - radius, y);
            path.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, Math.PI * 0.5, false);
            path.lineTo(x + radius, y + height);
            path.arc(x + radius, y + radius, radius, Math.PI * 0.5, Math.PI * 1.5, false);
            path.closePath();

            // Store region
            this.regions[id] = {
                path: path,
                name: label,
                color: color,
                description: this._getDescription(id)
            };

            ctx.fillStyle = color;
            ctx.fill(path);
            ctx.strokeStyle = 'rgba(0, 0, 100, 1.0)';
            ctx.lineWidth = 2;
            ctx.stroke(path);

            // Highlight
            ctx.beginPath();
            ctx.moveTo(x + radius, y + 5);
            ctx.lineTo(x + width - radius, y + 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
        },

        _getDescription(id) {
            const descriptions = {
                'antidepressants': 'Medications designed to alleviate symptoms of depression by affecting neurotransmitters in the brain.',
                'ssris': 'Selective Serotonin Reuptake Inhibitors: A class of drugs that are typically used as antidepressants in the treatment of major depressive disorder, anxiety disorders, and other psychological conditions.',
                'ssnis': 'Serotonin and Norepinephrine Reuptake Inhibitors: A class of medications that are effective in treating depression and anxiety by increasing the levels of serotonin and norepinephrine in the brain.'
            };
            return descriptions[id] || '';
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
