/**
 * @file stress_systemic.js
 * @description Advanced Systemic Visualization: Featuring a central 3D Resilience geometry.
 */

(function () {
    'use strict';

    const GreenhouseStressSystemic = {
        nodes: [
            { id: 'bio', label: 'BIO: METABOLISM', color: '#ff4d4d', angle: 0 },
            { id: 'logic', label: 'LOGIC: FEEDBACK', color: '#ffcc00', angle: (Math.PI * 2) / 5 },
            { id: 'pharma', label: 'PHARMA: MODULATION', color: '#64d2ff', angle: (2 * Math.PI * 2) / 5 },
            { id: 'psych', label: 'PSYCH: COGNITION', color: '#00ff99', angle: (3 * Math.PI * 2) / 5 },
            { id: 'philo', label: 'PHILO: EXISTENCE', color: '#a18cd1', angle: (4 * Math.PI * 2) / 5 }
        ],
        crystalMesh: null,

        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const Geo = window.GreenhouseNeuroGeometry;
            if (!this.crystalMesh && Geo) this.crystalMesh = Geo.generateSphere(80, 8); // Low-poly crystal look

            const m = state.metrics;
            const f = state.factors;
            const reserve = m.resilienceReserve || 1.0;
            const load = m.allostaticLoad || 0;
            const time = state.time || 0;

            camera.rotationY += 0.003;

            // 1. Central 3D Resilience Crystal
            const cp = Math3D.project3DTo2D(0, 0, 0, camera, projection);
            if (cp.scale > 0 && this.crystalMesh) {
                this.drawCrystal(ctx, this.crystalMesh, cp, reserve, load);
            }

            // 2. Orbital Factor Nodes
            const radius = 220 * (0.7 + reserve * 0.3);
            const currentNodes = this.nodes.map(n => {
                const existential = f.financialStrain || 0;
                const yOffset = n.id === 'philo' ? -50 * existential : 0;
                const jitter = (n.id === 'bio' ? Math.random() : 0) * load * 10;

                const angle = n.angle + time * 0.0005;
                const x = Math.cos(angle) * radius + jitter;
                const y = Math.sin(angle) * (radius * 0.4) + yOffset;
                const z = Math.sin(angle) * radius;
                const p = Math3D.project3DTo2D(x, y, z, camera, projection);
                return { ...n, ...p };
            });

            // Logical Interconnects
            ctx.save();
            ctx.lineWidth = 1.0;
            for (let i = 0; i < currentNodes.length; i++) {
                for (let j = i + 1; j < currentNodes.length; j++) {
                    const n1 = currentNodes[i], n2 = currentNodes[j];
                    if (n1.scale <= 0 || n2.scale <= 0) continue;
                    ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y);
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 * n1.scale})`;
                    ctx.stroke();
                }
            }
            ctx.restore();

            // Render Nodes
            currentNodes.forEach(n => {
                if (n.scale <= 0) return;
                ctx.fillStyle = n.color;
                ctx.beginPath(); ctx.arc(n.x, n.y, 8 * n.scale, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
                ctx.fillText(n.label, n.x, n.y + 20 * n.scale);
            });
        },

        drawCrystal(ctx, mesh, proj, reserve, load) {
            ctx.save();
            ctx.translate(proj.x, proj.y);

            const scale = proj.scale * (0.8 + reserve * 0.4);
            mesh.faces.forEach(f => {
                const v1 = mesh.vertices[f[0]], v2 = mesh.vertices[f[1]], v3 = mesh.vertices[f[2]];

                // Jitter effect for high load
                const jitter = (Math.random() - 0.5) * load * 5;

                ctx.beginPath();
                ctx.fillStyle = `rgba(100, 255, 230, ${0.15 + reserve * 0.2})`;
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + reserve * 0.3})`;
                ctx.moveTo((v1.x + jitter) * scale, (v1.y + jitter) * scale);
                ctx.lineTo((v2.x + jitter) * scale, (v2.y + jitter) * scale);
                ctx.lineTo((v3.x + jitter) * scale, (v3.y + jitter) * scale);
                ctx.fill();
                ctx.stroke();
            });

            // Core Pulse
            const pulse = 1.0 + Math.sin(Date.now() * 0.002) * 0.1;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * scale * pulse);
            grad.addColorStop(0, `rgba(255, 255, 255, ${0.3 * reserve})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, 60 * scale * pulse, 0, Math.PI * 2); ctx.fill();

            ctx.restore();
        }
    };

    window.GreenhouseStressSystemic = GreenhouseStressSystemic;
})();
