/**
 * @file cognition_analytics.js
 * @description Analytical features for the Cognition model.
 * Covers Enhancements 1-6 and other analytical visualizations.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionAnalytics = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionAnalytics: Initialized');
        },

        setupMappings() {
            this.mappings = {
                1: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(79, 209, 197, 0.2)';
                    for (let i = 0; i < 6; i++) {
                        ctx.fillRect(50, 110 + i * 25, w - 100, 20);
                        ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
                        ctx.fillText(`Layer ${i + 1}`, 60, 125 + i * 25);
                        ctx.fillStyle = 'rgba(79, 209, 197, 0.2)';
                    }
                },
                2: (ctx, w, h) => {
                    const time = Date.now() * 0.002;
                    utils().drawArrowLine(ctx, 100, h / 2, w - 100, h / 2, '#39ff14', t('cog_label_signal_path'));
                    const progress = (time % 5) / 5;
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(100 + (w - 200) * progress, h / 2, 6, 0, Math.PI * 2); ctx.fill();
                },
                3: (ctx, w, h) => {
                    ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(w / 2, 100); ctx.lineTo(w / 2, h - 100); ctx.stroke();
                    ctx.fillStyle = '#ff4d4d'; ctx.fillText(t('cog_label_system1'), w * 0.2, 120);
                    ctx.fillStyle = '#4da6ff'; ctx.fillText(t('cog_label_system2'), w * 0.7, 120);
                },
                4: (ctx, w, h) => {
                    ctx.strokeStyle = '#4fd1c5'; ctx.strokeRect(w - 150, 50, 120, 150);
                    ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_hud'), w - 145, 70);
                },
                5: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(255, 77, 77, 0.3)'; ctx.beginPath();
                    ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ff4d4d'; ctx.fillText(t('cog_label_deficit'), w / 2 - 50, h / 2 + 80);
                },
                6: (ctx, w, h) => {
                    ctx.fillStyle = '#f6e05e'; ctx.font = 'bold 12px Arial';
                    ctx.fillText(t('cog_label_mesh_link'), 30, 110);
                    ctx.fillStyle = 'rgba(246, 224, 94, 0.1)'; ctx.fillRect(30, 120, w - 60, 60);
                    ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
                    ctx.fillText('Trend: Cognitive Load Research +15% (2024)', 40, 140);
                    ctx.fillText('Active Node: Prefrontal Cortex Cluster', 40, 160);
                },
                101: (ctx, w, h) => this.draw3DNetwork(ctx, w, h, Date.now() * 0.001),
                102: (ctx, w, h) => this.drawProcessFlow(ctx, w, h, Date.now() * 0.001),
                103: (ctx, w, h) => this.drawWorkingMemory(ctx, w, h, Date.now() * 0.001),
                111: (ctx, w, h) => this.drawLoadMeter(ctx, w, h, Date.now() * 0.001),
                117: (ctx, w, h) => this.drawPlasticity(ctx, w, h, Date.now() * 0.001),
                104: (ctx, w, h) => this.drawLTMFormation(ctx, w, h, Date.now() * 0.001),
                105: (ctx, w, h) => this.drawAttentionNetwork(ctx, w, h, Date.now() * 0.001),
                106: (ctx, w, h) => this.drawLanguagePath(ctx, w, h, Date.now() * 0.001),
                109: (ctx, w, h) => this.drawOscillation(ctx, w, h, Date.now() * 0.001),
                110: (ctx, w, h) => this.drawTimeline(ctx, w, h, Date.now() * 0.001),
                113: (ctx, w, h) => this.drawHeatmap(ctx, w, h, Date.now() * 0.001),
                115: (ctx, w, h) => this.drawAging(ctx, w, h, Date.now() * 0.001),
                120: (ctx, w, h) => this.drawBiasSimulator(ctx, w, h, Date.now() * 0.001)
            };
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || !window.GreenhouseCognitionDrawingUtils) return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            if (activeEnhancement.category === 'Analytical' || activeEnhancement.category === 'Visualization') {
                utils().renderHeader(ctx, this.app, activeEnhancement);
                if (this.mappings[activeEnhancement.id]) {
                    this.mappings[activeEnhancement.id](ctx, w, h);
                }
            }
        },

        draw3DNetwork(ctx, w, h, time) {
            ctx.strokeStyle = 'rgba(77, 166, 255, 0.4)';
            const nodes = [];
            for (let i = 0; i < 8; i++) {
                nodes.push({
                    x: w / 2 + Math.cos(time * 0.5 + i * 2) * 100,
                    y: h / 2 + Math.sin(time * 0.5 + i * 2) * 80
                });
            }
            ctx.beginPath();
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                }
            }
            ctx.stroke();
            nodes.forEach(n => {
                ctx.fillStyle = '#4da6ff'; ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
            });
        },

        drawProcessFlow(ctx, w, h, time) {
            const steps = ['Input', 'Perception', 'Encoding', 'Decision', 'Action'];
            steps.forEach((step, i) => {
                const x = 50 + i * (w - 100) / (steps.length - 1);
                const y = h / 2;
                ctx.fillStyle = `hsl(${200 + i * 20}, 70%, 60%)`;
                ctx.fillRect(x - 30, y - 20, 60, 40);
                ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
                ctx.fillText(step, x - 25, y + 5);
                if (i < steps.length - 1) {
                    const nx = 50 + (i + 1) * (w - 100) / (steps.length - 1);
                    utils().drawArrowLine(ctx, x + 30, y, nx - 30, y, '#fff');
                }
            });
        },

        drawWorkingMemory(ctx, w, h, time) {
            ctx.strokeStyle = '#fff'; ctx.strokeRect(w / 2 - 100, h / 2 - 50, 200, 100);
            ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_working_memory_buffer'), w / 2 - 80, h / 2 - 60);
            for (let i = 0; i < 5; i++) {
                const x = w / 2 - 80 + i * 35;
                const y = h / 2 + Math.sin(time * 2 + i) * 10;
                ctx.fillStyle = '#4da6ff'; ctx.fillRect(x, y - 10, 25, 20);
                ctx.fillStyle = '#000'; ctx.fillText(String.fromCharCode(65 + i), x + 8, y + 5);
            }
        },

        drawLoadMeter(ctx, w, h, time) {
            const load = (Math.sin(time) + 1) / 2;
            ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_cognitive_load') || 'COGNITIVE LOAD:', w / 2 - 100, h / 2 - 20);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(w / 2 - 100, h / 2, 200, 20);
            const color = load > 0.8 ? '#ff4d4d' : (load > 0.5 ? '#f6e05e' : '#4fd1c5');
            ctx.fillStyle = color; ctx.fillRect(w / 2 - 100, h / 2, 200 * load, 20);
            ctx.fillText(`${(load * 100).toFixed(0)}%`, w / 2 + 110, h / 2 + 15);
        },

        drawPlasticity(ctx, w, h, time) {
            ctx.save();
            ctx.strokeStyle = '#4fd1c5'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(w / 2 - 100, h / 2);
            ctx.bezierCurveTo(w / 2 - 50, h / 2 - 50, w / 2 + 50, h / 2 + 50, w / 2 + 100, h / 2);
            ctx.stroke();
            const thickness = 2 + Math.sin(time) * 1.5;
            ctx.lineWidth = thickness; ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_synaptic_strengthening') || 'Synaptic Strengthening (LTP)', w / 2 - 70, h / 2 + 60);
            ctx.restore();
        },

        drawLTMFormation(ctx, w, h, time) {
            ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_ltm_consolidating') || 'Consolidating...', w / 2 - 100, h / 2 - 40);
            ctx.strokeStyle = '#f6e05e'; ctx.beginPath(); ctx.arc(w / 2 - 50, h / 2, 30, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(w / 2 + 50, h / 2, 40, 0, Math.PI * 2); ctx.stroke();
            const progress = (time % 2) / 2;
            ctx.fillStyle = '#f6e05e'; ctx.beginPath(); ctx.arc((w / 2 - 50) + (100 * progress), h / 2, 5, 0, Math.PI * 2); ctx.fill();
        },

        drawAttentionNetwork(ctx, w, h, time) {
            ctx.strokeStyle = '#fff'; ctx.strokeRect(w / 2 - 150, h / 2 - 50, 300, 100);
            const focusX = w / 2 + Math.cos(time) * 120;
            const focusY = h / 2 + Math.sin(time * 1.2) * 30;
            ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(focusX, focusY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.stroke();
            ctx.fillStyle = 'rgba(79, 209, 197, 0.4)'; ctx.beginPath(); ctx.arc(focusX, focusY, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_attention_focus'), focusX - 45, focusY - 25);
        },

        drawLanguagePath(ctx, w, h, time) {
            ctx.fillStyle = '#4da6ff';
            ctx.fillText(t('cog_label_wernicke_comp'), w * 0.6, h * 0.6);
            ctx.fillText(t('cog_label_broca_prod'), w * 0.3, h * 0.4);
            ctx.strokeStyle = '#4da6ff'; ctx.setLineDash([10, 5]);
            ctx.beginPath(); ctx.moveTo(w * 0.65, h * 0.55); ctx.quadraticCurveTo(w * 0.5, h * 0.3, w * 0.35, h * 0.35); ctx.stroke();
            ctx.setLineDash([]); ctx.fillText(t('cog_label_arcuate'), w * 0.45, h * 0.3);
        },

        drawOscillation(ctx, w, h, time) {
            ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(50, h / 2);
            for (let x = 0; x < w - 100; x++) {
                const y = h / 2 + Math.sin(x * 0.05 + time * 5) * 20 + Math.sin(x * 0.2 + time * 10) * 5;
                ctx.lineTo(50 + x, y);
            }
            ctx.stroke(); ctx.fillStyle = '#4da6ff'; ctx.fillText(t('cog_label_gamma'), 50, h / 2 - 40);
        },

        drawTimeline(ctx, w, h, time) {
            ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(50, h / 2 + 50); ctx.lineTo(w - 50, h / 2 + 50); ctx.stroke();
            const milestones = ['Infancy', 'Childhood', 'Adolescence', 'Adulthood', 'Senior'];
            milestones.forEach((m, i) => {
                const x = 50 + i * (w - 100) / 4;
                ctx.beginPath(); ctx.moveTo(x, h / 2 + 45); ctx.lineTo(x, h / 2 + 55); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.fillText(m, x - 20, h / 2 + 70);
            });
            const progress = (time % 10) / 10;
            const px = 50 + progress * (w - 100);
            ctx.fillStyle = '#4fd1c5'; ctx.beginPath(); ctx.arc(px, h / 2 + 50, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillText(t('cog_label_dev_stage') || 'Development Stage', px - 40, h / 2 + 30);
        },

        drawHeatmap(ctx, w, h, time) {
            for (let i = 0; i < 50; i++) {
                const x = w / 2 + Math.cos(i * 137.5) * i * 2;
                const y = h / 2 + Math.sin(i * 137.5) * i * 2;
                const intensity = (Math.sin(time + i * 0.1) + 1) / 2;
                ctx.fillStyle = `rgba(255, ${255 * (1 - intensity)}, 0, ${intensity * 0.5})`;
                ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = '#fff'; ctx.fillText('Task-Related Activation Heatmap', 30, 100);
        },

        drawAging(ctx, w, h, time) {
            const progress = (time % 10) / 10;
            const volume = 1.0 - (progress * 0.3);
            ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 60 * volume, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(`${t('cog_label_brain_volume')}: ${(volume * 100).toFixed(0)}%`, w / 2 - 60, h / 2 + 80);
            ctx.fillText(`${t('cog_label_age_proxy')}: ${(progress * 100).toFixed(0)} years`, w / 2 - 40, h / 2 + 100);
        },

        drawBiasSimulator(ctx, w, h, time) {
            ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_bias_confirmation'), 30, 100);
            ctx.strokeStyle = '#ff4d4d'; ctx.strokeRect(w / 2 - 50, h / 2 - 50, 100, 100);
            const dataIn = Math.sin(time * 3);
            ctx.fillStyle = dataIn > 0 ? '#4fd1c5' : '#ff4d4d';
            ctx.beginPath(); ctx.arc(w / 2 - 150, h / 2, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillText(t('cog_label_incoming_data'), w / 2 - 180, h / 2 + 25);
            if (dataIn > 0) {
                utils().drawArrowLine(ctx, w / 2 - 130, h / 2, w / 2 - 60, h / 2, '#fff');
                ctx.fillText(t('cog_label_accepted'), w / 2 - 30, h / 2 + 5);
            } else {
                ctx.fillText(t('cog_label_rejected'), w / 2 - 30, h / 2 + 5);
            }
        }
    };

    window.GreenhouseCognitionAnalytics = GreenhouseCognitionAnalytics;
})();
