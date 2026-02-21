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
        },

        drawDropdown(ctx, app, d, isOpen) {
            const isHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === d.id;

            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Button Base
            ctx.fillStyle = isOpen ? 'rgba(76, 161, 175, 0.4)' : (isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)');
            ctx.strokeStyle = isOpen ? '#4ca1af' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;

            if (app.roundRect) app.roundRect(ctx, d.x, d.y, d.w, d.h, 6, true, true);
            else { ctx.fillRect(d.x, d.y, d.w, d.h); ctx.strokeRect(d.x, d.y, d.w, d.h); }

            // Current Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Quicksand, sans-serif';
            const currentLabel = d.options.find(o => o.val === d.val)?.label || d.val;
            ctx.fillText(currentLabel.toUpperCase(), d.x + 10, d.y + d.h / 2);

            // Arrow
            ctx.beginPath();
            const ax = d.x + d.w - 20;
            const ay = d.y + d.h / 2;
            if (isOpen) {
                ctx.moveTo(ax - 4, ay + 2); ctx.lineTo(ax, ay - 2); ctx.lineTo(ax + 4, ay + 2);
            } else {
                ctx.moveTo(ax - 4, ay - 2); ctx.lineTo(ax, ay + 2); ctx.lineTo(ax + 4, ay - 2);
            }
            ctx.stroke();

            // Options List
            if (isOpen) {
                const optH = 25;
                const listH = d.options.length * optH;

                // Shadow/Backdrop for list
                ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                if (app.roundRect) app.roundRect(ctx, d.x, d.y + d.h + 2, d.w, listH, 6, true, true);
                ctx.shadowBlur = 0;

                d.options.forEach((opt, idx) => {
                    const oy = d.y + d.h + 2 + idx * optH;
                    const isOptHovered = app.ui.hoveredElement && app.ui.hoveredElement.id === `${d.id}_opt_${idx}`;

                    if (isOptHovered) {
                        ctx.fillStyle = 'rgba(76, 161, 175, 0.3)';
                        ctx.fillRect(d.x + 2, oy + 2, d.w - 4, optH - 4);
                    }

                    ctx.fillStyle = isOptHovered ? '#fff' : 'rgba(255,255,255,0.7)';
                    ctx.fillText(opt.label.toUpperCase(), d.x + 10, oy + optH / 2);
                });
            }

            ctx.restore();
        },

        drawTooltip(ctx, app, x, y, text, detail) {
            if (!text) return;

            ctx.save();
            const margin = 10;
            const maxWidth = 250;
            const lineHeight = 16;

            // Calculate height (dry run of wrapText)
            const getWrappedHeight = (txt, font, w) => {
                ctx.font = font;
                const words = txt.split(' ');
                let line = '';
                let lines = 1;
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    if (ctx.measureText(testLine).width > w && n > 0) {
                        line = words[n] + ' ';
                        lines++;
                    } else {
                        line = testLine;
                    }
                }
                return lines * lineHeight;
            };

            const textH = getWrappedHeight(text, 'bold 12px Quicksand, sans-serif', maxWidth - margin * 2);
            const detailH = detail ? getWrappedHeight(detail, 'italic 11px Quicksand, sans-serif', maxWidth - margin * 2) : 0;
            const totalH = textH + detailH + margin * 2 + (detail ? 5 : 0);

            let tx = x + 15;
            let ty = y + 15;
            if (tx + maxWidth > (ctx.canvas.width || 1200)) tx = x - maxWidth - 5;
            if (ty + totalH > (ctx.canvas.height || 600)) ty = y - totalH - 5;

            // Draw Box
            ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
            ctx.strokeStyle = '#4ca1af';
            ctx.lineWidth = 1;
            if (app.roundRect) app.roundRect(ctx, tx, ty, maxWidth, totalH, 8, true, true);
            else { ctx.fillRect(tx, ty, maxWidth, totalH); ctx.strokeRect(tx, ty, maxWidth, totalH); }

            // Draw Content
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Quicksand, sans-serif';
            if (window.GreenhouseModelsUtil?.wrapText) {
                window.GreenhouseModelsUtil.wrapText(ctx, text, tx + margin, ty + margin, maxWidth - margin * 2, lineHeight);
                if (detail) {
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.font = 'italic 11px Quicksand, sans-serif';
                    window.GreenhouseModelsUtil.wrapText(ctx, detail, tx + margin, ty + margin + textH + 5, maxWidth - margin * 2, lineHeight);
                }
            } else {
                ctx.fillText(text, tx + margin, ty + margin);
            }

            ctx.restore();
        }
    };

    window.GreenhouseNeuroControls = GreenhouseNeuroControls;
})();
