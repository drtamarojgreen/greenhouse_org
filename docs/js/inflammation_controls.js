/**
 * @file inflammation_controls.js
 * @description UI Control components (Checkboxes, Buttons) for the Inflammation App.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationControls = {
        drawDebugBadge(ctx, app) {
            const cam = app.camera;
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(app.canvas.width - 150, 10, 140, 45);
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.5)';
            ctx.strokeRect(app.canvas.width - 150, 10, 140, 45);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(`CAM Z: ${cam.z.toFixed(0)}`, app.canvas.width - 140, 22);
            ctx.fillText(`ROT X: ${cam.rotationX.toFixed(2)}`, app.canvas.width - 140, 32);
            ctx.fillText(`ROT Y: ${cam.rotationY.toFixed(2)}`, app.canvas.width - 140, 42);

            if (app.showZoomFeedback) {
                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 10px Quicksand';
                ctx.textAlign = 'right';
                ctx.fillText('ZOOM LIMITS: -2000 to -100', app.canvas.width - 160, 25);
            }
            ctx.restore();
        },

        drawCheckbox(ctx, app, c, state) {
            const isActive = state.factors[c.id] === 1;
            const isHighlighted = app.highlightedFactor === c.id || (app.presetFactors && app.presetFactors.includes(c.id));
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === c.id;
            const isFocused = app.ui.focusedElement && app.ui.focusedElement.id === c.id;

            ctx.save();

            if (isHighlighted) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                ctx.fillRect(c.x - 5, c.y - 2, 195, c.h + 4);
            }

            if (isFocused) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(c.x - 2, c.y - 2, 190, c.h + 4);
            }

            // Checkbox Box
            ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isActive ? '#4ca1af' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;

            const boxSize = 14;
            const bx = c.x;
            const by = c.y + (c.h - boxSize) / 2;

            if (app.roundRect) app.roundRect(ctx, bx, by, boxSize, boxSize, 3, true, true);
            else { ctx.fillRect(bx, by, boxSize, boxSize); ctx.strokeRect(bx, by, boxSize, boxSize); }

            // Active Checkmark
            if (isActive) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bx + 3, by + boxSize / 2);
                ctx.lineTo(bx + boxSize / 2 - 1, by + boxSize - 4);
                ctx.lineTo(bx + boxSize - 3, by + 4);
                ctx.stroke();
            }

            // Label
            ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 10px Quicksand, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(t(c.label).toUpperCase(), bx + boxSize + 10, c.y + c.h / 2 + 4);

            ctx.restore();
        },

        drawButton(ctx, app, b, state) {
            const isFocused = app.ui.focusedElement && app.ui.focusedElement.id === b.id;
            if (isFocused) {
                ctx.save();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
                ctx.restore();
            }

            let isActive = false;
            if (b.type === 'toggle') {
                if (b.id === 'toggle_left') isActive = app.ui.showLeftHemisphere;
                else if (b.id === 'toggle_right') isActive = app.ui.showRightHemisphere;
                else if (b.id === 'toggle_deep') isActive = app.ui.showDeepStructures;
                else if (b.id === 'camera_lock_y') isActive = app.interaction.isYLocked;
            } else {
                isActive = Math.round(state.factors.viewMode) === b.val;
            }

            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === b.id;

            ctx.save();
            if (isActive) {
                ctx.fillStyle = '#4ca1af';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#4ca1af';
            } else {
                ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
            }

            if (app.roundRect) app.roundRect(ctx, b.x, b.y, b.w, b.h, 6, true);

            ctx.fillStyle = isActive ? '#fff' : (isHovered ? '#fff' : 'rgba(255,255,255,0.6)');
            ctx.font = 'bold 10px Quicksand, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4);
            ctx.restore();
        },

        drawCategoryHeader(ctx, app, header) {
            const isHovered = header.isHovered;
            const isOpen = header.isOpen;
            const isFocused = app.ui.focusedElement && app.ui.focusedElement.id === header.id;

            const activeCount = app.ui.checkboxes.filter(c => c.category === header.id && app.engine.state.factors[c.id] === 1).length;

            ctx.save();

            if (isFocused) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(header.x - 2, header.y - 2, header.w + 4, header.h + 4);
            }

            // Background
            ctx.fillStyle = isHovered ? 'rgba(76, 161, 175, 0.3)' : 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = isHovered ? '#4ca1af' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;

            ctx.fillRect(header.x, header.y, header.w, header.h);
            ctx.strokeRect(header.x, header.y, header.w, header.h);

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Quicksand, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(header.label, header.x + 10, header.y + 18);

            // Active Badge (Item 13)
            if (activeCount > 0) {
                ctx.fillStyle = '#4ca1af';
                app.roundRect(ctx, header.x + ctx.measureText(header.label).width + 20, header.y + 6, 18, 14, 4, true);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(activeCount, header.x + ctx.measureText(header.label).width + 29, header.y + 16);
            }

            // Clear Button (Item 16)
            if (isHovered) {
                ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
                ctx.fillRect(header.x + header.w - 35, header.y + 5, 20, 15);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('X', header.x + header.w - 25, header.y + 16);
            }

            // Indicator (+/-)
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(isOpen ? '-' : '+', header.x + header.w - 5, header.y + 19);

            ctx.restore();
        },

        drawAtlasLegend(ctx, app, config, layout) {
            const { x, y, w, h } = layout || { x: 40, y: 100, w: 200, h: 180 };
            const viewMode = app.engine.state.factors.viewMode;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            if (app.roundRect) app.roundRect(ctx, x, y, w, h, 8, true, true);
            else ctx.fillRect(x, y, w, h);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 11px Quicksand, sans-serif';
            ctx.fillText('ANATOMICAL ATLAS LEGEND', x + 15, y + 25);

            let i = 0;
            for (const [key, val] of Object.entries(config.atlasLegend || {})) {
                // Item 81: Filtering
                if (viewMode === 1 && (key === 'trp' || key === 'kyn' || key === 'quin')) continue;
                if (viewMode === 2 && (key === 'microglia' || key === 'astrocyte')) continue;

                const lx = x + 20, ly = y + 45 + i * 18;
                const isHovered = app.interaction.mouseX >= x && app.interaction.mouseX <= x + w &&
                                  app.interaction.mouseY >= ly - 10 && app.interaction.mouseY <= ly + 5;

                ctx.fillStyle = val.color;
                ctx.beginPath();
                ctx.arc(lx, ly, isHovered ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();

                if (isHovered) {
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
                    app.ui.hoveredElement = { id: key, label: key.toUpperCase(), type: 'legend' };
                    app.ui.highlightedRegion = val.region; // Item 82: Structure highlighting
                }

                ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.7)';
                ctx.font = '9px monospace';
                ctx.fillText(`${key.toUpperCase()} → ${val.region.toUpperCase()}`, x + 35, ly + 3);
                i++;
            }
            ctx.restore();
        },

        drawMiniMap(ctx, app, w, h, layout) {
            const { x: mx, y: my, w: mw, h: mh } = layout || { x: w - 140, y: 40, w: 100, h: 80 };
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#4ca1af';
            if (app.roundRect) app.roundRect(ctx, mx, my, mw, mh, 5, true, true);

            ctx.fillStyle = 'rgba(76, 161, 175, 0.2)';
            ctx.beginPath();
            ctx.ellipse(mx + mw/2, my + mh/2, 25, 35, 0, 0, Math.PI * 2);
            ctx.fill();

            // Camera Indicator
            const camRot = app.camera.rotationY || 0;
            ctx.strokeStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(mx + mw/2, my + mh/2);
            ctx.lineTo(mx + mw/2 + Math.sin(camRot) * 20, my + mh/2 + Math.cos(camRot) * 20);
            ctx.stroke();

            // Viewport Box (Item 85)
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.strokeRect(mx + mw/2 - 15, my + mh/2 - 20, 30, 40);

            // Mode Badge (Item 87)
            const modes = ['MACRO', 'MICRO', 'MOL', 'PATH'];
            const modeBadge = modes[app.engine.state.factors.viewMode || 0];
            ctx.fillStyle = '#4ca1af';
            ctx.fillRect(mx + mw - 30, my + mh - 15, 25, 12);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 7px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText(modeBadge, mx + mw - 17.5, my + mh - 6);

            ctx.fillStyle = '#4ca1af';
            ctx.font = '9px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText('ORIENTATION', mx + mw/2, my + mh - 5);
            ctx.restore();
        },

        drawBreadcrumbs(ctx, app, region, layout) {
            const { x, y } = layout || { x: 300, y: 35 };
            ctx.save();

            const isHovered = app.interaction.mouseX >= x && app.interaction.mouseX <= x + 150 &&
                              app.interaction.mouseY >= y - 10 && app.interaction.mouseY <= y + 5;

            if (isHovered) {
                ctx.fillStyle = '#fff';
                app.ui.hoveredElement = { id: 'breadcrumb_reset', label: 'RESET VIEW', type: 'ui' };
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
            }

            ctx.font = '9px monospace';
            const confidence = (app.engine.state.metrics.regionConfidence || 0.85) * 100;
            const breadcrumb = `BRAIN > ${region ? region.toUpperCase() : 'WHOLE SYSTEM'} [CONF: ${confidence.toFixed(0)}%]`; // Item 84
            ctx.fillText(breadcrumb, x, y);
            ctx.restore();
        }
    };

    window.GreenhouseInflammationControls = GreenhouseInflammationControls;
})();
