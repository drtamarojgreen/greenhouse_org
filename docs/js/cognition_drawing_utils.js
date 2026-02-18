/**
 * @file cognition_drawing_utils.js
 * @description Shared drawing utilities for the Cognition Simulation Model.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseCognitionDrawingUtils = {
        /**
         * Standardized Header for Cognition Simulation Enhancements.
         */
        renderHeader(ctx, app, activeEnhancement) {
            if (!activeEnhancement) return;

            const category = activeEnhancement.category;
            const regionName = t(app.config.regions[activeEnhancement.region]?.name) || activeEnhancement.region;

            // Color based on category
            const categoryColors = {
                'Theory': '#4fd1c5',
                'Development': '#4fd1c5',
                'Intervention': '#4fd1c5',
                'Medication': '#ff9900',
                'Analytical': '#4da6ff',
                'Visualization': '#00ffff',
                'Accuracy': '#f6e05e',
                'Research': '#4fd1c5',
                'Educational': '#f6e05e'
            };

            const headerColor = categoryColors[category] || '#4fd1c5';

            ctx.save();
            ctx.fillStyle = headerColor;
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`${t('cog_cat_' + category.toLowerCase()).toUpperCase()}: ${t(activeEnhancement.name).toUpperCase()}`, 20, 70);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`${t('cog_ui_active_region')}: ${regionName.toUpperCase()}`, 20, 90);
            ctx.restore();
        },

        renderCategoryInfo(ctx, category, description, w, h) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(20, h - 60, w - 40, 40);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeRect(20, h - 60, w - 40, 40);

            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(t('cog_cat_' + category.toLowerCase()), 30, h - 45);

            ctx.fillStyle = '#ccc';
            ctx.font = '11px Arial';
            ctx.fillText(t(description), 30, h - 30);
            ctx.restore();
        },

        drawPulse(ctx, x, y, color, label, size = 10, intensity = 0.3) {
            const s = 1 + Math.sin(Date.now() * 0.01) * intensity;
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(x, y, size * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, x + size + 10, y + 5);
            }
            ctx.restore();
        },

        drawGridOverlay(ctx, x, y, color, label) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.strokeRect(x + i * 15, y, 10, 10);
                ctx.strokeRect(x, y + i * 15, 10, 10);
            }
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, x, y - 10);
            }
            ctx.restore();
        },

        drawArrowLine(ctx, fromx, fromy, tox, toy, color = '#fff', label = '') {
            const headlen = 10;
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);

            ctx.save();
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();

            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, fromx, fromy - 10);
            }
            ctx.restore();
        },

        drawNetwork(ctx, canvas, color, label) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, 20, 110);
            }
            ctx.restore();
        },

        drawActivationWave(ctx, x, y, color) {
            const time = Date.now() * 0.005;
            const radius = 20 + Math.sin(time) * 10;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        },

        drawWaves(ctx, x, y, color, label, amplitude = 20, length = 200) {
            const time = Date.now() * 0.005;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < length; i++) {
                ctx.lineTo(x - length / 2 + i, y + Math.sin(time + i * 0.1) * amplitude);
            }
            ctx.stroke();
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, x - 50, y + amplitude + 30);
            }
            ctx.restore();
        },

        drawRewardCircuit(ctx, x, y, color, label) {
            const time = Date.now() * 0.005;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 50, y + 20);
            ctx.bezierCurveTo(x - 20, y - 50, x + 20, y - 50, x + 50, y - 20);
            ctx.stroke();
            // Moving particles
            for (let i = 0; i < 3; i++) {
                const t_val = (time + i * 2) % 10 / 10;
                const px = (1 - t_val) * (1 - t_val) * (x - 50) + 2 * t_val * (1 - t_val) * x + t_val * t_val * (x + 50);
                const py = (1 - t_val) * (1 - t_val) * (y + 20) + 2 * t_val * (1 - t_val) * (y - 50) + t_val * t_val * (y - 20);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            if (label) {
                ctx.fillText(label, x - 70, y + 50);
            }
            ctx.restore();
        },

        drawReciprocalLoop(ctx, x1, y1, x2, y2, color, label) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;

            // Draw ellipse path
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.ellipse(cx, cy, 60, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw directional arrows on the loop
            const time = Date.now() * 0.002;

            for (let i = 0; i < 2; i++) {
                const angle = time + i * Math.PI;
                const ax = cx + Math.cos(angle) * 60;
                const ay = cy + Math.sin(angle) * 30;

                // Tangent for arrow head
                const tx = -Math.sin(angle) * 60;
                const ty = Math.cos(angle) * 30;
                const headAngle = Math.atan2(ty, tx);

                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax - 10 * Math.cos(headAngle - 0.5), ay - 10 * Math.sin(headAngle - 0.5));
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax - 10 * Math.cos(headAngle + 0.5), ay - 10 * Math.sin(headAngle + 0.5));
                ctx.stroke();
            }

            if (label) {
                ctx.fillStyle = color;
                ctx.font = 'bold 10px Arial';
                ctx.fillText(label, cx - 50, cy + 55);
            }
            ctx.restore();
        },

        drawSynapse(ctx, x, y, color, label) {
            ctx.save();
            // Presynaptic terminal
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 50, y - 80);
            ctx.quadraticCurveTo(x, y - 100, x + 50, y - 80);
            ctx.lineTo(x + 40, y - 30);
            ctx.lineTo(x - 40, y - 30);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Transporters
            ctx.fillStyle = '#555';
            ctx.fillRect(x - 35, y - 35, 10, 10);
            ctx.fillRect(x + 25, y - 35, 10, 10);

            // Postsynaptic density
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.rect(x - 60, y + 30, 120, 15);
            ctx.fill();
            ctx.stroke();

            // Receptors
            ctx.strokeStyle = '#4da6ff';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(x - 45 + i * 30, y + 30, 8, Math.PI, 0);
                ctx.stroke();
            }

            // Neurotransmitters
            ctx.fillStyle = color;
            const time = Date.now() * 0.002;
            for (let i = 0; i < 20; i++) {
                const ox = Math.sin(time + i) * 40;
                const oy = (i * 4 + time * 15) % 60 - 30;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            if (label) {
                ctx.fillStyle = color;
                ctx.font = 'bold 12px Arial';
                ctx.fillText(label, x - 100, y + 70);
            }
            ctx.restore();
        },

        drawPruning(ctx, x, y, color, label) {
            ctx.save();
            const time = Date.now() * 0.001;
            ctx.lineWidth = 1;

            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const isWeak = i % 3 !== 0;
                const opacity = isWeak ? Math.max(0.1, 0.5 - (time % 2)) : 0.8;

                ctx.strokeStyle = isWeak ? `rgba(255, 77, 77, ${opacity})` : `rgba(79, 209, 197, 0.8)`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * 40, y + Math.sin(angle) * 40);
                ctx.stroke();

                if (isWeak && opacity < 0.2) {
                    ctx.fillStyle = '#ff4d4d';
                    ctx.fillText('✕', x + Math.cos(angle) * 45 - 4, y + Math.sin(angle) * 45 + 4);
                }
            }
            if (label) {
                ctx.fillStyle = '#ff4d4d';
                ctx.fillText(label, x - 80, y + 80);
            }
            ctx.restore();
        },

        drawSynapticGrowth(ctx, x, y, color, label) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            const time = Date.now() * 0.002;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const len = 50 + Math.sin(time + i) * 10;
                ctx.beginPath();
                ctx.moveTo(x, y);
                const x2 = x + Math.cos(angle) * len;
                const y2 = y + Math.sin(angle) * len;
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Branching
                if (i % 2 === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(x2 + Math.cos(angle + 0.5) * 15, y2 + Math.sin(angle + 0.5) * 15);
                    ctx.stroke();
                }
            }
            if (label) {
                ctx.fillStyle = color;
                ctx.font = 'bold 11px Arial';
                ctx.fillText(label, x - 60, y + 90);
            }
            ctx.restore();
        },

        drawMyelination(ctx, x, y, color, label) {
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 100, y);
            ctx.lineTo(x + 100, y);
            ctx.stroke();

            const time = Date.now() * 0.05;
            for (let i = 0; i < 6; i++) {
                const mx = x - 90 + i * 35;
                const isFormed = (time % 100) > i * 15;
                ctx.fillStyle = isFormed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(mx, y - 5, 25, 10);
                if (isFormed) {
                    ctx.strokeStyle = '#4fd1c5';
                    ctx.strokeRect(mx, y - 5, 25, 10);
                }
            }
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, x - 80, y + 30);
            }
            ctx.restore();
        },

        drawTrajectory(ctx, color, label, sx = 50, sy = 120, w = 250, h = 120) {
            ctx.save();
            // Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.moveTo(sx, sy + h); ctx.lineTo(sx + w, sy + h);
            ctx.moveTo(sx, sy + h); ctx.lineTo(sx, sy);
            ctx.stroke();

            // Curve
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sx, sy + h - 10);
            ctx.bezierCurveTo(sx + w * 0.3, sy - 20, sx + w * 0.6, sy + 20, sx + w, sy + h - 40);
            ctx.stroke();

            if (label) {
                ctx.fillStyle = color;
                ctx.font = 'bold 11px Arial';
                ctx.fillText(label, sx + 10, sy + 10);
            }
            ctx.font = '9px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('START', sx - 10, sy + h + 15);
            ctx.fillText('END', sx + w - 10, sy + h + 15);
            ctx.restore();
        },

        drawSoundWaves(ctx, x, y, color, label) {
            const time = Date.now() * 0.01;
            ctx.save();
            ctx.strokeStyle = color;
            for (let i = 0; i < 3; i++) {
                const r = ((time + i * 20) % 60);
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, x - 50, y + 80);
            }
            ctx.restore();
        }
    };

    window.GreenhouseCognitionDrawingUtils = GreenhouseCognitionDrawingUtils;
})();
