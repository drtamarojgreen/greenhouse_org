/**
 * @file cognition_development.js
 * @description Cognitive Development features for the Cognition model.
 * Covers Enhancements 31-55.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseCognitionDevelopment = {
        init(app) {
            this.app = app;
            console.log('CognitionDevelopment: Initialized');
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Development') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            // Header
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`DEVELOPMENTAL STAGE: ${t(activeEnhancement.name).toUpperCase()}`, 20, 70);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Target Region: ${t(this.app.config.regions[activeEnhancement.region]?.name) || activeEnhancement.region}`, 20, 90);

            // Specific logic for batches
            // 31-37: Early Childhood
            if (activeEnhancement.id === 31) { // Synaptogenesis
                this.drawSynapticGrowth(ctx, w * 0.4, h * 0.4, '#00ff00', t('cog_label_synaptic_bloom'));
            }
            if (activeEnhancement.id === 32) { // Pruning
                this.drawPruning(ctx, w * 0.4, h * 0.4, '#ff4d4d', t('cog_label_pruning'));
            }
            if (activeEnhancement.id === 33) { // Myelination
                this.drawMyelination(ctx, w * 0.5, h * 0.6, '#ffffff', t('cog_label_myelination'));
            }
            if (activeEnhancement.id === 34) { // PFC Maturation
                this.drawMaturation(ctx, w * 0.35, h * 0.35, '#4fd1c5', t('cog_label_pfc_maturation'));
            }
            if (activeEnhancement.id === 35) { // Piagetian
                this.drawPiagetianStages(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 36) { // Language Critical Period
                this.drawSensitivityWindow(ctx, w * 0.5, h * 0.4, '#ff9900', t('cog_label_phoneme_window'));
            }
            if (activeEnhancement.id === 37) { // Self-Awareness
                this.drawMirror(ctx, w * 0.35, h * 0.35, '#ffffff', t('cog_label_self_emergence'));
            }

            // 38-44: Adolescence/Aging
            if (activeEnhancement.id === 38) { // Adolescent Reward
                this.drawRewardSpike(ctx, w * 0.5, h * 0.5, '#ffff00', t('cog_label_striatal_spike'));
            }
            if (activeEnhancement.id === 39) { // Aging
                this.drawVolumeChange(ctx, w * 0.5, h * 0.5, '#ccc', t('cog_label_atrophy_sim'));
            }
            if (activeEnhancement.id === 40) { // Plasticity Comparative
                this.drawPlasticityCompare(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 41) { // White Matter DTI
                this.drawDTIFibers(ctx, w * 0.5, h * 0.4, '#00ffff', t('cog_label_white_matter'));
            }
            if (activeEnhancement.id === 42) { // Lateralization
                this.drawLateralization(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 43) { // Enrichment
                this.drawBranching(ctx, w * 0.5, h * 0.5, '#00ff00', t('cog_label_dendritic_complexity'));
            }
            if (activeEnhancement.id === 44) { // Early Life Stress
                this.drawStressImpact(ctx, w * 0.5, h * 0.6, '#ff4d4d', t('cog_label_hpa_sensitivity'));
            }

            // 45-55: Higher Functions
            if (activeEnhancement.id === 45) { // Executive Emergence
                this.drawPulse(ctx, w * 0.35, h * 0.35, '#4fd1c5', t('cog_label_inhibitory_emergence'));
            }
            if (activeEnhancement.id === 46) { // Theory of Mind
                this.drawPulse(ctx, w * 0.6, h * 0.5, '#ff00ff', t('cog_label_tpj_maturation'));
            }
            if (activeEnhancement.id === 47) { // Literacy
                this.drawPulse(ctx, w * 0.6, h * 0.6, '#4da6ff', t('cog_label_vwfa_spec'));
            }
            if (activeEnhancement.id === 48) { // Numerical Sense
                this.drawGridOverlay(ctx, w * 0.6, h * 0.3, '#ffff00', t('cog_label_ips_spec'));
            }
            if (activeEnhancement.id === 49) { // WM Capacity
                this.drawBandwidth(ctx, w * 0.4, h * 0.4, w * 0.6, h * 0.4, '#4da6ff', t('cog_label_wm_bandwidth'));
            }
            if (activeEnhancement.id === 50) { // Cognitive Reserve
                this.drawReserve(ctx, w * 0.5, h * 0.5, '#4fd1c5', t('cog_label_cog_reserve'));
            }
            if (activeEnhancement.id === 51) { // Adult Neurogenesis
                this.drawNewNeurons(ctx, w * 0.5, h * 0.6, '#4fd1c5', t('cog_label_neurogenesis'));
            }
            if (activeEnhancement.id === 52) { // Sensory Critical Periods
                this.drawSensitivityWindow(ctx, w * 0.7, h * 0.5, '#ff9900', t('cog_label_sensory_windows'));
            }
            if (activeEnhancement.id === 53) { // Fluid Intelligence
                this.drawTrajectory(ctx, '#4da6ff', t('cog_label_fluid_peak'));
            }
            if (activeEnhancement.id === 54) { // Crystallized Intelligence
                this.drawGrowthTrajectory(ctx, '#00ff00', t('cog_label_cryst_accum'));
            }
            if (activeEnhancement.id === 55) { // Social Brain
                this.drawNetwork(ctx, '#ff00ff', t('cog_label_social_circuit'));
            }
        },

        drawMirror(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.ellipse(x, y, 30, 40, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 50, y + 60);
        },

        drawPlasticityCompare(ctx, x, y) {
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

        drawLateralization(ctx, x, y) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(x, y - 100);
            ctx.lineTo(x, y + 100);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#4da6ff';
            ctx.fillText(t('cog_label_left_brain'), x - 100, y);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText(t('cog_label_right_brain'), x + 20, y);
        },

        drawStressImpact(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x - 50, y);
            ctx.lineTo(x + 50, y);
            ctx.stroke();
            ctx.fillStyle = color;
            const time = Date.now() * 0.01;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(x - 40 + i * 20, y + Math.sin(time + i) * 10, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillText(label, x - 100, y + 40);
        },

        drawReserve(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.fillStyle = color;
            ctx.fillText(label, x - 80, y + 85);
        },

        drawNetwork(ctx, color, label) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(this.app.canvas.width / 2, this.app.canvas.height / 2, 80, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillText(label, 20, 110);
        },

        drawGridOverlay(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.strokeRect(x + i * 15, y, 10, 10);
                ctx.strokeRect(x, y + i * 15, 10, 10);
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x, y - 10);
        },

        drawMaturation(ctx, x, y, color, label) {
            const time = Date.now() * 0.001;
            const opacity = 0.2 + Math.abs(Math.sin(time)) * 0.5;
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillText(label, x - 50, y + 50);
        },

        drawPiagetianStages(ctx, x, y) {
            const stages = ['Sensorimotor', 'Preoperational', 'Concrete', 'Formal'];
            ctx.font = '10px Arial';
            stages.forEach((s, i) => {
                ctx.fillStyle = (i === 3) ? '#4fd1c5' : '#666';
                ctx.fillText(s, x - 150 + i * 80, y + 100);
                ctx.fillRect(x - 150 + i * 80, y + 110, 60, 5);
            });
            ctx.fillStyle = '#fff';
            ctx.fillText(t('cog_label_piaget_path'), x - 50, y + 135);
        },

        drawSensitivityWindow(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x - 100, y + 50);
            ctx.quadraticCurveTo(x, y - 50, x + 100, y + 50);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 80, y - 20);
        },

        drawBranching(ctx, x, y, color, label) {
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
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 60);
        },

        drawBandwidth(ctx, x1, y1, x2, y2, color, label) {
            const thickness = 2 + Math.sin(Date.now() * 0.01) * 5 + 5;
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.fillStyle = color;
            ctx.fillText(label, (x1 + x2) / 2 - 80, y1 - 20);
        },

        drawGrowthTrajectory(ctx, color, label) {
            const w = 200;
            const h = 100;
            const sx = 400, sy = 250;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy + h);
            ctx.lineTo(sx + w, sy);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, sx, sy - 20);
        },

        drawSynapticGrowth(ctx, x, y, color, label) {
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
            ctx.fillStyle = color;
            ctx.font = 'bold 11px Arial';
            ctx.fillText(label, x - 60, y + 90);
        },

        drawPruning(ctx, x, y, color, label) {
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
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText(label, x - 80, y + 80);
        },

        drawMyelination(ctx, x, y, color, label) {
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
            ctx.fillStyle = color;
            ctx.fillText(label, x - 80, y + 30);
        },

        drawRewardSpike(ctx, x, y, color, label) {
            const h = 20 + Math.abs(Math.sin(Date.now() * 0.01)) * 40;
            ctx.fillStyle = color;
            ctx.fillRect(x - 10, y - h, 20, h);
            ctx.fillText(label, x - 40, y + 20);
        },

        drawVolumeChange(ctx, x, y, color, label) {
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
            ctx.fillText(label, x - 60, y + 70);
        },

        drawDTIFibers(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 100, y - 20 + i * 10);
                ctx.bezierCurveTo(x, y + 50, x, y - 50, x + 100, y - 20 + i * 10);
                ctx.stroke();
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 60);
        },

        drawPulse(ctx, x, y, color, label) {
            const s = 1 + Math.sin(Date.now() * 0.01) * 0.3;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(x, y, 15 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillText(label, x - 40, y + 40);
        },

        drawNewNeurons(ctx, x, y, color, label) {
            const time = Date.now() * 0.005;
            ctx.fillStyle = color;
            for (let i = 0; i < 5; i++) {
                const ox = Math.sin(time + i) * 20;
                const oy = Math.cos(time * 0.7 + i) * 20;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillText(label, x - 50, y + 40);
        },

        drawTrajectory(ctx, color, label) {
            const w = 250;
            const h = 120;
            const sx = 50, sy = 120;

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
            ctx.bezierCurveTo(sx + w*0.3, sy - 20, sx + w*0.6, sy + 20, sx + w, sy + h - 40);
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = 'bold 11px Arial';
            ctx.fillText(label, sx + 10, sy + 10);
            ctx.font = '9px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('0 yrs', sx - 10, sy + h + 15);
            ctx.fillText('80 yrs', sx + w - 10, sy + h + 15);
        }
    };

    window.GreenhouseCognitionDevelopment = GreenhouseCognitionDevelopment;
})();
