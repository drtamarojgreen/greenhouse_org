/**
 * @file stress_systemic.js
 * @description Advanced Systemic Visualization: Mapping Biological, Logical, Pharmacological, Psychological, and Philosophical stress.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressSystemic = {
        nodes: [
            { id: 'bio', label: 'BIO: METABOLISM', color: '#ff4d4d', angle: 0 },
            { id: 'logic', label: 'LOGIC: FEEDBACK', color: '#ffcc00', angle: (Math.PI * 2) / 5 },
            { id: 'pharma', label: 'PHARMA: MODULATION', color: '#64d2ff', angle: (2 * Math.PI * 2) / 5 },
            { id: 'psych', label: 'PSYCH: COGNITION', color: '#00ff99', angle: (3 * Math.PI * 2) / 5 },
            { id: 'philo', label: 'PHILO: EXISTENCE', color: '#a18cd1', angle: (4 * Math.PI * 2) / 5 }
        ],

        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            if (!Math3D) return;

            const m = state.metrics;
            const f = state.factors;
            const reserve = m.resilienceReserve;
            const load = m.allostaticLoad;
            const time = state.time || 0;

            ctx.save();
            camera.rotationY += 0.003; // Slow, deliberate rotation

            const radius = 150 * (0.8 + reserve * 0.4);
            const center3D = { x: 0, y: 0, z: 0 };
            const center2D = Math3D.project3DTo2D(center3D.x, center3D.y, center3D.z, camera, projection);

            // Calculate current node positions in 3D
            const currentNodes = this.nodes.map(n => {
                // Mapping new factors or using safe fallbacks (0)
                const existential = f.financialStrain || 0;
                const yOffset = n.id === 'philo' ? -50 * existential : 0;
                // Biological stress makes nodes vibrate
                const jitter = (n.id === 'bio' ? Math.random() : 0) * load * 10;

                const x = Math.cos(n.angle + time * 0.0005) * radius + jitter;
                const y = Math.sin(n.angle + time * 0.0005) * (radius * 0.5) + yOffset;
                const z = Math.sin(n.angle + time * 0.0005) * radius;

                const p = Math3D.project3DTo2D(x, y, z, camera, projection);
                return { ...n, ...p, x3: x, y3: y, z3: z };
            });

            // 1. Draw Logical Interconnects (The Web of Being)
            ctx.lineWidth = 1.5;
            for (let i = 0; i < currentNodes.length; i++) {
                for (let j = i + 1; j < currentNodes.length; j++) {
                    const n1 = currentNodes[i];
                    const n2 = currentNodes[j];
                    if (n1.scale <= 0 || n2.scale <= 0) continue;

                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);

                    // Threads "fray" (become dotted) if resilience is low
                    if (reserve < 0.3) ctx.setLineDash([2, 4]);
                    else ctx.setLineDash([]);

                    // Tension color (Logically map stress to thread heat)
                    const tension = (load * 0.8) + (Math.random() * 0.2 * load);
                    ctx.strokeStyle = `rgba(${255 * tension}, ${Math.round(200 * (1 - tension))}, 255, ${0.4 * n1.scale})`;
                    ctx.stroke();
                }
            }
            ctx.setLineDash([]);

            // 2. Draw Nodes (Biological & Pharmacological centers)
            currentNodes.forEach(n => {
                if (n.scale <= 0) return;

                // Pharma modulation creates an outer "shield" glow
                if (n.id === 'pharma') {
                    const pharmaSize = 40 * n.scale * (1 + (f.gabaMod || 0));
                    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pharmaSize);
                    grad.addColorStop(0, n.color + '66');
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(n.x, n.y, pharmaSize, 0, Math.PI * 2); ctx.fill();
                }

                const size = 15 * n.scale * (1 + load * 0.5);
                ctx.beginPath();
                ctx.fillStyle = n.color;
                ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Logical pulse
                if (Math.random() > 0.95) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(n.x, n.y, size * 1.5, 0, Math.PI * 2); ctx.stroke();
                }

                // Labels
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.round(9 * n.scale)}px Quicksand, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(n.label, n.x, n.y + size + 15);
            });

            // 3. Central "Allostatic Homeostasis" Pulse
            if (center2D.scale > 0) {
                const pulse = Math.sin(time * 0.002) * 20 + 40;
                const grad = ctx.createRadialGradient(center2D.x, center2D.y, 0, center2D.x, center2D.y, pulse * center2D.scale);
                grad.addColorStop(0, `rgba(255, 255, 255, ${0.1 * (1 - load)})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(center2D.x, center2D.y, pulse * center2D.scale, 0, Math.PI * 2); ctx.fill();
            }

            // 4. Philosophical Decay (Particles falling from the Philo node)
            if (f.existentialWeight > 0.4) {
                const philo = currentNodes.find(n => n.id === 'philo');
                if (philo && philo.scale > 0) {
                    for (let p = 0; p < 3; p++) {
                        const dripY = philo.y + (time * 0.1 + p * 20) % 100;
                        ctx.fillStyle = `rgba(161, 140, 209, ${0.5 * (1 - ((dripY - philo.y) / 100))})`;
                        ctx.beginPath(); ctx.arc(philo.x + Math.sin(time * 0.01 + p) * 10, dripY, 2, 0, Math.PI * 2); ctx.fill();
                    }
                }
            }

            ctx.restore();
        }
    };

    window.GreenhouseStressSystemic = GreenhouseStressSystemic;
})();
