/**
 * @file cognition_interventions.js
 * @description Therapeutic Intervention features for the Cognition model.
 * Covers Enhancements 56-80.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionInterventions = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionInterventions: Initialized');
        },

        setupMappings() {
            this.mappings = {
                56: (ctx, w, h) => {
                    const x1 = w * 0.4, y1 = h * 0.3, x2 = w * 0.5, y2 = h * 0.5, color = '#4da6ff';
                    utils().drawArrowLine(ctx, x1, y1, x2, y2, color, t('cog_label_topdown_reg'));
                    ctx.fillStyle = '#ff4d4d';
                    ctx.beginPath(); ctx.arc(x2, y2, 20, 0, Math.PI * 2); ctx.fill();
                    const time = Date.now() * 0.005;
                    ctx.strokeStyle = color;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath(); ctx.arc(x2, y2, 30 + (time % 20), 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#fff';
                    ctx.fillText('Regulated State', x2 - 40, y2 + 40);
                },
                57: (ctx, w, h) => utils().drawPulse(ctx, w * 0.5, h * 0.45, '#00ffcc', t('cog_label_acc_awareness'), 30, 0.5),
                58: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.4, color = '#ffff00';
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.beginPath(); ctx.ellipse(x, y + 20, 60, 80, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(x, y - 120); ctx.lineTo(x, y); ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
                    const time = Date.now() * 0.01;
                    ctx.strokeStyle = color;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath(); ctx.arc(x, y, (10 + i * 15 + time % 15), 0, Math.PI * 2); ctx.stroke();
                    }
                    ctx.fillText(t('cog_label_dbs_stimulation'), x + 15, y);
                },
                59: (ctx, w, h) => {
                    const x = w * 0.4, y = h * 0.35, color = '#39ff14';
                    ctx.strokeStyle = color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(x - 20, y, 25, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(x + 20, y, 25, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([2, 4]);
                    ctx.beginPath(); ctx.ellipse(x, y + 30, 20, 40, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = color;
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText(t('cog_label_tms_modulation'), x - 50, y + 80);
                },
                60: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ff4d4d';
                    const time = Date.now() * 0.001;
                    const amp = 40 * Math.exp(-time % 5);
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    for (let i = 0; i < 100; i++) {
                        ctx.lineTo(x - 50 + i, y + Math.sin(i * 0.2) * amp);
                    }
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_amygdala_habituation'), x - 50, y + 60);
                },
                61: (ctx, w, h) => utils().drawWaves(ctx, w * 0.5, h * 0.5, '#4da6ff', t('cog_label_eeg_states')),
                62: (ctx, w, h) => {
                    ctx.strokeStyle = '#ffff00'; ctx.strokeRect(w * 0.35 - 20, h * 0.35 - 20, 40, 40);
                    ctx.fillStyle = '#ffff00'; ctx.fillText(t('cog_label_exec_stimulation'), w * 0.35 - 50, h * 0.35 + 40);
                },
                63: (ctx, w, h) => {
                    const time = Date.now() * 0.005;
                    const bx = w * 0.5 + Math.sin(time) * 100;
                    ctx.fillStyle = '#ff9900';
                    ctx.beginPath(); ctx.arc(bx, h * 0.5, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(t('cog_label_bilateral_stim'), w * 0.5 - 50, h * 0.5 + 40);
                },
                64: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.6, color = '#00ff00';
                    const time = Date.now() * 0.002;
                    ctx.fillStyle = color;
                    for (let i = 0; i < 8; i++) {
                        const ox = Math.sin(time + i) * 30;
                        const oy = - (time * 20 + i * 10) % 60;
                        ctx.beginPath(); ctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.fillText(t('cog_label_bdnf_release'), x - 70, y + 20);
                },
                65: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#4da6ff';
                    const time = Date.now() * 0.002;
                    ctx.strokeStyle = color; ctx.globalAlpha = 0.3;
                    for (let i = 0; i < 5; i++) {
                        const ox = (time * 50 + i * 40) % 200 - 100;
                        ctx.beginPath(); ctx.moveTo(x + ox, y - 50); ctx.lineTo(x + ox, y + 50); ctx.stroke();
                    }
                    ctx.globalAlpha = 1.0; ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_glymphatic_clearance'), x - 70, y + 70);
                },
                66: (ctx, w, h) => utils().drawPulse(ctx, w * 0.6, h * 0.5, '#ff00ff', t('cog_label_mirror_social'), 30, 0.5),
                67: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#4fd1c5';
                    ctx.strokeStyle = color; ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
                    }
                    ctx.stroke(); ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_flexibility_hub'), x - 60, y + 70);
                },
                68: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ff9900';
                    ctx.strokeStyle = color; ctx.beginPath();
                    ctx.moveTo(x - 50, y + 20); ctx.lineTo(x + 50, y - 20);
                    ctx.stroke(); ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_dialectics'), x - 60, y + 50);
                },
                69: (ctx, w, h) => {
                    const colors = ['#ff4d4d', '#4fd1c5', '#ffff00', '#ff00ff'];
                    colors.forEach((c, i) => {
                        ctx.fillStyle = c; ctx.globalAlpha = 0.5; ctx.beginPath();
                        ctx.arc(w * 0.5 - 30 + i * 20, h * 0.5 + Math.sin(Date.now() * 0.01 + i) * 20, 15, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.globalAlpha = 1.0; ctx.fillStyle = '#fff';
                    ctx.fillText(t('cog_label_art_expression'), w * 0.5 - 80, h * 0.5 + 60);
                },
                70: (ctx, w, h) => utils().drawSoundWaves(ctx, w * 0.5, h * 0.5, '#ff00ff', t('cog_label_multi_resonance')),
                71: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ffff00';
                    const th = Math.sin(Date.now() * 0.01) * 20 + 40;
                    const bh = Math.sin(Date.now() * 0.015) * 10 + 20;
                    ctx.fillStyle = '#ff4d4d'; ctx.fillRect(x - 40, y - th, 30, th);
                    ctx.fillStyle = '#4fd1c5'; ctx.fillRect(x + 10, y - bh, 30, bh);
                    ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
                    ctx.fillText('Theta', x - 40, y + 15); ctx.fillText('Beta', x + 10, y + 15);
                    ctx.fillStyle = color; ctx.font = '12px Arial';
                    ctx.fillText(t('cog_label_theta_beta'), x - 60, y + 35);
                },
                72: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x - 120, y - 70, 240, 140);
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    for (let i = 0; i < 10; i++) {
                        ctx.beginPath(); ctx.moveTo(x - 120 + i * 24, y - 70); ctx.lineTo(x - 120 + i * 24, y + 70); ctx.stroke();
                    }
                    ctx.fillStyle = '#ff4d4d'; ctx.font = 'bold 12px Courier New';
                    ctx.fillText(t('cog_label_vr_phobia'), x - 100, y - 40);
                    ctx.fillStyle = '#4da6ff'; ctx.fillText(t('cog_label_vr_amygdala'), x - 100, y + 40);
                    ctx.strokeStyle = '#39ff14'; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.stroke();
                },
                73: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.7;
                    const time = Date.now() * 0.001;
                    const scale = 1 + Math.sin(time) * 0.2;
                    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.beginPath();
                    ctx.moveTo(x, y); ctx.bezierCurveTo(x - 50, y - 100, x + 50, y - 200, x, y - 300); ctx.stroke();
                    ctx.fillStyle = '#fff'; ctx.fillText(scale > 1 ? t('cog_label_vagus_inhale') : t('cog_label_vagus_exhale'), x + 20, y - 150);
                },
                74: (ctx, w, h) => {
                    const x = w * 0.4, y = h * 0.4, color = '#ffffff';
                    ctx.strokeStyle = color; ctx.strokeRect(x, y, 80, 100);
                    ctx.fillStyle = color; ctx.font = 'italic 10px Arial';
                    ctx.fillText('OLD SCHEMA', x + 5, y + 20);
                    ctx.beginPath(); ctx.moveTo(x + 5, y + 25); ctx.lineTo(x + 75, y + 25); ctx.stroke();
                    ctx.fillStyle = '#4fd1c5'; ctx.font = 'bold 11px Arial';
                    ctx.fillText('NEW NARRATIVE', x + 5, y + 60);
                    ctx.fillText(t('cog_label_reauthoring_schema'), x - 40, y + 120);
                },
                75: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.8, color = '#00ffff';
                    ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 150); ctx.stroke();
                    const time = Date.now() * 0.02;
                    const py = y - (time % 150);
                    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, py, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(t('cog_label_vns_stim'), x + 10, y - 75);
                },
                76: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.fillStyle = '#ffb6c1';
                    const time = Date.now() * 0.002;
                    for (let i = 0; i < 8; i++) {
                        ctx.beginPath(); ctx.arc(x + Math.sin(time + i) * 40, y + Math.cos(time + i) * 40, 5, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.fillText(t('cog_label_oxytocin_surge'), x - 70, y + 70);
                },
                77: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.strokeStyle = '#4da6ff'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = '#4da6ff'; ctx.fillText(t('cog_label_safety_boundary'), x - 80, y + 80);
                },
                78: (ctx, w, h) => {
                    const x = w * 0.35, y = h * 0.35;
                    ctx.fillStyle = '#4fd1c5'; ctx.font = 'italic 12px Arial';
                    ctx.fillText('"I want to change..."', x, y);
                    ctx.font = '12px Arial'; ctx.fillText(t('cog_label_change_talk'), x - 50, y + 30);
                },
                79: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.6, color = '#ffffcc';
                    const grad = ctx.createRadialGradient(x, y, 5, x, y, 50);
                    grad.addColorStop(0, color); grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.fillText('SCN Photostimulation', x - 50, y + 70);
                },
                80: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.6;
                    ctx.fillStyle = '#ffff00';
                    const time = Date.now() * 0.01;
                    ctx.beginPath(); ctx.arc(x + Math.cos(time) * 30, y + Math.sin(time) * 30, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(t('cog_label_play_reward'), x - 90, y + 60);
                }
            };
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Intervention') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            utils().renderHeader(ctx, this.app, activeEnhancement);

            if (this.mappings[activeEnhancement.id]) {
                this.mappings[activeEnhancement.id](ctx, w, h);
            }
        }
    };

    window.GreenhouseCognitionInterventions = GreenhouseCognitionInterventions;
})();
