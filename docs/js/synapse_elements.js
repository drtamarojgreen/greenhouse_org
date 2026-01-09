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
            synapticCleft: { en: 'Synaptic Cleft Visualization', es: 'Visualización de la Hendidura Sináptica' }
        },
        vesicles: [
            { id: 'vesicle', x: 0.2, y: 0.2, r: 15 },
            { x: 0.5, y: 0.15, r: 20 },
            { x: 0.8, y: 0.25, r: 18 }
        ],
        ionChannels: [0.2, 0.6],
        gpcrs: [0.4, 0.8]
    };

    const SynapseElements = {
        config: config,

        drawPreSynapticTerminal(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.beginPath();
            ctx.moveTo(0, h * 0.4);
            ctx.bezierCurveTo(w * 0.25, h * 0.3, w * 0.75, h * 0.3, w, h * 0.4);
            ctx.lineTo(w, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = config.preSynapticColor;
            ctx.fill();

            ctx.strokeStyle = config.postSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawPostSynapticTerminal(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.beginPath();
            ctx.moveTo(0, h * 0.6);
            ctx.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.7, w, h * 0.6);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = config.postSynapticColor;
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
