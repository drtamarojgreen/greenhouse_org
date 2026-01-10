// docs/js/synapse_elements.js
// Visual definitions and drawing functions for the Synapse Visualization

(function () {
    'use strict';

    const config = {
        // High-Contrast & Semantic Color System
        backgroundColor: '#F8F9FA', // Light, clean background
        // Structures (Warm, Organic)
        preSynapticColor: '#A1887F', // Softer, earthy brown
        postSynapticColor: '#795548', // Darker, grounded brown
        // Vesicles (Action-oriented, but not harsh)
        vesicleColor: '#FFAB91', // Soft coral
        // Neurotransmitters & Signals (Clear & Informative)
        neurotransmitterColor: { r: 255, g: 138, b: 101 }, // Coral color for particles
        neuromodulatorColor: { r: 129, g: 212, b: 250 }, // Soft blue
        // Receptors (Distinct & Functional)
        ionChannelColor: '#4DB6AC', // Muted Teal
        gpcrColor: '#7986CB', // Indigo
        // Blockers (Warning, but accessible)
        blockerColor: '#E57373', // Soft Red
        // UI & Text
        titleFont: 'bold 24px "Helvetica Neue", Arial, sans-serif',
        titleColor: '#212529', // High-contrast black
        labelFont: '14px "Helvetica Neue", Arial, sans-serif',
        labelColor: '#495057',
        tooltipBg: 'rgba(33, 37, 41, 0.85)',
        tooltipColor: '#FFFFFF',

        translations: {
            // Tooltips
            preSynapticTerminal: { en: 'Pre-Synaptic Terminal', es: 'Terminal Presináptica' },
            postSynapticTerminal: { en: 'Post-Synaptic Terminal', es: 'Terminal Postsináptica' },
            vesicle: { en: 'Vesicle', es: 'Vesícula' },
            ionChannel: { en: 'Ion Channel', es: 'Canal Iónico' },
            gpcr: { en: 'G-protein Coupled Receptor', es: 'Receptor acoplado a proteína G' },
            calciumBlocker: { en: 'Calcium Channel Blocker', es: 'Bloqueador de Canal de Calcio' },
            // Title
            synapticCleft: { en: 'Synaptic Cleft Visualization', es: 'Visualización de la Hendidura Sináptica' },
            // Legend
            legendTitle: { en: 'Legend', es: 'Leyenda' },
            legendNeurotransmitter: { en: 'Neurotransmitter', es: 'Neurotransmisor' },
            legendNeuromodulator: { en: 'Neuromodulator', es: 'Neuromodulador' },
            // Tour
            tourStep1: { en: 'This is the Pre-Synaptic Terminal, where neurotransmitters are stored.', es: 'Esta es la Terminal Presináptica, donde se almacenan los neurotransmisores.' },
            tourStep2: { en: 'Neurotransmitters travel across the Synaptic Cleft.', es: 'Los neurotransmisores viajan a través de la Hendidura Sináptica.' },
            tourStep3: { en: 'They bind to receptors on the Post-Synaptic Terminal.', es: 'Se unen a los receptores en la Terminal Postsináptica.' },
            tourEnd: { en: 'Exploration mode activated.', es: 'Modo de exploración activado.' }
        },
        vesicles: [
            { id: 'vesicle', x: 0.2, y: 0.2, r: 15 },
            { id: 'vesicle', x: 0.5, y: 0.15, r: 20 },
            { id: 'vesicle', x: 0.8, y: 0.25, r: 18 }
        ],
        ionChannels: [
            { id: 'ionChannel', x: 0.2 },
            { id: 'ionChannel', x: 0.6 }
        ],
        gpcrs: [
            { id: 'gpcr', x: 0.4 },
            { id: 'gpcr', x: 0.8 }
        ],
        calciumBlockers: [
            { id: 'calciumBlocker', x: 0.2 }
        ]
    };

    const SynapseElements = {
        config: config,

        drawParticles(app, ctx, particles) {
            ctx.save();
            particles.forEach(p => {
                const alpha = p.life > 0.5 ? 1 : p.life * 2;
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawCalciumBlockers(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.strokeStyle = '#FFC107';
            ctx.lineWidth = 2;
            config.calciumBlockers.forEach(x => {
                const centerX = w * x;
                const centerY = h * 0.6 - 15;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - 8);
                ctx.lineTo(centerX + 8, centerY + 8);
                ctx.lineTo(centerX - 8, centerY + 8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
            ctx.restore();
        },

        drawPreSynapticTerminal(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);

            const gradient = ctx.createRadialGradient(w / 2, h * 0.3, 50, w / 2, h * 0.3, 300);
            gradient.addColorStop(0, '#556270');
            gradient.addColorStop(1, config.preSynapticColor);

            ctx.beginPath();
            ctx.moveTo(0, h * 0.4);
            ctx.bezierCurveTo(w * 0.25, h * 0.3, w * 0.75, h * 0.3, w, h * 0.4);
            ctx.lineTo(w, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = config.postSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawPostSynapticTerminal(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);

            const gradient = ctx.createRadialGradient(w / 2, h * 0.7, 50, w / 2, h * 0.7, 300);
            gradient.addColorStop(0, '#607D8B');
            gradient.addColorStop(1, config.postSynapticColor);

            ctx.beginPath();
            ctx.moveTo(0, h * 0.6);
            ctx.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.7, w, h * 0.6);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = config.preSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawVesicles(ctx, w, h, offsetX, offsetY, scale) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = config.vesicleColor;
            config.vesicles.forEach(v => {
                ctx.beginPath();
                ctx.arc(w * v.x, h * v.y, v.r * scale, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawIonChannels(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = config.ionChannelColor;
            config.ionChannels.forEach(x => {
                ctx.fillRect(w * x - 10, h * 0.6 - 15, 20, 15);
            });
            ctx.restore();
        },

        drawGPCRs(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.strokeStyle = config.gpcrColor;
            ctx.lineWidth = 4;
            config.gpcrs.forEach(g => {
                ctx.beginPath();
                ctx.moveTo(w * g.x - 15, h * 0.6);
                ctx.bezierCurveTo(w * g.x - 5, h * 0.6 - 10, w * g.x + 5, h * 0.6 - 10, w * g.x + 15, h * 0.6);
                ctx.stroke();
            });
            ctx.restore();
        },

        drawNeuromodulationWave(app, ctx) {
            if (!app.neuromodulationWave) return;

            const wave = app.neuromodulationWave;
            wave.radius += 5; // Expansion speed
            const alpha = 1 - (wave.radius / 300); // Fade out as it expands

            if (alpha <= 0) {
                app.neuromodulationWave = null;
                return;
            }

            ctx.save();
            const gradient = ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, wave.radius);
            gradient.addColorStop(0, `rgba(129, 212, 250, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(129, 212, 250, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        },

        drawLegend(app, ctx) {
            const { config } = this;
            const { translations, labelFont, labelColor } = config;
            const lang = app.currentLanguage;

            const legendX = 20;
            const legendY = 400;
            const itemHeight = 25;

            ctx.save();
            ctx.font = 'bold 16px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = labelColor;
            ctx.fillText(translations.legendTitle[lang], legendX, legendY);

            ctx.font = labelFont;

            // Neurotransmitter
            ctx.fillStyle = `rgb(${config.neurotransmitterColor.r}, ${config.neurotransmitterColor.g}, ${config.neurotransmitterColor.b})`;
            ctx.beginPath();
            ctx.arc(legendX + 10, legendY + itemHeight, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = labelColor;
            ctx.fillText(translations.legendNeurotransmitter[lang], legendX + 25, legendY + itemHeight + 5);

            // Neuromodulator
            ctx.fillStyle = `rgb(${config.neuromodulatorColor.r}, ${config.neuromodulatorColor.g}, ${config.neuromodulatorColor.b})`;
            ctx.beginPath();
            ctx.arc(legendX + 10, legendY + itemHeight * 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = labelColor;
            ctx.fillText(translations.legendNeuromodulator[lang], legendX + 25, legendY + itemHeight * 2 + 5);

            ctx.restore();
        }
    };

    window.SynapseElements = SynapseElements;
})();
