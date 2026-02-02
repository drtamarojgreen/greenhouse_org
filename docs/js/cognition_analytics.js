/**
 * @file cognition_analytics.js
 * @description Analytical and visual structural features for the Cognition model.
 * Covers Enhancements 1-6.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseCognitionAnalytics = {
        init(app) {
            this.app = app;
            console.log('CognitionAnalytics: Initialized');
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement) return;

            if (activeEnhancement.category === 'Analytical') {
                if (activeEnhancement.id === 1) this.renderCorticalLayers(ctx);
                if (activeEnhancement.id === 2) this.renderSignalPropagation(ctx);
                if (activeEnhancement.id === 3) this.renderSystemSplit(ctx);
                if (activeEnhancement.id === 4) this.renderAnatomicalTooltips(ctx);
                if (activeEnhancement.id === 5) this.renderLesionMode(ctx);
                if (activeEnhancement.id === 6) this.renderMeSHLinkage(ctx);
            }

            if (activeEnhancement.category === 'Visualization') {
                this.renderVisualizationEnhancements(ctx, activeEnhancement);
            }
        },

        renderCorticalLayers(ctx) {
            const w = this.app.canvas.width;
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_exploded_view'), 20, 70);

            const layers = ['I. Molecular', 'II. External Granular', 'III. External Pyramidal', 'IV. Internal Granular', 'V. Internal Pyramidal', 'VI. Multiform'];
            layers.forEach((layer, i) => {
                const y = 100 + i * 35;
                // Layer label
                ctx.fillStyle = '#fff';
                ctx.font = '11px Arial';
                ctx.fillText(layer, 20, y + 15);

                // Box
                ctx.fillStyle = `rgba(79, 209, 197, ${0.1 + i * 0.1})`;
                ctx.fillRect(150, y, 200, 25);
                ctx.strokeStyle = '#4fd1c5';
                ctx.strokeRect(150, y, 200, 25);

                // Simulated neurons
                ctx.fillStyle = '#fff';
                for (let j = 0; j < 3 + i; j++) {
                    const nx = 160 + (j * 25) % 180;
                    const ny = y + 12 + Math.sin(j) * 5;
                    ctx.beginPath();
                    ctx.arc(nx, ny, 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Dendrites
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.beginPath();
                    ctx.moveTo(nx, ny);
                    ctx.lineTo(nx, ny - 10);
                    ctx.stroke();
                }
            });
        },

        renderSignalPropagation(ctx) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            const time = Date.now() * 0.002;

            ctx.fillStyle = '#39ff14';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_signal_path'), 20, 70);

            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;

            const path = [
                {x: w * 0.2, y: h * 0.7},
                {x: w * 0.4, y: h * 0.4},
                {x: w * 0.7, y: h * 0.5},
                {x: w * 0.8, y: h * 0.3}
            ];

            // Draw path
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for(let i=1; i<path.length; i++) ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw pulses
            for(let i=0; i<path.length - 1; i++) {
                this.drawArrow(ctx, path[i].x, path[i].y, path[i+1].x, path[i+1].y);

                // Animated packet
                const t = (time + i * 1.5) % 3 / 3;
                const px = path[i].x + (path[i+1].x - path[i].x) * t;
                const py = path[i].y + (path[i+1].y - path[i].y) * t;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#39ff14';
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        },

        renderSystemSplit(ctx) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(w / 2, 80);
            ctx.lineTo(w / 2, h - 20);
            ctx.stroke();
            ctx.setLineDash([]);

            // System 1
            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_system1'), w * 0.05, 100);
            ctx.font = '11px Arial';
            const traits1 = ['• Intuitive', '• Fast', '• Emotional', '• Implicit', '• Reflexive'];
            traits1.forEach((txt, i) => ctx.fillText(txt, w * 0.05, 130 + i * 20));

            // System 2
            ctx.fillStyle = '#4da6ff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_system2'), w * 0.55, 100);
            ctx.font = '11px Arial';
            const traits2 = ['• Analytical', '• Slow', '• Logical', '• Explicit', '• Deliberate'];
            traits2.forEach((txt, i) => ctx.fillText(txt, w * 0.55, 130 + i * 20));

            // Central icon
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.arc(w/2, h/2, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(t('cog_label_cognitive'), w/2 - 25, h/2 - 5);
            ctx.fillText(t('cog_label_control'), w/2 - 22, h/2 + 10);
        },

        renderAnatomicalTooltips(ctx) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_hud'), 20, 70);

            // Connection line
            ctx.strokeStyle = '#4fd1c5';
            ctx.beginPath();
            ctx.moveTo(w/2, h/2);
            ctx.lineTo(w - 240, 100);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#4fd1c5';
            ctx.lineWidth = 2;
            ctx.fillRect(w - 250, 60, 230, 100);
            ctx.strokeRect(w - 250, 60, 230, 100);

            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${t('cog_label_identified')}: Superior Frontal Gyrus`, w - 240, 85);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('Brodmann Area: 9/10', w - 240, 105);
            ctx.fillText(`${t('cog_label_volume')}: 14.2 cm³`, w - 240, 120);
            ctx.fillText(`${t('cog_label_activity')}: 0.82 [${t('cog_label_high')}]`, w - 240, 135);
        },

        renderLesionMode(ctx) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_lesion_study'), 20, 70);

            // Damage area
            ctx.fillStyle = 'rgba(255, 77, 77, 0.3)';
            ctx.beginPath();
            ctx.arc(w/2, h/2, 50, 0, Math.PI * 2);
            ctx.fill();

            // Static effect
            for(let i=0; i<20; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
                ctx.fillRect(w/2 - 50 + Math.random() * 100, h/2 - 50 + Math.random() * 100, 2, 2);
            }

            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(`${t('cog_label_deficit')}: Retrograde Amnesia`, 20, 95);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillRect(20, 110, 320, 45);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(`${t('cog_label_warning')}: Neural pathway interruption detected.`, 30, 130);
            ctx.fillText(`${t('cog_label_impact')}: Hippocampal-Cortical dissociation.`, 30, 145);
        },

        renderMeSHLinkage(ctx) {
            this.showMeSHDisclaimer();
            const w = this.app.canvas.width;
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(t('cog_label_mesh_link'), 20, 70);

            ctx.fillStyle = 'rgba(0, 40, 40, 0.9)';
            ctx.fillRect(20, 90, 380, 180);
            ctx.strokeStyle = '#4fd1c5';
            ctx.strokeRect(20, 90, 380, 180);

            ctx.fillStyle = '#4fd1c5';
            ctx.font = '10px monospace';
            ctx.fillText('> MESH_EXEC_PROTOCOL: ANALYZE_TRENDS (2014-2024)', 30, 110);

            const terms = [
                {name: 'Membrane Potentials', val: 4.14, trend: '+12.0'},
                {name: 'Synaptic Transmission', val: 3.72, trend: '-5.3'},
                {name: 'Anxiety', val: 3.48, trend: '+5.7'},
                {name: 'Mental Disorders', val: 3.57, trend: '-4.5'},
                {name: 'Reaction Time', val: 3.33, trend: '-5.0'}
            ];

            terms.forEach((term, i) => {
                const y = 135 + i * 25;
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(term.name, 35, y);

                // Log-normalized bar (simulated ln(1+x))
                const barWidth = term.val * 35;
                ctx.fillStyle = 'rgba(79, 209, 197, 0.5)';
                ctx.fillRect(180, y - 8, barWidth, 12);
                ctx.strokeStyle = '#4fd1c5';
                ctx.strokeRect(180, y - 8, barWidth, 12);

                ctx.fillStyle = term.trend.startsWith('+') ? '#39ff14' : '#ff4d4d';
                ctx.fillText(term.trend, 185 + barWidth, y);
                ctx.fillStyle = '#4fd1c5';
                ctx.fillText(term.val.toFixed(2), 150, y);
            });

            ctx.font = 'italic 9px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`${t('cog_label_data_source')}: PubMed Baseline (scripts/research/mesh/data/discovery_stats.csv)`, 30, 260);
        },

        showMeSHDisclaimer() {
            if (this.disclaimerAcknowledged) return;

            const modalId = 'mesh-disclaimer-modal';
            if (document.getElementById(modalId)) return;

            console.log('CognitionAnalytics: Showing MeSH Disclaimer');
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a202c;
                border: 2px solid #4fd1c5;
                padding: 20px;
                color: #fff;
                z-index: 1000;
                width: 300px;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                border-radius: 8px;
            `;
            modal.innerHTML = `
                <h4 style="color: #4fd1c5; margin-top: 0;">${t('cog_label_mesh_warn')}</h4>
                <p style="font-size: 12px; line-height: 1.5;">
                    ${t('cog_label_mesh_warn_text')}
                </p>
                <button id="close-mesh-disclaimer" style="background: #4fd1c5; color: #1a202c; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                    ${t('cog_btn_understand')}
                </button>
            `;

            const container = this.app.canvas.parentElement;
            container.appendChild(modal);

            document.getElementById('close-mesh-disclaimer').onclick = () => {
                console.log('CognitionAnalytics: MeSH Disclaimer Acknowledged');
                this.disclaimerAcknowledged = true;
                container.removeChild(modal);
            };
        },

        renderVisualizationEnhancements(ctx, activeEnhancement) {
            const w = this.app.canvas.width;
            const h = this.app.canvas.height;
            const time = Date.now() * 0.001;

            ctx.fillStyle = '#4da6ff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`VISUALIZATION: ${t(activeEnhancement.name).toUpperCase()}`, 20, 70);

            if (activeEnhancement.id === 101) { // 3D Network
                this.draw3DNetwork(ctx, w, h, time);
            } else if (activeEnhancement.id === 102) { // Process Flow
                this.drawProcessFlow(ctx, w, h, time);
            } else if (activeEnhancement.id === 103) { // Working Memory
                this.drawWorkingMemory(ctx, w, h, time);
            } else if (activeEnhancement.id === 104) { // LTM Formation
                this.drawLTMFormation(ctx, w, h, time);
            } else if (activeEnhancement.id === 105) { // Attention Network
                this.drawAttentionNetwork(ctx, w, h, time);
            } else if (activeEnhancement.id === 106) { // Language Processing
                this.drawLanguagePath(ctx, w, h, time);
            } else if (activeEnhancement.id === 109) { // Neural Oscillation
                this.drawOscillation(ctx, w, h, time);
            } else if (activeEnhancement.id === 110) { // Timeline
                this.drawTimeline(ctx, w, h, time);
            } else if (activeEnhancement.id === 111) { // Cognitive Load
                this.drawLoadMeter(ctx, w, h, time);
            } else if (activeEnhancement.id === 113) { // Heatmap
                this.drawHeatmap(ctx, w, h, time);
            } else if (activeEnhancement.id === 115) { // Aging
                this.drawAging(ctx, w, h, time);
            } else if (activeEnhancement.id === 117) { // Brain Plasticity
                this.drawPlasticity(ctx, w, h, time);
            } else if (activeEnhancement.id === 120) { // Bias Simulator
                this.drawBiasSimulator(ctx, w, h, time);
            } else {
                ctx.fillStyle = '#4da6ff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('ACTIVE VISUALIZATION PROTOCOL:', 30, 100);
                ctx.fillStyle = '#fff';
                ctx.font = 'italic 11px Arial';
                ctx.fillText(activeEnhancement.description, 30, 120);
                ctx.fillText('Rendering dynamic network nodes...', 30, 140);
                this.drawGenericNetwork(ctx, w, h, time);
            }
        },

        draw3DNetwork(ctx, w, h, time) {
            ctx.strokeStyle = 'rgba(77, 166, 255, 0.3)';
            const nodes = [];
            for(let i=0; i<8; i++) {
                nodes.push({
                    x: w/2 + Math.cos(time + i) * 100,
                    y: h/2 + Math.sin(time * 0.5 + i * 2) * 80
                });
            }
            ctx.beginPath();
            for(let i=0; i<nodes.length; i++) {
                for(let j=i+1; j<nodes.length; j++) {
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                }
            }
            ctx.stroke();
            nodes.forEach(n => {
                ctx.fillStyle = '#4da6ff';
                ctx.beginPath();
                ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        },

        drawProcessFlow(ctx, w, h, time) {
            const steps = ['Input', 'Perception', 'Encoding', 'Decision', 'Action'];
            steps.forEach((step, i) => {
                const x = 50 + i * (w - 100) / (steps.length - 1);
                const y = h / 2;
                ctx.fillStyle = `hsl(${200 + i * 20}, 70%, 60%)`;
                ctx.fillRect(x - 30, y - 20, 60, 40);
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(step, x - 25, y + 5);

                if (i < steps.length - 1) {
                    const nx = 50 + (i+1) * (w - 100) / (steps.length - 1);
                    ctx.strokeStyle = '#fff';
                    this.drawArrow(ctx, x + 30, y, nx - 30, y);
                }
            });
        },

        drawWorkingMemory(ctx, w, h, time) {
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(w/2 - 100, h/2 - 50, 200, 100);
            ctx.fillStyle = '#fff';
            ctx.fillText('WORKING MEMORY BUFFER (7±2)', w/2 - 80, h/2 - 60);

            for(let i=0; i<5; i++) {
                const x = w/2 - 80 + i * 35;
                const y = h/2 + Math.sin(time * 2 + i) * 10;
                ctx.fillStyle = '#4da6ff';
                ctx.fillRect(x, y - 10, 25, 20);
                ctx.fillStyle = '#000';
                ctx.fillText(String.fromCharCode(65 + i), x + 8, y + 5);
            }
        },

        drawLoadMeter(ctx, w, h, time) {
            const load = (Math.sin(time) + 1) / 2;
            ctx.fillStyle = '#fff';
            ctx.fillText('COGNITIVE LOAD:', w/2 - 100, h/2 - 20);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(w/2 - 100, h/2, 200, 20);
            const color = load > 0.8 ? '#ff4d4d' : (load > 0.5 ? '#f6e05e' : '#4fd1c5');
            ctx.fillStyle = color;
            ctx.fillRect(w/2 - 100, h/2, 200 * load, 20);
            ctx.fillText(`${(load * 100).toFixed(0)}%`, w/2 + 110, h/2 + 15);
        },

        drawPlasticity(ctx, w, h, time) {
            ctx.strokeStyle = '#4fd1c5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(w/2 - 100, h/2);
            ctx.bezierCurveTo(w/2 - 50, h/2 - 50, w/2 + 50, h/2 + 50, w/2 + 100, h/2);
            ctx.stroke();

            const thickness = 2 + Math.sin(time) * 1.5;
            ctx.lineWidth = thickness;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText('Synaptic Strengthening (LTP)', w/2 - 70, h/2 + 60);
        },

        drawLTMFormation(ctx, w, h, time) {
            ctx.fillStyle = '#fff';
            ctx.fillText('Consolidating: Hippocampus -> Neocortex', w/2 - 100, h/2 - 40);
            ctx.strokeStyle = '#f6e05e';
            ctx.beginPath();
            ctx.arc(w/2 - 50, h/2, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(w/2 + 50, h/2, 40, 0, Math.PI * 2);
            ctx.stroke();

            const t = (time % 2) / 2;
            const px = (w/2 - 50) + (100 * t);
            const py = h/2;
            ctx.fillStyle = '#f6e05e';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        },

        drawAttentionNetwork(ctx, w, h, time) {
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(w/2 - 150, h/2 - 50, 300, 100);
            const focusX = w/2 + Math.cos(time) * 120;
            const focusY = h/2 + Math.sin(time * 1.2) * 30;

            ctx.beginPath();
            ctx.moveTo(w/2, h/2);
            ctx.lineTo(focusX, focusY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();

            ctx.fillStyle = 'rgba(79, 209, 197, 0.4)';
            ctx.beginPath();
            ctx.arc(focusX, focusY, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText('ATTENTION FOCUS', focusX - 45, focusY - 25);
        },

        drawLanguagePath(ctx, w, h, time) {
            ctx.fillStyle = '#4da6ff';
            ctx.fillText('Wernicke\'s (Comprehension)', w * 0.6, h * 0.6);
            ctx.fillText('Broca\'s (Production)', w * 0.3, h * 0.4);

            ctx.strokeStyle = '#4da6ff';
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(w * 0.65, h * 0.55);
            ctx.quadraticCurveTo(w * 0.5, h * 0.3, w * 0.35, h * 0.35);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillText('Arcuate Fasciculus', w * 0.45, h * 0.3);
        },

        drawOscillation(ctx, w, h, time) {
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(50, h/2);
            for(let x=0; x<w-100; x++) {
                const y = h/2 + Math.sin(x * 0.05 + time * 5) * 20 + Math.sin(x * 0.2 + time * 10) * 5;
                ctx.lineTo(50 + x, y);
            }
            ctx.stroke();
            ctx.fillStyle = '#4da6ff';
            ctx.fillText('GAMMA OSCILLATION (40Hz)', 50, h/2 - 40);
        },

        drawTimeline(ctx, w, h, time) {
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(50, h/2 + 50);
            ctx.lineTo(w - 50, h/2 + 50);
            ctx.stroke();

            const milestones = ['Infancy', 'Childhood', 'Adolescence', 'Adulthood', 'Senior'];
            milestones.forEach((m, i) => {
                const x = 50 + i * (w - 100) / 4;
                ctx.beginPath();
                ctx.moveTo(x, h/2 + 45);
                ctx.lineTo(x, h/2 + 55);
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(m, x - 20, h/2 + 70);
            });

            const currentAge = (time % 10) / 10;
            const px = 50 + currentAge * (w - 100);
            ctx.fillStyle = '#4fd1c5';
            ctx.beginPath();
            ctx.arc(px, h/2 + 50, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText('Development Stage', px - 40, h/2 + 30);
        },

        drawHeatmap(ctx, w, h, time) {
            for(let i=0; i<50; i++) {
                const x = w/2 + Math.cos(i * 137.5) * i * 2;
                const y = h/2 + Math.sin(i * 137.5) * i * 2;
                const intensity = (Math.sin(time + i * 0.1) + 1) / 2;
                ctx.fillStyle = `rgba(255, ${255 * (1-intensity)}, 0, ${intensity * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#fff';
            ctx.fillText('Task-Related Activation Heatmap', 30, 100);
        },

        drawAging(ctx, w, h, time) {
            const age = (time % 10) / 10;
            const volume = 1.0 - (age * 0.3);
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.arc(w/2, h/2, 60 * volume, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(`Simulated Brain Volume: ${(volume * 100).toFixed(0)}%`, w/2 - 60, h/2 + 80);
            ctx.fillText(`Age proxy: ${(age * 100).toFixed(0)} years`, w/2 - 40, h/2 + 100);
        },

        drawBiasSimulator(ctx, w, h, time) {
            ctx.fillStyle = '#fff';
            ctx.fillText('BIAS: Confirmation Bias Simulation', 30, 100);
            ctx.strokeStyle = '#ff4d4d';
            ctx.strokeRect(w/2 - 50, h/2 - 50, 100, 100);

            const dataIn = Math.sin(time * 3);
            ctx.fillStyle = dataIn > 0 ? '#4fd1c5' : '#ff4d4d';
            ctx.beginPath();
            ctx.arc(w/2 - 150, h/2, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillText('Incoming Data', w/2 - 180, h/2 + 25);

            if (dataIn > 0) {
                this.drawArrow(ctx, w/2 - 130, h/2, w/2 - 60, h/2);
                ctx.fillText('ACCEPTED', w/2 - 30, h/2 + 5);
            } else {
                ctx.fillText('REJECTED', w/2 - 30, h/2 + 5);
            }
        },

        drawGenericNetwork(ctx, w, h, time) {
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            for(let i=0; i<5; i++) {
                const x1 = 100 + i * 50;
                const y1 = 150 + Math.sin(time + i) * 20;
                const x2 = 100 + ((i+1)%5) * 50;
                const y2 = 150 + Math.sin(time + ((i+1)%5)) * 20;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.fillStyle = '#4da6ff';
                ctx.beginPath();
                ctx.arc(x1, y1, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        drawArrow(ctx, fromx, fromy, tox, toy) {
            const headlen = 15;
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    };

    window.GreenhouseCognitionAnalytics = GreenhouseCognitionAnalytics;
})();
