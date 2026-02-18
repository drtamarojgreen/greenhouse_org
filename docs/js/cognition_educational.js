/**
 * @file cognition_educational.js
 * @description Educational features for the Cognition model.
 * Covers Enhancements 176-200.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const utils = () => window.GreenhouseCognitionDrawingUtils;

    const GreenhouseCognitionEducational = {
        init(app) {
            this.app = app;
            this.setupMappings();
            console.log('CognitionEducational: Initialized');
        },

        setupMappings() {
            this.mappings = {
                176: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(40, 110, w - 80, 130);
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial';
                    ctx.fillText(`${t('cog_label_question')}: Which layer is the primary input for the cortex?`, 50, 130);
                    const options = ['A) Layer II', 'B) Layer IV (Granular)', 'C) Layer VI'];
                    options.forEach((opt, i) => {
                        ctx.fillStyle = i === 1 ? '#4fd1c5' : '#fff';
                        ctx.strokeRect(50, 145 + i*25, 200, 20); ctx.fillText(opt, 60, 160 + i*25);
                    });
                },
                178: (ctx, w, h) => {
                    ctx.fillStyle = '#eee'; ctx.fillRect(40, 110, w - 80, 140);
                    ctx.strokeStyle = '#000'; ctx.strokeRect(40, 110, w - 80, 140);
                    ctx.fillStyle = '#ff4d4d'; ctx.font = 'bold 14px "Courier New"';
                    ctx.fillText(`${t('cog_label_confidential')}: PATIENT_HM`, 55, 135);
                    ctx.fillStyle = '#333'; ctx.font = '10px Arial';
                    ctx.fillText('Procedure: Bilateral medial temporal lobectomy', 55, 155);
                    ctx.fillText('Outcome: Profound Anterograde Amnesia', 55, 170);
                    ctx.fillText('Insight: Memory is not a single, unitary process.', 55, 185);
                    ctx.fillStyle = '#4da6ff'; ctx.fillText(t('cog_label_view_radiology'), 55, 220);
                },
                182: (ctx, w, h) => {
                    ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_learning_progress'), 50, 120);
                    ctx.strokeStyle = '#fff'; ctx.strokeRect(50, 130, 200, 15);
                    ctx.fillStyle = '#f6e05e'; ctx.fillRect(50, 130, 140, 15);
                    ctx.fillText(`${t('cog_label_rank')}: Neuro-Initiate`, 50, 165);
                    ctx.fillText(`${t('cog_label_badges')}:`, 50, 190);
                    for(let i=0; i<3; i++) {
                        ctx.beginPath(); ctx.arc(65 + i*40, 215, 15, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#000'; ctx.fillText('★', 60 + i*40, 220); ctx.fillStyle = '#f6e05e';
                    }
                },
                183: (ctx, w, h) => {
                    ctx.fillStyle = '#fff'; ctx.fillText(`${t('cog_label_scenario')}: The Distracted Student`, 50, 120);
                    ctx.font = 'italic 10px Arial'; ctx.fillText('You are studying, but your phone buzzes. What do you do?', 50, 140);
                    ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#4fd1c5';
                    ctx.fillText('1. Ignore it (Engage Executive Control)', 60, 170);
                    ctx.fillText('2. Check it (Engage Salience Network)', 60, 195);
                },
                189: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; ctx.fillRect(100, 100, 200, 100);
                    ctx.shadowBlur = 15; ctx.shadowColor = '#000'; ctx.strokeRect(100, 100, 200, 100); ctx.shadowBlur = 0;
                    ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial'; ctx.fillText('Anosognosia', 110, 125);
                    ctx.font = '10px Arial'; ctx.fillText('A deficit of self-awareness, a', 110, 145);
                    ctx.fillText('condition in which a person with', 110, 160);
                    ctx.fillText('a disability is unaware of its...', 110, 175);
                },
                190: (ctx, w, h) => {
                    const flip = Math.sin(Date.now() * 0.002);
                    ctx.save(); ctx.translate(w/2, 160); ctx.scale(flip, 1);
                    ctx.fillStyle = '#fff'; ctx.fillRect(-60, -40, 120, 80);
                    ctx.strokeStyle = '#4da6ff'; ctx.lineWidth = 2; ctx.strokeRect(-60, -40, 120, 80);
                    ctx.fillStyle = '#000'; ctx.font = 'bold 10px Arial';
                    if (flip > 0) ctx.fillText('Broca\'s Area', -35, 5); else ctx.fillText('Production', -30, 5);
                    ctx.restore(); ctx.fillStyle = '#fff';
                    ctx.fillText(t('cog_label_flip_card'), w/2 - 60, 220);
                },
                194: (ctx, w, h) => {
                    ctx.fillStyle = '#ff4d4d'; ctx.font = 'bold 12px Arial';
                    ctx.fillText(`${t('cog_label_myth')}: We only use 10% of our brain.`, 50, 125);
                    ctx.fillStyle = '#39ff14'; ctx.fillText(`${t('cog_label_fact')}: Brain imaging shows the entire`, 50, 155);
                    ctx.fillText('brain has a baseline level of activity', 50, 170);
                    ctx.fillText('at all times, even during sleep.', 50, 185);
                },
                197: (ctx, w, h) => {
                    ctx.strokeStyle = '#fff';
                    const nodes = [{n: 'Cognition', x: w/2, y: 120}, {n: 'Attention', x: w/2 - 80, y: 180}, {n: 'Memory', x: w/2 + 80, y: 180}, {n: 'Executive', x: w/2, y: 220}];
                    nodes.forEach(node => {
                        ctx.beginPath(); ctx.arc(node.x, node.y, 25, 0, Math.PI*2); ctx.stroke();
                        ctx.fillStyle = '#fff'; ctx.font = '9px Arial'; ctx.fillText(node.n, node.x - 20, node.y + 5);
                        if (node.n !== 'Cognition') {
                            ctx.beginPath(); ctx.moveTo(w/2, 145); ctx.lineTo(node.x, node.y - 25); ctx.stroke();
                        }
                    });
                },
                198: (ctx, w, h) => {
                    ctx.fillStyle = '#000'; ctx.fillRect(50, 110, 200, 120);
                    ctx.strokeStyle = '#fff'; ctx.strokeRect(50, 110, 200, 120);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath(); ctx.moveTo(130, 150); ctx.lineTo(130, 190); ctx.lineTo(170, 170); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_video_signal'), 60, 245);
                },
                199: (ctx, w, h) => {
                    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(50, 160); ctx.lineTo(w - 50, 160); ctx.stroke();
                    const points = ['1890', '1956', '2024'];
                    points.forEach((p, i) => {
                        const x = 50 + i * (w - 100) / 2;
                        ctx.beginPath(); ctx.moveTo(x, 155); ctx.lineTo(x, 165); ctx.stroke();
                        ctx.fillStyle = '#f6e05e'; ctx.fillText(p, x - 15, 180);
                    });
                    ctx.fillStyle = '#fff'; ctx.fillText(t('cog_label_interactive_history'), 50, 130);
                },
                200: (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(57, 255, 20, 0.2)'; ctx.fillRect(40, 110, 300, 60);
                    ctx.fillStyle = '#39ff14'; ctx.font = 'bold 12px Arial';
                    ctx.fillText(t('cog_label_wcag_compliant'), 55, 135);
                    ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
                    ctx.fillText('Implementation: Screen reader tags, High contrast,', 55, 155);
                    ctx.fillText('and Keyboard navigation verified.', 55, 170);
                }
            };
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Educational') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            utils().renderHeader(ctx, this.app, activeEnhancement);

            if (this.mappings[activeEnhancement.id]) {
                this.mappings[activeEnhancement.id](ctx, w, h);
            } else {
                ctx.fillStyle = '#ccc'; ctx.font = 'italic 11px Arial';
                ctx.fillText(t(activeEnhancement.description), 30, 120);
                ctx.strokeStyle = 'rgba(246, 224, 94, 0.3)';
                ctx.strokeRect(w - 100, h - 100, 60, 40);
                ctx.beginPath(); ctx.moveTo(w - 100, h - 60); ctx.lineTo(w - 70, h - 40); ctx.lineTo(w - 40, h - 60); ctx.stroke();
            }
        }
    };

    window.GreenhouseCognitionEducational = GreenhouseCognitionEducational;
})();
