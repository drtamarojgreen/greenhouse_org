/**
 * @file stress_pathway.js
 * @description Enhanced HPA-Axis Visualization with Logical Feedback Loops and Pharmacological Modulation.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressPathway = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const load = state.metrics.allostaticLoad;
            const f = state.factors;
            const time = state.time || 0;

            camera.rotationY += 0.002;

            const projectedNodes = ui3d.hpaNodes.map(node => {
                // Biological stress causes the hypothalamus to "throb"
                let scaleIn = 1.0;
                if (node.id === 'hypothalamus') scaleIn = 1 + Math.sin(time * 0.005) * 0.1 * load;

                const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                return { ...node, ...p, scaleIn };
            });

            // 1. Draw Feed-Forward Connections (Hormonal Cascade)
            ctx.save();
            for (let i = 0; i < projectedNodes.length - 1; i++) {
                const n1 = projectedNodes[i];
                const n2 = projectedNodes[i + 1];
                if (n1.scale <= 0 || n2.scale <= 0) continue;

                // Connection thickness reflects stress intensity damped by Pharma
                const signalStrength = (f.stressorIntensity * 1.5) * (1 - (f.gabaMod || 0) * 0.5);
                ctx.lineWidth = 2 + signalStrength * 6;

                const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
                grad.addColorStop(0, n1.color);
                grad.addColorStop(1, n2.color);

                ctx.beginPath();
                ctx.strokeStyle = grad;
                ctx.globalAlpha = 0.3 + load * 0.7;
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                // Animated Hormone signals
                const signalCount = Math.floor(3 + load * 15);
                for (let s = 0; s < signalCount; s++) {
                    const progress = ((time * 0.002 + s / signalCount) % 1.0);
                    const sx = n1.x + (n2.x - n1.x) * progress;
                    const sy = n1.y + (n2.y - n1.y) * progress;
                    const ss = 2 * n1.scale * (1 + load);

                    ctx.beginPath();
                    ctx.fillStyle = '#fff';
                    ctx.arc(sx, sy, ss, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();

            // 2. Draw LOGICAL Feedback Loops (Negative Feedback)
            // Cortisol from Adrenals should inhibit Pituitary/Hypothalamus
            const adrenal = projectedNodes.find(n => n.id === 'adrenals');
            const hypothalamus = projectedNodes.find(n => n.id === 'hypothalamus');
            if (adrenal && hypothalamus && adrenal.scale > 0 && hypothalamus.scale > 0) {
                ctx.save();
                ctx.setLineDash([5, 10]);
                ctx.lineWidth = 1;
                // Feedback is "broken" or "insensitive" if allostatic load is high
                const feedbackIntegrity = Math.max(0, 1 - load * 1.2 + (f.cognitiveReframing || 0) * 0.5);
                ctx.strokeStyle = `rgba(255, 100, 100, ${0.8 * feedbackIntegrity})`;

                // Curve the feedback line to distinguish from cascade
                const cp1 = { x: (adrenal.x + hypothalamus.x) / 2 + 100, y: (adrenal.y + hypothalamus.y) / 2 };
                ctx.beginPath();
                ctx.moveTo(adrenal.x, adrenal.y);
                ctx.quadraticCurveTo(cp1.x, cp1.y, hypothalamus.x, hypothalamus.y);
                ctx.stroke();

                // Feedback pulses flowing UPWARDS
                if (feedbackIntegrity > 0.1) {
                    const fProgress = (time * 0.001) % 1.0;
                    const fx = Math.pow(1 - fProgress, 2) * adrenal.x + 2 * (1 - fProgress) * fProgress * cp1.x + Math.pow(fProgress, 2) * hypothalamus.x;
                    const fy = Math.pow(1 - fProgress, 2) * adrenal.y + 2 * (1 - fProgress) * fProgress * cp1.y + Math.pow(fProgress, 2) * hypothalamus.y;
                    ctx.fillStyle = '#ff8888';
                    ctx.beginPath(); ctx.arc(fx, fy, 4 * adrenal.scale, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }

            // 3. Draw Nodes (Biological glands with receptors)
            projectedNodes.forEach(node => {
                if (node.scale <= 0) return;
                const size = 18 * node.scale * node.scaleIn;

                ctx.save();
                // Glow if active
                const activity = node.id === 'adrenals' ? load : (f.stressorIntensity * (1 - (f.gabaMod || 0)));
                const glowSize = Math.max(0.1, size * (1.2 + activity * 0.8));
                const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
                g.addColorStop(0, node.color + '88');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2); ctx.fill();

                // Solid Core
                ctx.beginPath();
                ctx.fillStyle = node.color;
                ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Biological "Receptors" (dots on the surface)
                const receptorCount = 6;
                for (let r = 0; r < receptorCount; r++) {
                    const ang = (r / receptorCount) * Math.PI * 2 + time * 0.001;
                    const rx = node.x + Math.cos(ang) * size;
                    const ry = node.y + Math.sin(ang) * size;
                    // Color shifts based on cognitive reframing
                    ctx.fillStyle = (f.cognitiveReframing || 0) > 0.6 ? '#33ffaa' : '#ffffff';
                    ctx.beginPath(); ctx.arc(rx, ry, 2 * node.scale, 0, Math.PI * 2); ctx.fill();
                }

                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.round(11 * node.scale)}px Quicksand, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(t(node.label).toUpperCase(), node.x, node.y + size + 15);
                ctx.restore();
            });
        }
    };

    window.GreenhouseStressPathway = GreenhouseStressPathway;
})();
