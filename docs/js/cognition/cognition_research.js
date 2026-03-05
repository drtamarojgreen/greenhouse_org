/**
 * @file cognition_research.js
 * @description Research-oriented features for the Cognition model.
 * Covers Enhancements 151-175.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionResearch = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionResearch: Initialized');
        },

        setupMappings() {
            this.mappings = {
                151: (ctx, w, h) => {
                    ctx.fillStyle = '#111'; ctx.fillRect(40, 110, w - 80, 120);
                    ctx.strokeStyle = '#4fd1c5'; ctx.strokeRect(40, 110, w - 80, 120);
                    ctx.fillStyle = '#39ff14'; ctx.font = '10px monospace';
                    ctx.fillText(`> ${t('cog_label_propose_hypothesis')}`, 50, 130);
                    ctx.fillStyle = '#fff';
                    ctx.fillText('IF [Cortical_Layer_V_Activity] > [Threshold]', 50, 150);
                    ctx.fillText('THEN [Signal_Propagation] == [Efficient]', 50, 165);
                    ctx.fillStyle = '#4fd1c5'; ctx.fillText(`[${t('cog_label_run_simulation')}]`, 50, 200);
                    const progress = (Date.now() * 0.001) % 1; ctx.fillRect(50, 210, (w-100) * progress, 4);
                },
                152: (ctx, w, h) => {
                    ctx.fillStyle = '#222'; ctx.fillRect(40, 110, w - 80, 130);
                    ctx.strokeStyle = '#fff'; ctx.strokeRect(40, 110, w - 80, 130);
                    ctx.fillStyle = '#4da6ff'; ctx.font = 'bold 10px Arial';
                    ctx.fillText('SUBJECT_ID | REGION | VALUE | TIMESTAMP', 50, 125);
                    ctx.beginPath(); ctx.moveTo(40, 130); ctx.lineTo(w - 40, 130); ctx.stroke();
                    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
                    for (let i = 0; i < 5; i++) {
                        const val = (0.5 + Math.random() * 0.4).toFixed(3);
                        ctx.fillText(`SUB_0${i+1}     | PFC    | ${val} | ${Date.now() - i*1000}`, 50, 145 + i*15);
                    }
                    ctx.fillStyle = '#f6e05e'; ctx.fillText(`[${t('cog_label_generate_samples')}]`, 50, 230);
                },
                153: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(40, 110, w - 80, 140);
                    const results = [
                        {t: 'Active Inference in PFC', j: 'Nature (2024)', a: 'Frith et al.'},
                        {t: 'Cortical Layer Dynamics', j: 'Science (2023)', a: 'Smith et al.'},
                        {t: 'DMN Restructuring', j: 'Neuron (2024)', a: 'Doe et al.'}
                    ];
                    results.forEach((r, i) => {
                        ctx.fillStyle = '#4fd1c5'; ctx.font = 'bold 11px Arial'; ctx.fillText(r.t, 50, 130 + i * 40);
                        ctx.fillStyle = '#fff'; ctx.font = '9px Arial'; ctx.fillText(`${r.j} - ${r.a}`, 50, 142 + i * 40);
                        ctx.fillStyle = '#666'; ctx.fillText(t('cog_label_summary_investigating'), 50, 152 + i * 40);
                    });
                },
                154: (ctx, w, h) => {
                    ctx.fillStyle = '#000'; ctx.fillRect(50, 110, 200, 120);
                    ctx.strokeStyle = '#39ff14'; ctx.strokeRect(50, 110, 200, 120);
                    ctx.fillStyle = '#39ff14'; ctx.font = '8px monospace';
                    ctx.fillText('{', 60, 125); ctx.fillText('  "experiment": "Cognition_v2",', 60, 135);
                    ctx.fillText('  "data": [', 60, 145); ctx.fillText('    {"id": 1, "score": 0.92},', 60, 155);
                    ctx.fillText('    {"id": 2, "score": 0.85}', 60, 165); ctx.fillText('  ]', 60, 175); ctx.fillText('}', 60, 185);
                    ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_format_json'), 60, 210);
                    ctx.fillStyle = '#4da6ff'; ctx.fillText(`[${t('cog_label_confirm_export')}]`, 60, 225);
                },
                156: (ctx, w, h) => {
                    ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_step1_var'), 50, 120);
                    ctx.fillStyle = 'rgba(77, 166, 255, 0.2)'; ctx.fillRect(50, 130, 150, 25);
                    ctx.fillStyle = '#fff'; ctx.fillText('> Medication Dosage', 60, 147);
                    ctx.fillText(t('cog_label_step2_roi'), 50, 180);
                    ctx.fillStyle = 'rgba(79, 209, 197, 0.2)'; ctx.fillRect(50, 190, 150, 25);
                    ctx.fillStyle = '#fff'; ctx.fillText('> Dorsolateral PFC', 60, 207);
                },
                163: (ctx, w, h) => {
                    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(50, 210); ctx.lineTo(150, 210);
                    ctx.moveTo(50, 210); ctx.lineTo(50, 130); ctx.stroke();
                    ctx.beginPath(); ctx.strokeStyle = '#4fd1c5';
                    for(let i=0; i<100; i++) {
                        const x = 50 + i, y = 210 - 60 * Math.exp(-Math.pow(i-50, 2)/400);
                        if (i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
                    ctx.fillText(`${t('cog_label_p_value')}: 0.0042 [${t('cog_label_significant')}]`, 160, 150);
                    ctx.fillText(`${t('cog_label_effect_size')}: 0.78`, 160, 170);
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
            } else {
                ctx.fillStyle = '#ccc'; ctx.font = 'italic 11px Arial';
                ctx.fillText(t(activeEnhancement.description), 30, 120);
                ctx.fillText(t('cog_label_accessing_portal'), 30, 140);
                const time = Date.now() * 0.001;
                ctx.strokeStyle = 'rgba(79, 209, 197, 0.3)';
                ctx.beginPath(); ctx.arc(w/2, h/2 + 30, 40 + Math.sin(time)*10, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(w/2, h/2 + 30, 20 + Math.cos(time)*5, 0, Math.PI*2); ctx.stroke();
            }
        }
    };

    window.GreenhouseCognitionResearch = GreenhouseCognitionResearch;
})();
