/**
 * @file cognition_development.js
 * @description Cognitive Development features for the Cognition model.
 * Covers Enhancements 31-55.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionDevelopment = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionDevelopment: Initialized');
        },

        setupMappings() {
            this.mappings = {
                31: (ctx, w, h) => utils().drawSynapticGrowth(ctx, w * 0.4, h * 0.4, '#00ff00', t('cog_label_synaptic_bloom')),
                32: (ctx, w, h) => utils().drawPruning(ctx, w * 0.4, h * 0.4, '#ff4d4d', t('cog_label_pruning')),
                33: (ctx, w, h) => utils().drawMyelination(ctx, w * 0.5, h * 0.6, '#ffffff', t('cog_label_myelination')),
                34: (ctx, w, h) => {
                    const time = Date.now() * 0.001;
                    const opacity = 0.2 + Math.abs(Math.sin(time)) * 0.5;
                    ctx.save();
                    ctx.fillStyle = '#4fd1c5';
                    ctx.globalAlpha = opacity;
                    ctx.beginPath();
                    ctx.arc(w * 0.35, h * 0.35, 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    ctx.fillText(t('cog_label_pfc_maturation'), w * 0.35 - 50, h * 0.35 + 50);
                    ctx.restore();
                },
                35: (ctx, w, h) => {
                    const stages = ['Sensorimotor', 'Preoperational', 'Concrete', 'Formal'];
                    ctx.font = '10px Arial';
                    stages.forEach((s, i) => {
                        ctx.fillStyle = (i === 3) ? '#4fd1c5' : '#666';
                        ctx.fillText(s, w * 0.5 - 150 + i * 80, h * 0.5 + 100);
                        ctx.fillRect(w * 0.5 - 150 + i * 80, h * 0.5 + 110, 60, 5);
                    });
                    ctx.fillStyle = '#fff';
                    ctx.fillText(t('cog_label_piaget_path'), w * 0.5 - 50, h * 0.5 + 135);
                },
                36: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.4, color = '#ff9900';
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(x - 100, y + 50);
                    ctx.quadraticCurveTo(x, y - 50, x + 100, y + 50);
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_phoneme_window'), x - 80, y - 20);
                },
                37: (ctx, w, h) => {
                    const x = w * 0.35, y = h * 0.35, color = '#ffffff';
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.ellipse(x, y, 30, 40, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_self_emergence'), x - 50, y + 60);
                },
                38: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ffff00';
                    const rh = 20 + Math.abs(Math.sin(Date.now() * 0.01)) * 40;
                    ctx.fillStyle = color;
                    ctx.fillRect(x - 10, y - rh, 20, rh);
                    ctx.fillText(t('cog_label_striatal_spike'), x - 40, y + 20);
                },
                39: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ccc';
                    const scale = 0.8 + Math.sin(Date.now() * 0.001) * 0.1;
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
                    ctx.beginPath();
                    ctx.arc(x, y, 40, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, 40 * scale, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_atrophy_sim'), x - 60, y + 70);
                },
                40: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.fillStyle = '#4da6ff';
                    ctx.fillText(t('cog_label_child_plasticity'), x - 150, y - 50);
                    this.drawBranching(ctx, x - 100, y, '#4da6ff', '');

                    ctx.fillStyle = '#ff9900';
                    ctx.fillText(t('cog_label_adult_efficiency'), x + 50, y - 50);
                    ctx.strokeStyle = '#ff9900';
                    ctx.beginPath();
                    ctx.moveTo(x + 100, y + 40);
                    ctx.lineTo(x + 100, y - 10);
                    ctx.stroke();
                },
                41: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.4, color = '#00ffff';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x - 100, y - 20 + i * 10);
                        ctx.bezierCurveTo(x, y + 50, x, y - 50, x + 100, y - 20 + i * 10);
                        ctx.stroke();
                    }
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_white_matter'), x - 60, y + 60);
                },
                42: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(x, y - 100); ctx.lineTo(x, y + 100);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#4da6ff';
                    ctx.fillText(t('cog_label_left_brain'), x - 100, y);
                    ctx.fillStyle = '#ff4d4d';
                    ctx.fillText(t('cog_label_right_brain'), x + 20, y);
                },
                43: (ctx, w, h) => this.drawBranching(ctx, w * 0.5, h * 0.5, '#00ff00', t('cog_label_dendritic_complexity')),
                44: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.6, color = '#ff4d4d';
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(x - 50, y); ctx.lineTo(x + 50, y);
                    ctx.stroke();
                    ctx.fillStyle = color;
                    const time = Date.now() * 0.01;
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(x - 40 + i * 20, y + Math.sin(time + i) * 10, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillText(t('cog_label_hpa_sensitivity'), x - 100, y + 40);
                },
                45: (ctx, w, h) => utils().drawPulse(ctx, w * 0.35, h * 0.35, '#4fd1c5', t('cog_label_inhibitory_emergence')),
                46: (ctx, w, h) => utils().drawPulse(ctx, w * 0.6, h * 0.5, '#ff00ff', t('cog_label_tpj_maturation')),
                47: (ctx, w, h) => utils().drawPulse(ctx, w * 0.6, h * 0.6, '#4da6ff', t('cog_label_vwfa_spec')),
                48: (ctx, w, h) => utils().drawGridOverlay(ctx, w * 0.6, h * 0.3, '#ffff00', t('cog_label_ips_spec')),
                49: (ctx, w, h) => {
                    const x1 = w * 0.4, y1 = h * 0.4, x2 = w * 0.6, y2 = h * 0.4, color = '#4da6ff';
                    const thickness = 2 + Math.sin(Date.now() * 0.01) * 5 + 5;
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_wm_bandwidth'), (x1 + x2) / 2 - 80, y1 - 20);
                    ctx.restore();
                },
                50: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#4fd1c5';
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 10;
                    ctx.beginPath();
                    ctx.arc(x, y, 60, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_cog_reserve'), x - 80, y + 85);
                    ctx.restore();
                },
                51: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.6, color = '#4fd1c5';
                    const time = Date.now() * 0.005;
                    ctx.fillStyle = color;
                    for (let i = 0; i < 5; i++) {
                        const ox = Math.sin(time + i) * 20;
                        const oy = Math.cos(time * 0.7 + i) * 20;
                        ctx.beginPath();
                        ctx.arc(x + ox, y + oy, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillText(t('cog_label_neurogenesis'), x - 50, y + 40);
                },
                52: (ctx, w, h) => {
                    const x = w * 0.7, y = h * 0.5, color = '#ff9900';
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(x - 100, y + 50);
                    ctx.quadraticCurveTo(x, y - 50, x + 100, y + 50);
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_sensory_windows'), x - 80, y - 20);
                },
                53: (ctx, w, h) => utils().drawTrajectory(ctx, '#4da6ff', t('cog_label_fluid_peak')),
                54: (ctx, w, h) => {
                    const color = '#00ff00', label = t('cog_label_cryst_accum');
                    const sw = 200, sh = 100, sx = 400, sy = 250;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sw, sy);
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.fillText(label, sx, sy - 20);
                },
                55: (ctx, w, h) => utils().drawNetwork(ctx, this.app.canvas, '#ff00ff', t('cog_label_social_circuit'))
            };
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Development') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            utils().renderHeader(ctx, this.app, activeEnhancement);

            if (this.mappings[activeEnhancement.id]) {
                this.mappings[activeEnhancement.id](ctx, w, h);
            }
        },

        drawBranching(ctx, x, y, color, label) {
            ctx.save();
            ctx.strokeStyle = color;
            const drawTree = (x1, y1, angle, depth) => {
                if (depth === 0) return;
                const x2 = x1 + Math.cos(angle) * depth * 5;
                const y2 = y1 + Math.sin(angle) * depth * 5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                drawTree(x2, y2, angle - 0.5, depth - 1);
                drawTree(x2, y2, angle + 0.5, depth - 1);
            };
            drawTree(x, y + 40, -Math.PI / 2, 5);
            if (label) {
                ctx.fillStyle = color;
                ctx.fillText(label, x - 60, y + 60);
            }
            ctx.restore();
        }
    };

    window.GreenhouseCognitionDevelopment = GreenhouseCognitionDevelopment;
})();
