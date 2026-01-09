// docs/js/synapse_actions.js
// User interaction, hit detection, and dynamic UI for the Synapse Visualization

(function () {
    'use strict';

    const SynapseActions = {

        // --- Event Handlers ---

        handleMouseMove(app, e) {
            const rect = app.canvas.getBoundingClientRect();
            app.mouse.x = e.clientX - rect.left;
            app.mouse.y = e.clientY - rect.top;
        },

        handleClick(app, e) {
            const w = app.canvas.width;
            // Check if EN button was clicked
            if (app.mouse.x > w - 70 && app.mouse.x < w - 40 && app.mouse.y > 10 && app.mouse.y < 30) {
                app.currentLanguage = 'en';
            }
            // Check if ES button was clicked
            if (app.mouse.x > w - 35 && app.mouse.x < w - 5 && app.mouse.y > 10 && app.mouse.y < 30) {
                app.currentLanguage = 'es';
            }
        },

        // --- Dynamic UI Drawing ---

        drawLanguageSwitcher(app, ctx) {
            const w = app.canvas.width;
            ctx.save();
            ctx.font = 'bold 14px "Courier New", Courier, monospace';

            // EN button
            ctx.fillStyle = app.currentLanguage === 'en' ? '#FFFFFF' : '#888888';
            ctx.fillText('EN', w - 60, 25);

            // Separator
            ctx.fillStyle = '#555555';
            ctx.fillText('|', w - 40, 25);

            // ES button
            ctx.fillStyle = app.currentLanguage === 'es' ? '#FFFFFF' : '#888888';
            ctx.fillText('ES', w - 25, 25);

            ctx.restore();
        },

        drawTooltip(app, ctx) {
            if (!app.hoveredItem) return;

            const text = SynapseElements.config.translations[app.hoveredItem][app.currentLanguage];
            if (!text) return;

            const x = app.mouse.x + 15;
            const y = app.mouse.y + 15;

            ctx.font = SynapseElements.config.labelFont;
            const textWidth = ctx.measureText(text).width;

            ctx.fillStyle = SynapseElements.config.tooltipBg;
            ctx.fillRect(x - 5, y - 15, textWidth + 10, 20);

            ctx.fillStyle = SynapseElements.config.tooltipColor;
            ctx.fillText(text, x, y);
        },

        // --- Hit Detection Logic ---

        performHitDetection(app, ctx, w, h, offsets, scale) {
            app.hoveredItem = null; // Reset on each frame

            // Order matters: check foreground items first
            if (this.isMouseOverVesicles(app, ctx, w, h, offsets.midLayerX, offsets.midLayerY, scale)) return;
            if (this.isMouseOverGPCRs(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
            if (this.isMouseOverIonChannels(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
            if (this.isMouseOverPreSynapticTerminal(app, ctx, w, h, offsets.midLayerX, offsets.midLayerY)) return;
            if (this.isMouseOverPostSynapticTerminal(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
        },

        isMouseOverPreSynapticTerminal(app, ctx, w, h, offsetX, offsetY) {
            const path = this.getPreSynapticTerminalPath(w, h);
            ctx.save();
            ctx.translate(offsetX, offsetY);
            if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                app.hoveredItem = 'preSynapticTerminal';
                ctx.restore();
                return true;
            }
            ctx.restore();
            return false;
        },

        isMouseOverPostSynapticTerminal(app, ctx, w, h, offsetX, offsetY) {
            const path = this.getPostSynapticTerminalPath(w, h);
            ctx.save();
            ctx.translate(offsetX, offsetY);
            if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                app.hoveredItem = 'postSynapticTerminal';
                ctx.restore();
                return true;
            }
            ctx.restore();
            return false;
        },

        isMouseOverVesicles(app, ctx, w, h, offsetX, offsetY, scale) {
            for (const v of SynapseElements.config.vesicles) {
                const path = this.getVesiclePath(v, w, h, scale);
                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = v.id || 'vesicle'; // Use specific ID if available
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        isMouseOverIonChannels(app, ctx, w, h, offsetX, offsetY) {
            for (const x of SynapseElements.config.ionChannels) {
                const path = this.getIonChannelPath(x, w, h);
                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = 'ionChannel';
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        isMouseOverGPCRs(app, ctx, w, h, offsetX, offsetY) {
             for (const x of SynapseElements.config.gpcrs) {
                const path = new Path2D();
                const rectX = w * x - 15;
                const rectY = h * 0.6 - 15;
                const rectW = 30;
                const rectH = 20;
                path.rect(rectX, rectY, rectW, rectH);

                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = 'gpcr';
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        // --- Path Definitions for Hit Detection ---

        getPreSynapticTerminalPath(w, h) {
            const path = new Path2D();
            path.moveTo(0, h * 0.4);
            path.bezierCurveTo(w * 0.25, h * 0.3, w * 0.75, h * 0.3, w, h * 0.4);
            path.lineTo(w, 0);
            path.lineTo(0, 0);
            path.closePath();
            return path;
        },

        getPostSynapticTerminalPath(w, h) {
            const path = new Path2D();
            path.moveTo(0, h * 0.6);
            path.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.7, w, h * 0.6);
            path.lineTo(w, h);
            path.lineTo(0, h);
            path.closePath();
            return path;
        },

        getVesiclePath(vesicle, w, h, scale) {
            const path = new Path2D();
            path.arc(w * vesicle.x, h * vesicle.y, vesicle.r * scale, 0, Math.PI * 2);
            return path;
        },

        getIonChannelPath(x, w, h) {
            const path = new Path2D();
            path.rect(w * x - 10, h * 0.6 - 15, 20, 15);
            return path;
        }
    };

    window.SynapseActions = SynapseActions;
})();
