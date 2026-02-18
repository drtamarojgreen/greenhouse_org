/**
 * @file neuro_controls.js
 * @description UI Control components for the Neuro Simulation (Canvas-based).
 * Optimized for responsiveness and robust hit detection.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseNeuroControls = {
        drawButton(ctx, app, b, isActive) {
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === b.id;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isActive) {
                ctx.fillStyle = 'rgba(76, 161, 175, 0.4)';
                ctx.strokeStyle = '#4ca1af';
            } else {
                ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            }
            ctx.lineWidth = 1;

            if (app.roundRect) app.roundRect(ctx, b.x, b.y, b.w, b.h, 6, true, true);
            else { ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h); }

            ctx.fillStyle = isActive ? '#fff' : (isHovered ? '#fff' : 'rgba(255,255,255,0.7)');
            ctx.font = 'bold 10px Quicksand, sans-serif';
            ctx.fillText(b.label.toUpperCase(), b.x + b.w / 2, b.y + b.h / 2);
            ctx.restore();
        },

        drawCheckbox(ctx, app, c, isActive) {
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === c.id;

            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

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
            ctx.fillText(t(c.labelKey).toUpperCase(), bx + boxSize + 10, c.y + c.h / 2);

            ctx.restore();
        },

        drawSlider(ctx, app, s, value) {
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === s.id;

            ctx.save();
            // Track
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            if (app.roundRect) app.roundRect(ctx, s.x, s.y + s.h/2 - 2, s.w, 4, 2, true);

            // Progress
            const progress = (value - s.min) / (s.max - s.min);
            ctx.fillStyle = '#4ca1af';
            if (app.roundRect) app.roundRect(ctx, s.x, s.y + s.h/2 - 2, s.w * progress, 4, 2, true);

            // Handle
            const hx = s.x + s.w * progress;
            const hy = s.y + s.h / 2;
            ctx.fillStyle = isHovered ? '#fff' : '#4ca1af';
            ctx.beginPath();
            ctx.arc(hx, hy, 8, 0, Math.PI * 2); // Slightly larger handle
            ctx.fill();
            if (isHovered) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();
        },

        drawPanel(ctx, app, x, y, w, h, title) {
            ctx.save();
            // Glassmorphism background
            ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
            if (app.roundRect) app.roundRect(ctx, x, y, w, h, 16, true);

            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            if (app.roundRect) app.roundRect(ctx, x, y, w, h, 16, false, true);

            // Title
            if (title) {
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#4ca1af';
                ctx.font = '800 10px Quicksand, sans-serif';
                ctx.fillText(title.toUpperCase(), x + 20, y + 15);
            }
            ctx.restore();
        },

        drawSearchBox(ctx, app, s, query) {
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === s.id;
            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            if (app.roundRect) app.roundRect(ctx, s.x, s.y, s.w, s.h, 6, true, true);
            else { ctx.fillRect(s.x, s.y, s.w, s.h); ctx.strokeRect(s.x, s.y, s.w, s.h); }

            ctx.fillStyle = query ? '#fff' : 'rgba(255,255,255,0.3)';
            ctx.font = '12px Quicksand, sans-serif';
            ctx.fillText(query || t('search_scenarios') || 'Search Scenarios...', s.x + 10, s.y + s.h / 2);
            ctx.restore();
        }
    };

    window.GreenhouseNeuroControls = GreenhouseNeuroControls;
})();
