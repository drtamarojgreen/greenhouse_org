/**
 * @file inflammation_controls.js
 * @description UI Control components (Checkboxes, Buttons) for the Inflammation App.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationControls = {
        drawCheckbox(ctx, app, c, state) {
            const isActive = state.factors[c.id] === 1;
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === c.id;

            ctx.save();

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
            const isActive = Math.round(state.factors.viewMode) === b.val;
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

        drawCategoryHeader(ctx, header) {
            const isHovered = header.isHovered;
            const isOpen = header.isOpen;

            ctx.save();

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

            // Indicator (+/-)
            ctx.textAlign = 'right';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(isOpen ? '-' : '+', header.x + header.w - 10, header.y + 19);

            ctx.restore();
        },

        drawAtlasLegend(ctx, app, config, layout) {
            const { x, y, w, h } = layout || { x: 40, y: 100, w: 200, h: 180 };
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            if (app.roundRect) app.roundRect(ctx, x, y, w, h, 8, true, true);
            else ctx.fillRect(x, y, w, h);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 11px Quicksand, sans-serif';
            ctx.fillText('ANATOMICAL ATLAS LEGEND', x + 15, y + 25);

            let i = 0;
            for (const [key, val] of Object.entries(config.atlasLegend || {})) {
                ctx.fillStyle = val.color;
                ctx.beginPath();
                ctx.arc(x + 20, y + 45 + i * 18, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = '9px monospace';
                ctx.fillText(`${key.toUpperCase()} → ${val.region.toUpperCase()}`, x + 35, y + 48 + i * 18);
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

            ctx.fillStyle = '#4ca1af';
            ctx.font = '9px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText('ORIENTATION', mx + mw/2, my + mh - 5);
            ctx.restore();
        },

        drawBreadcrumbs(ctx, app, region, layout) {
            const { x, y } = layout || { x: 300, y: 35 };
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '9px monospace';
            const breadcrumb = `BRAIN > ${region ? region.toUpperCase() : 'WHOLE SYSTEM'}`;
            ctx.fillText(breadcrumb, x, y);
            ctx.restore();
        }
    };

    window.GreenhouseInflammationControls = GreenhouseInflammationControls;
})();
