/**
 * @file stress_controls.js
 * @description UI Control components (Checkboxes, Buttons) for the Stress Dynamics App.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressControls = {
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
            const isActive = b.pathwayId ? (state.factors.activePathway === b.pathwayId) : (Math.round(state.factors.viewMode) === b.val);
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

            ctx.save();

            // Background
            ctx.fillStyle = isHovered ? 'rgba(76, 161, 175, 0.6)' : 'rgba(76, 161, 175, 0.2)';
            ctx.strokeStyle = '#4ca1af';
            ctx.lineWidth = 2;

            // Use roundRect if available on ctx or passed app
            if (app && app.roundRect) {
                app.roundRect(ctx, header.x, header.y, header.w, header.h, 6, true, true);
            } else {
                ctx.fillRect(header.x, header.y, header.w, header.h);
                ctx.strokeRect(header.x, header.y, header.w, header.h);
            }

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Quicksand, sans-serif';
            ctx.textAlign = 'left';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fillText(header.label.toUpperCase(), header.x + 10, header.y + 17);

            // Indicator (+/-)
            ctx.textAlign = 'right';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(isOpen ? '−' : '+', header.x + header.w - 10, header.y + 18);

            ctx.restore();
        }
    };

    window.GreenhouseStressControls = GreenhouseStressControls;
})();
