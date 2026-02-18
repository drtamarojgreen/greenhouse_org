/**
 * @file cognition_theories.js
 * @description Modeling Theory mappings for the Cognition model.
 * Covers Enhancements 7-30.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionTheories = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionTheories: Initialized');
        },

        setupMappings() {
            this.theoryMappings = {
                7: (ctx, w, h) => utils().drawPulse(ctx, w * 0.35, h * 0.35, '#4fd1c5', t('cog_label_exec_control')),
                8: (ctx, w, h) => utils().drawReciprocalLoop(ctx, w * 0.4, h * 0.4, w * 0.6, h * 0.4, '#4da6ff', t('cog_label_pfc_parietal')),
                9: (ctx, w, h) => utils().drawRewardCircuit(ctx, w * 0.5, h * 0.5, '#ffff00', t('cog_label_mesolimbic')),
                10: (ctx, w, h) => {
                    utils().drawActivationWave(ctx, w * 0.6, h * 0.5, '#ff00ff');
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillText(t('cog_label_social_inference'), 20, 110);
                },
                11: (ctx, w, h) => utils().drawNetwork(ctx, this.app.canvas, '#ff9900', t('cog_label_salience')),
                12: (ctx, w, h) => utils().drawNetwork(ctx, this.app.canvas, '#ff4d4d', t('cog_label_dmn_active')),
                13: (ctx, w, h) => {
                    utils().drawActivationWave(ctx, w * 0.4, h * 0.3, '#39ff14');
                    ctx.fillStyle = '#39ff14';
                    ctx.fillText(t('cog_label_premotor'), 20, 110);
                },
                14: (ctx, w, h) => utils().drawPulse(ctx, w * 0.45, h * 0.4, '#ff0000', t('cog_label_ern')),
                15: (ctx, w, h) => utils().drawReciprocalLoop(ctx, w * 0.35, h * 0.45, w * 0.5, h * 0.6, '#ffffff', t('cog_label_vmpfc_amygdala')),
                16: (ctx, w, h) => {
                    ctx.strokeStyle = '#ff0000';
                    utils().drawArrowLine(ctx, w * 0.5, h * 0.5, w * 0.6, h * 0.6, '#ff0000', t('cog_label_threat_path'));
                },
                17: (ctx, w, h) => utils().drawPulse(ctx, w * 0.35, h * 0.45, '#4da6ff', t('cog_label_broca')),
                18: (ctx, w, h) => utils().drawPulse(ctx, w * 0.6, h * 0.55, '#4da6ff', t('cog_label_wernicke')),
                19: (ctx, w, h) => {
                    utils().drawArrowLine(ctx, w * 0.7, h * 0.5, w * 0.6, h * 0.3, '#ff00ff'); // Dorsal
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillText(t('cog_label_dorsal'), w * 0.72, h * 0.45);
                    utils().drawArrowLine(ctx, w * 0.7, h * 0.5, w * 0.6, h * 0.7, '#00ffff'); // Ventral
                    ctx.fillStyle = '#00ffff';
                    ctx.fillText(t('cog_label_ventral'), w * 0.72, h * 0.55);
                },
                20: (ctx, w, h) => utils().drawGridOverlay(ctx, w * 0.65, h * 0.65, '#4fd1c5', t('cog_label_ffa')),
                21: (ctx, w, h) => utils().drawPulse(ctx, w * 0.5, h * 0.6, '#4fd1c5', t('cog_label_hippocampal')),
                22: (ctx, w, h) => utils().drawNetwork(ctx, this.app.canvas, '#00ffff', t('cog_label_basal_cerebellum')),
                23: (ctx, w, h) => {
                    ctx.strokeStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.moveTo(w * 0.5 - 40, h * 0.4 - 20);
                    ctx.lineTo(w * 0.5 + 40, h * 0.4 - 20);
                    ctx.stroke();
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.moveTo(w * 0.5 - 40, h * 0.4 + 20);
                    ctx.lineTo(w * 0.5 + 40, h * 0.4 + 20);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#ffff00';
                    ctx.fillText(t('cog_label_trn_filter'), w * 0.5 - 70, h * 0.4 + 50);
                },
                24: (ctx, w, h) => {
                    const time = Date.now() * 0.002;
                    ctx.save();
                    ctx.translate(w * 0.6, h * 0.4);
                    ctx.rotate(time);
                    ctx.strokeStyle = '#4da6ff';
                    ctx.strokeRect(-20, -20, 40, 40);
                    ctx.restore();
                    ctx.fillStyle = '#4da6ff';
                    ctx.fillText(t('cog_label_parietal_spatial'), w * 0.6 - 60, h * 0.4 + 50);
                },
                25: (ctx, w, h) => utils().drawGridOverlay(ctx, w * 0.6, h * 0.3, '#ffff00', t('cog_label_ips_numerical')),
                26: (ctx, w, h) => {
                    ctx.strokeStyle = '#4da6ff';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(w * 0.65, h * 0.5, 10 + i * 20, Math.PI, 0);
                        ctx.stroke();
                    }
                    ctx.fillStyle = '#4da6ff';
                    ctx.fillText(t('cog_label_auditory_hierarchy'), w * 0.65 - 60, h * 0.5 + 30);
                },
                27: (ctx, w, h) => {
                    const x1 = w * 0.45, y1 = h * 0.7, x2 = w * 0.55, y2 = h * 0.6;
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    const progress = (Date.now() * 0.005) % 1;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(x1 + (x2-x1)*progress, y1 + (y2-y1)*progress, 4, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText(t('cog_label_olfactory_link'), x1 - 50, y1 + 30);
                },
                28: (ctx, w, h) => {
                    const x = w * 0.35, y = h * 0.5;
                    ctx.strokeStyle = '#ff9900';
                    ctx.beginPath();
                    ctx.moveTo(x, y); ctx.lineTo(x + 30, y - 30);
                    ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 30);
                    ctx.stroke();
                    ctx.fillStyle = '#ff9900';
                    ctx.fillText(t('cog_label_valuation_ofc'), x - 60, y + 60);
                },
                29: (ctx, w, h) => {
                    const x = w * 0.4, y = h * 0.4;
                    ctx.strokeStyle = '#ff4d4d';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(x - 15, y - 15); ctx.lineTo(x + 15, y + 15);
                    ctx.moveTo(x + 15, y - 15); ctx.lineTo(x - 15, y + 15);
                    ctx.stroke();
                    ctx.fillStyle = '#ff4d4d';
                    ctx.fillText(t('cog_label_inhibitory_rifg'), x - 60, y + 40);
                },
                30: (ctx, w, h) => {
                    const x = w * 0.35, y = h * 0.35;
                    ctx.strokeStyle = '#ff9900';
                    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI, false); ctx.stroke();
                    ctx.beginPath(); ctx.arc(x, y + 10, 15, Math.PI, 0, false); ctx.stroke();
                    ctx.fillStyle = '#ff9900';
                    ctx.fillText(t('cog_label_task_switching'), x + 25, y + 5);
                }
            };

            this.accuracyMappings = {
                126: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.fillRect(40, 100, 300, 120);
                    ctx.strokeStyle = '#f6e05e';
                    ctx.strokeRect(40, 100, 300, 120);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText(t('cog_ui_peer_source'), 50, 120);
                    ctx.font = '10px Arial';
                    ctx.fillText(`${t('cog_ui_journal')}: Nature Neuroscience`, 50, 140);
                    ctx.fillText(`${t('cog_ui_title')}: "Neural correlates of executive control"`, 50, 155);
                    ctx.fillText(`${t('cog_ui_doi')}: 10.1038/nn.2024.15`, 50, 170);
                    ctx.fillStyle = '#4fd1c5';
                    ctx.fillText(t('cog_ui_download_cit'), 50, 200);
                },
                127: (ctx, w, h) => {
                    ctx.fillStyle = '#fff';
                    ctx.fillText(t('cog_ui_verified_board'), 50, 110);
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(60, 135 + i * 30, 8, 0, Math.PI * 2);
                        ctx.fillStyle = '#4fd1c5';
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.fillText(t('cog_ui_phd_verified'), 75, 140 + i * 30);
                    }
                },
                130: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(w / 2 - 100, 100, 200, 100);
                    ctx.strokeStyle = '#4fd1c5';
                    ctx.strokeRect(w / 2 - 100, 100, 200, 100);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText(`${t('cog_ui_term')}: Metacognition`, w / 2 - 90, 125);
                    ctx.font = '10px Arial';
                    ctx.fillText('The awareness and understanding', w / 2 - 90, 145);
                    ctx.fillText('of one\'s own thought processes.', w / 2 - 90, 160);
                },
                131: (ctx, w, h) => {
                    ctx.strokeStyle = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(w / 2, 100); ctx.lineTo(w / 2, 250);
                    ctx.stroke();
                    ctx.fillStyle = '#4da6ff';
                    ctx.fillText('Baddeley Model', w * 0.15, 120);
                    ctx.fillStyle = '#ff9900';
                    ctx.fillText('Cowan Model', w * 0.65, 120);
                },
                132: (ctx, w, h) => {
                    ctx.fillStyle = '#fff';
                    ctx.fillText('LATEST FINDINGS (2024)', 50, 110);
                    ctx.beginPath();
                    ctx.moveTo(50, 125); ctx.lineTo(w - 50, 125); ctx.stroke();
                    ctx.fillStyle = '#4fd1c5';
                    ctx.fillText('Oct: New PFC sub-region mapped', 55, 145);
                    ctx.fillText('Sep: Thalamic gating refined', 55, 165);
                },
                135: (ctx, w, h) => {
                    ctx.fillStyle = '#ff4d4d';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText(t('cog_ui_limitations'), 50, 110);
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Arial';
                    ctx.fillText('1. Discrete modules vs distributed networks.', 50, 135);
                    ctx.fillText('2. Static vs dynamic synaptic weighting.', 50, 155);
                    ctx.fillText('3. fMRI proxy (BOLD) vs direct neural firing.', 50, 175);
                },
                142: (ctx, w, h) => {
                    ctx.fillStyle = '#fff';
                    ctx.fillText('COGNITIVE REVOLUTION (1950s)', 50, 110);
                    ctx.strokeRect(w - 120, 120, 100, 100);
                    ctx.fillText('George Miller', w - 110, 235);
                    ctx.fillText('Chomsky', 50, 140);
                    ctx.fillText('Neisser', 50, 160);
                    ctx.fillText('Newell & Simon', 50, 180);
                },
                145: (ctx, w, h) => {
                    ctx.fillStyle = '#ed8936';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('ETHICAL CONSIDERATIONS', 50, 110);
                    ctx.strokeStyle = '#ed8936';
                    ctx.strokeRect(40, 120, 320, 80);
                    ctx.fillStyle = '#fff';
                    ctx.fillText('• Data Privacy in Neural Monitoring', 55, 145);
                    ctx.fillText('• Equity in Cognitive Enhancement Access', 55, 170);
                },
                147: (ctx, w, h) => {
                    ctx.fillStyle = '#fff';
                    ctx.fillText('REACTION TIME DATA (N=250)', 50, 110);
                    ctx.strokeStyle = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(50, 220); ctx.lineTo(300, 220); ctx.moveTo(50, 220); ctx.lineTo(50, 120);
                    ctx.stroke();
                    ctx.fillStyle = '#4da6ff';
                    for (let i = 0; i < 10; i++) {
                        const h_val = 20 + Math.random() * 60;
                        ctx.fillRect(70 + i * 20, 220 - h_val, 15, h_val);
                    }
                }
            };
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement) return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            if (activeEnhancement.category === 'Theory') {
                utils().renderHeader(ctx, this.app, activeEnhancement);
                if (this.theoryMappings[activeEnhancement.id]) {
                    this.theoryMappings[activeEnhancement.id](ctx, w, h);
                }
            }

            if (activeEnhancement.category === 'Accuracy') {
                utils().renderHeader(ctx, this.app, activeEnhancement);
                if (this.accuracyMappings[activeEnhancement.id]) {
                    this.accuracyMappings[activeEnhancement.id](ctx, w, h);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.font = '11px Arial';
                    ctx.fillText(t(activeEnhancement.description), 40, 110);
                    ctx.fillStyle = 'rgba(246, 224, 94, 0.4)';
                    ctx.fillRect(40, 130, 200, 20);
                    ctx.fillStyle = '#f6e05e';
                    ctx.fillText(t('cog_ui_validated_data'), 50, 145);
                }
            }
        }
    };

    window.GreenhouseCognitionTheories = GreenhouseCognitionTheories;
})();
