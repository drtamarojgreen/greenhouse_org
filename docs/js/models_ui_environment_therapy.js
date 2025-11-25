(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentTherapy = {
        state: null,
        util: null,
        regions: {
            cbt: { path: null, name: 'Cognitive Behavioral Therapy (CBT)', description: 'Focuses on identifying and changing negative thought patterns.', x: 936, y: 850, radius: 25 },
            dbt: { path: null, name: 'Dialectical Behavior Therapy (DBT)', description: 'Teaches skills to manage emotions and improve relationships.', x: 1016, y: 750, radius: 25 },
            psychodynamic: { path: null, name: 'Psychodynamic Therapy', description: 'Explores unconscious influences on behavior.', x: 916, y: 680, radius: 25 },
            mode_deactivation: { path: null, name: 'Mode Deactivation Therapy', description: 'Treats complex behavioral problems in adolescents.', x: 1000, y: 600, radius: 25 },
            schema: { path: null, name: 'Schema Therapy', description: 'Targeting deep-seated patterns or themes.', x: 950, y: 550, radius: 25 },
            act: { path: null, name: 'Acceptance and Commitment Therapy', description: 'Encourages accepting thoughts and feelings.', x: 1050, y: 650, radius: 25 }
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

            // Define positions in logical 1536x1024 space
            // Placing them below the brain, to the right
            const centerX = 1536 / 2 + 150;
            const centerY = 850;

            // Draw main label
            const darkMode = window.GreenhouseModelsUI && window.GreenhouseModelsUI.state && window.GreenhouseModelsUI.state.darkMode;
            ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Therapy', centerX, centerY + 55);

            for (const key in this.regions) {
                const region = this.regions[key];
                this._drawTherapyNode(ctx, region);
            }

            ctx.restore();
        },

        _drawTherapyNode(ctx, region) {
            const { x, y, radius } = region;

            // Create path for hit detection
            const path = new Path2D();
            path.arc(x, y, radius, 0, Math.PI * 2);
            region.path = path;

            ctx.save();

            // Draw background circle
            ctx.fillStyle = 'rgba(150, 220, 150, 0.9)';
            ctx.strokeStyle = 'rgba(0, 100, 0, 1.0)';
            ctx.lineWidth = 2;
            ctx.fill(path);
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

    window.GreenhouseModelsUIEnvironmentTherapy = GreenhouseModelsUIEnvironmentTherapy;
})();
