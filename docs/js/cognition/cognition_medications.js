/**
 * @file cognition_medications.js
 * @description Medication Management features for the Cognition model.
 * Covers Enhancements 81-100.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionMedications = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionMedications: Initialized');
        },

        setupMappings() {
            this.mappings = {
                81: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#4da6ff', t('cog_label_serotonin_reuptake')),
                82: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#ff4d4d', t('cog_label_d2_blockade')),
                83: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#ffff00', t('cog_label_increased_ne_da')),
                84: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#00ff00', t('cog_label_gaba_potentiation')),
                85: (ctx, w, h) => utils().drawPulse(ctx, w * 0.5, h * 0.5, '#ffffff', t('cog_label_signal_stabilization')),
                86: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#ff9900', t('cog_label_dual_action')),
                87: (ctx, w, h) => utils().drawSynapticGrowth(ctx, w * 0.5, h * 0.5, '#39ff14', t('cog_label_synaptogenesis_burst')),
                88: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#ff00ff', t('cog_label_mao_inhibition')),
                89: (ctx, w, h) => utils().drawSynapse(ctx, w * 0.5, h * 0.5, '#4fd1c5', t('cog_label_ach_inhibition')),
                90: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ff4d4d';
                    const time = Date.now() * 0.01;
                    ctx.fillStyle = color;
                    ctx.beginPath(); ctx.arc(x + Math.sin(time) * 5, y + Math.cos(time) * 5, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(t('cog_label_eps_effects'), x - 50, y + 30);
                },
                91: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#4da6ff';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    for (let i = 0; i < 4; i++) ctx.fillRect(x - 120 + i * 60, y - 5, 55, 10);
                    ctx.strokeStyle = color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(x - 120, y); ctx.lineTo(x + 120, y); ctx.stroke();
                    const time = Date.now() * 0.005;
                    for (let i = 0; i < 8; i++) {
                        const tx = x - 100 + i * 30;
                        const ty = y - 60 + (time + i * 5) % 120;
                        ctx.fillStyle = (i % 3 === 0) ? '#ff4d4d' : '#4da6ff';
                        ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.fillStyle = color; ctx.fillText(t('cog_label_bbb_permeability'), x - 100, y + 80);
                },
                92: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#00ffcc';
                    for (let i = 0; i < 10; i++) {
                        ctx.fillStyle = i < 7 ? color : '#333';
                        ctx.beginPath(); ctx.arc(x - 100 + i * 20, y, 8, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.fillStyle = color; ctx.fillText(t('cog_label_receptor_occupancy'), x - 60, y + 40);
                },
                93: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ff9900';
                    ctx.fillStyle = '#333'; ctx.fillRect(x - 60, y, 120, 10);
                    const count = 3 + Math.round(Math.sin(Date.now() * 0.002) * 2);
                    ctx.fillStyle = color;
                    for (let i = 0; i < 5; i++) {
                        if (i < count) {
                            ctx.beginPath(); ctx.arc(x - 50 + i * 25, y - 5, 8, Math.PI, 0); ctx.fill();
                        }
                    }
                    ctx.fillText(t('cog_label_receptor_downregulation'), x - 60, y + 30);
                },
                94: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#ff4d4d';
                    ctx.strokeStyle = color; ctx.beginPath();
                    ctx.moveTo(x - 50, y); ctx.lineTo(x, y - 40); ctx.lineTo(x + 50, y + 20); ctx.stroke();
                    ctx.fillStyle = color; ctx.fillText(t('cog_label_withdrawal_rebound'), x - 60, y + 50);
                },
                95: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#39ff14';
                    ctx.strokeStyle = color; ctx.beginPath();
                    for (let i = 0; i < 20; i++) {
                        ctx.lineTo(x + Math.sin(i * 0.5) * 15, y - 40 + i * 4);
                    }
                    ctx.stroke(); ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_genetic_metabolism'), x - 60, y + 60);
                },
                96: (ctx, w, h) => {
                    const x = w * 0.5 - 100, y = h * 0.5 - 60, color = '#4fd1c5';
                    const sw = 200, sh = 120;
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x, y, sw, sh);
                    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + sh);
                    for (let i = 0; i < sw; i++) {
                        const val = sh - (sh * 0.6 * (1 - Math.exp(-i * 0.03)) + 30 + Math.sin(i * 0.2) * 5);
                        ctx.lineTo(x + i, y + val);
                    }
                    ctx.stroke(); ctx.fillStyle = color;
                    ctx.fillText(t('cog_label_steady_state'), x, y - 15);
                },
                97: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.strokeStyle = '#ff4d4d'; ctx.beginPath();
                    ctx.moveTo(x - 40, y - 40); ctx.lineTo(x + 40, y + 40);
                    ctx.moveTo(x + 40, y - 40); ctx.lineTo(x - 40, y + 40); ctx.stroke();
                    ctx.fillStyle = '#ff4d4d'; ctx.fillText(t('cog_label_complex_interaction'), x - 70, y + 60);
                },
                98: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5, color = '#00ffff';
                    ctx.strokeStyle = color; ctx.setLineDash([5, 5]);
                    ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]); ctx.fillStyle = color;
                    ctx.fillText('?', x - 5, y + 5); ctx.fillText(t('cog_label_orphan_receptor'), x - 60, y + 50);
                },
                99: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.fillStyle = '#ff9900'; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(t('cog_label_metabolic_impact'), x - 70, y + 40);
                },
                100: (ctx, w, h) => {
                    const x = w * 0.5, y = h * 0.5;
                    ctx.fillStyle = '#4fd1c5'; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#4fd1c5'; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillText(t('cog_label_offline_sync'), x - 70, y + 40);
                }
            };
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || !window.GreenhouseCognitionDrawingUtils) return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            utils().renderHeader(ctx, this.app, activeEnhancement);

            if (this.mappings[activeEnhancement.id]) {
                this.mappings[activeEnhancement.id](ctx, w, h);
            }
        }
    };

    window.GreenhouseCognitionMedications = GreenhouseCognitionMedications;
})();
