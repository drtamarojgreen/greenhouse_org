// docs/js/synapse_elements.js
// Visual definitions and drawing functions for the Synapse Visualization

(function () {
    'use strict';

    const config = {
        backgroundColor: '#101018',
        preSynapticColor: '#2c3e50',
        postSynapticColor: '#34495e',
        vesicleColor: '#e67e22',
        ionChannelColor: '#3498db',
        gpcrColor: '#9b59b6',
        titleFont: 'bold 20px "Courier New", Courier, monospace',
        titleColor: '#9E9E9E',
        labelFont: '12px "Courier New", Courier, monospace',
        labelColor: '#ecf0f1',
        tooltipBg: 'rgba(0, 0, 0, 0.7)',
        tooltipColor: '#ffffff',
        translations: {
            preSynapticTerminal: { en: 'Pre-Synaptic Terminal', es: 'Terminal Presináptica' },
            postSynapticTerminal: { en: 'Post-Synaptic Terminal', es: 'Terminal Postsináptica' },
            vesicle: { en: 'Vesicle', es: 'Vesícula' },
            ionChannel: { en: 'Ion Channel', es: 'Canal Iónico' },
            gpcr: { en: 'G-protein Coupled Receptor', es: 'Receptor acoplado a proteína G' },
            synapticCleft: { en: 'Synaptic Cleft Visualization', es: 'Visualización de la Hendidura Sináptica' },
            calciumBlocker: { en: 'Calcium Channel Blocker', es: 'Bloqueador de Canal de Calcio' }
        },
        vesicles: [
            { id: 'vesicle', x: 0.2, y: 0.2, r: 15 },
            { x: 0.5, y: 0.15, r: 20 },
            { x: 0.8, y: 0.25, r: 18 }
        ],
        ionChannels: [0.2, 0.6],
        gpcrs: [0.4, 0.8],
        calciumBlockers: [0.2] // Positioned over the first ion channel
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
            config.gpcrs.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(w * x - 15, h * 0.6);
                ctx.bezierCurveTo(w * x - 5, h * 0.6 - 10, w * x + 5, h * 0.6 - 10, w * x + 15, h * 0.6);
                ctx.stroke();
            });
            ctx.restore();
        }
    };

    window.SynapseElements = SynapseElements;
})();
