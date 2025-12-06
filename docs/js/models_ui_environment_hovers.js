(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentHovers = {
        state: null,
        util: null,

        init(state, util) {
            this.state = state;
            this.util = util;
        },

        handleMouseMove(eventOrContext, canvasOrRegions, context, regions) {
            if (!this.state || !this.util) return;

            // Support both old signature and new optimized signature
            let x, y, transformedX, transformedY, canvas, ctx;

            if (eventOrContext && eventOrContext.logicalX !== undefined) {
                // New optimized signature: pre-calculated coordinates passed in
                x = eventOrContext.mouseX;
                y = eventOrContext.mouseY;
                transformedX = eventOrContext.logicalX;
                transformedY = eventOrContext.logicalY;
                canvas = eventOrContext.canvas;
                ctx = eventOrContext.context;
                regions = canvasOrRegions; // regions is second parameter in new signature
            } else {
                // Old signature: calculate coordinates here (backward compatibility)
                const event = eventOrContext;
                canvas = canvasOrRegions;
                ctx = context;

                const rect = canvas.getBoundingClientRect();
                x = event.clientX - rect.left;
                y = event.clientY - rect.top;

                // Calculate coordinate transformation ONCE before the loop
                const { scale, offsetX, offsetY } = window.GreenhouseModelsUtil.calculateEnvironmentLayout(canvas.width, canvas.height);
                transformedX = (x - offsetX) / scale;
                transformedY = (y - offsetY) / scale;
            }

            let hoveredRegionKey = null;
            for (const key in regions) {
                const region = regions[key];

                if (region.path && ctx.isPointInPath(region.path, transformedX, transformedY)) {
                    hoveredRegionKey = key;
                    break;
                }
            }

            if (hoveredRegionKey) {
                const region = regions[hoveredRegionKey];
                let activation = 0;
                if (this.state.environment.regions && this.state.environment.regions[hoveredRegionKey]) {
                    activation = this.state.environment.regions[hoveredRegionKey].activation;
                }

                this.state.environment.tooltip.visible = true;

                // Translate title (region name)
                this.state.environment.tooltip.title = this.util.t(region.name);

                // Translate activation label
                const activationLabel = this.util.t('activation_label');
                this.state.environment.tooltip.activation = activation !== undefined ? `${activationLabel}: ${(activation * 100).toFixed(0)}%` : '';

                let desc = '';
                if (this.util && this.util.getRegionDescription) {
                    desc = this.util.getRegionDescription(hoveredRegionKey);
                }

                // If util returns the default "No information" string, try to use the region's own description
                if ((!desc || desc === this.util.t('no_info')) && region.description) {
                    desc = region.description;
                }
                this.state.environment.tooltip.description = desc;

                this.state.environment.tooltip.x = x;
                this.state.environment.tooltip.y = y;
            } else {
                this.state.environment.tooltip.visible = false;
            }
        },

        setHoverState(params) {
            if (!this.state) return;

            if (params.active) {
                this.state.environment.tooltip.visible = true;
                this.state.environment.tooltip.title = params.title || '';
                this.state.environment.tooltip.description = params.content || '';
                this.state.environment.tooltip.activation = params.activation || ''; // Optional
                this.state.environment.tooltip.x = params.x;
                this.state.environment.tooltip.y = params.y;
            } else {
                this.state.environment.tooltip.visible = false;
            }
        },

        drawTooltip(ctx) {
            if (!this.state || !this.state.environment.tooltip.visible) return;

            const tooltip = this.state.environment.tooltip;
            const { x, y, title, activation, description } = tooltip;
            const width = 220;
            const height = 100;
            const padding = 12;

            ctx.save();
            ctx.fillStyle = 'rgba(25, 25, 25, 0.85)';
            ctx.strokeStyle = 'rgba(200, 200, 200, 1)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;

            ctx.beginPath();
            ctx.roundRect(x + 15, y + 15, width, height, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            const centerX = x + 15 + width / 2;
            ctx.fillText(title, centerX, y + 15 + padding + 8);

            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = '#B0B0B0';
            if (activation) {
                ctx.fillText(activation, centerX, y + 15 + padding + 32);
            }

            ctx.fillStyle = '#E0E0E0';
            if (this.util && this.util.wrapText) {
                this.util.wrapText(ctx, description, centerX, y + 15 + padding + 56, 196, 18);
            } else {
                // Fallback if util.wrapText is not available
                ctx.fillText(description, centerX, y + 15 + padding + 56);
            }
            ctx.restore();
        },

        drawHeatmaps(ctx, width, height, brainRegions) {
            if (!this.state) return;

            const { scale, offsetX, offsetY } = window.GreenhouseModelsUtil.calculateEnvironmentLayout(width, height);

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            // #99 - Only draw the heatmap for the currently hovered region
            const hoveredKey = this.state.environment.hoveredRegionKey;
            if (hoveredKey && brainRegions[hoveredKey] && brainRegions[hoveredKey].path) {
                const region = brainRegions[hoveredKey];
                const activation = this.state.environment.regions[hoveredKey]?.activation || 0.5; // Use activation for intensity

                ctx.save();
                ctx.shadowColor = region.color;
                ctx.shadowBlur = activation * 40 + 10; // Make glow more prominent
                ctx.fillStyle = region.color.replace('0.7', '0.4'); // Slightly more intense fill
                ctx.fill(region.path);
                ctx.restore();
            }
            ctx.restore();
        }
    };

    window.GreenhouseModelsUIEnvironmentHovers = GreenhouseModelsUIEnvironmentHovers;
})();
