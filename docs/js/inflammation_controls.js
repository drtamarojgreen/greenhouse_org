/**
 * @file inflammation_controls.js
 * @description UI Control components (Sliders, Buttons) for the Inflammation App.
 */

(function () {
    'use strict';

    const GreenhouseInflammationControls = {
        drawSlider(ctx, app, s, state) {
            const val = state.factors[s.id];
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === s.id;

            let labelText = s.label;
            if (labelText === 'label_exercise') labelText = 'Exercise Intensity';
            if (window.GreenhouseModelsUtil && window.GreenhouseModelsUtil.t) labelText = window.GreenhouseModelsUtil.t(s.label);

            ctx.fillStyle = isHovered ? '#333' : '#1a1a1a';
            app.roundRect(ctx, s.x, s.y, s.w, s.h, 4, true);

            ctx.fillStyle = isHovered ? '#64d2ff' : '#4ca1af';
            app.roundRect(ctx, s.x, s.y, s.w * val, s.h, 4, true);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(labelText, s.x, s.y - 10);

            const handleX = s.x + s.w * val;
            const handleY = s.y + s.h / 2;

            if (isHovered) {
                const g = ctx.createRadialGradient(handleX, handleY, 0, handleX, handleY, 12);
                g.addColorStop(0, 'rgba(100, 210, 255, 0.4)');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(handleX, handleY, 12, 0, Math.PI * 2); ctx.fill();
            }

            ctx.fillStyle = isHovered ? '#fff' : '#4ca1af';
            ctx.beginPath();
            ctx.arc(handleX, handleY, isHovered ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();
        },

        drawButton(ctx, app, b, state) {
            const active = Math.round(state.factors.viewMode) === b.val;
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === b.id;

            ctx.fillStyle = active ? '#4ca1af' : (isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)');
            if (isHovered && !active) {
                ctx.strokeStyle = '#4ca1af';
                ctx.lineWidth = 1;
                app.roundRect(ctx, b.x, b.y, b.w, b.h, 5, true, true);
            } else {
                app.roundRect(ctx, b.x, b.y, b.w, b.h, 5, true);
            }

            ctx.fillStyle = active ? '#000' : '#fff';
            ctx.font = isHovered ? 'bold 11px sans-serif' : 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + 16);
            ctx.textAlign = 'left';
        }
    };

    window.GreenhouseInflammationControls = GreenhouseInflammationControls;
})();
