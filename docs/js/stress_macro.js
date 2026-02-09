/**
 * @file stress_macro.js
 * @description Macro-level (Regulatory) rendering logic for the Stress Dynamics Simulation.
 * Features anatomically corrected labels and dynamic biological state integration.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressMacro = {
        render(ctx, state, camera, projection, ui3d) {
            if (!ui3d.brainShell) return;

            const Math3D = window.GreenhouseModels3DMath;
            const m = state.metrics;
            const f = state.factors;

            ctx.save();

            const load = m.allostaticLoad || 0;
            const intensity = f.stressorIntensity || 0;
            const buffering = (f.cognitiveReframing || 0) * 0.5 + (f.socialBuffering || 0) * 0.3;

            // 1. Dynamic Regional State Calculation
            const regions = ui3d.brainShell.regions;
            for (const key in regions) {
                const k = key.toLowerCase();
                const isPFC = k.includes('pfc') || k.includes('frontal');
                const isAmygdala = k.includes('amygdala');
                const isHippo = k.includes('hippocampus');

                if (isAmygdala) {
                    const activity = Math.min(1.0, intensity * 1.6 + load * 0.6);
                    const r = 200 + activity * 55;
                    const g = 100 * (1 - activity);
                    const b = 50 * (1 - activity);
                    regions[key].color = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${0.5 + activity * 0.4})`;
                } else if (isPFC) {
                    const control = Math.max(0.05, (1 - load * 1.5) - (intensity * 0.4) + buffering);
                    const r = Math.round(40 * (1 - control));
                    const g = Math.round(120 + control * 135);
                    const b = 255;
                    regions[key].color = `rgba(${r}, ${g}, ${b}, ${0.4 + control * 0.5})`;
                } else if (isHippo) {
                    const health = Math.max(0.1, 1 - load);
                    regions[key].color = `rgba(100, ${Math.round(200 * health)}, 150, ${0.4 + health * 0.3})`;
                } else {
                    regions[key].color = ui3d.originalRegionColors[key] || 'rgba(120, 130, 140, 0.2)';
                }
            }

            // 2. PREMIUM RENDERER OVERRIDE
            // We implement custom drawing here for better lighting/aesthetics than the shared loader
            this.drawEliteBrain(ctx, ui3d.brainShell, camera, projection);

            // 3. Anatomically Correct Floating Labels
            if (ui3d.brainShell.regions) {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Compensation for shared space
                const camForward = {
                    x: Math.sin(camera.rotationY) * Math.cos(camera.rotationX),
                    y: Math.sin(camera.rotationX),
                    z: Math.cos(camera.rotationY) * Math.cos(camera.rotationX)
                };

                for (const key in ui3d.brainShell.regions) {
                    const region = ui3d.brainShell.regions[key];
                    if (region.centroid && key !== 'cortex') {
                        const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                        const dot = (region.centroid.x * camForward.x + (-region.centroid.y) * camForward.y + region.centroid.z * camForward.z);

                        if (p.scale > 0 && dot > 0) {
                            const alpha = Math3D.applyDepthFog(0.9, p.depth, 0.4, 0.9);
                            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                            ctx.font = 'bold 11px Quicksand, sans-serif';
                            ctx.shadowBlur = 6;
                            ctx.shadowColor = 'rgba(0,0,0,1)';

                            // Visual Anchor Line
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p.x + (p.x < projection.width / 2 ? -20 : 20), p.y - 15);
                            ctx.stroke();

                            ctx.fillText(t(region.name).toUpperCase(), p.x + (p.x < projection.width / 2 ? -40 : 40), p.y - 20);
                        }
                    }
                }
            }
            ctx.restore();
        },

        drawEliteBrain(ctx, shell, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const lightDir = { x: 0.6, y: -0.8, z: 1.0 }; // Brighter, more dramatic lighting
            const len = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            const projected = shell.vertices.map(v => Math3D.project3DTo2D(v.x, -v.y, v.z, camera, projection));

            const faces = [];
            shell.faces.forEach((face, idx) => {
                const p1 = projected[face.indices[0]];
                const p2 = projected[face.indices[1]];
                const p3 = projected[face.indices[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const cp = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
                    if (cp > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;
                        faces.push({ face, p1, p2, p3, depth });
                    }
                }
            });

            faces.sort((a, b) => b.depth - a.depth);

            faces.forEach(f => {
                const v1 = shell.vertices[f.face.indices[0]];
                const diffuse = Math.max(0.15, v1.normal.x * lightDir.x + v1.normal.y * lightDir.y + v1.normal.z * lightDir.z);

                let r = 150, g = 150, b = 150, a = 0.2;
                const region = shell.regions[v1.region];

                if (region) {
                    const match = region.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (match) {
                        r = parseInt(match[1]); g = parseInt(match[2]); b = parseInt(match[3]);
                        a = parseFloat(match[4] || 1);
                    }
                }

                const fog = Math3D.applyDepthFog(a, f.depth, 0.2, 1.0);
                const litR = Math.min(255, r * (diffuse + 0.2));
                const litG = Math.min(255, g * (diffuse + 0.2));
                const litB = Math.min(255, b * (diffuse + 0.2));

                ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();

                // Subtle wireframe for regions
                if (v1.region !== 'cortex' && fog > 0.3) {
                    ctx.strokeStyle = `rgba(255,255,255,${0.05 * fog})`;
                    ctx.stroke();
                }
            });
        }
    };

    window.GreenhouseStressMacro = GreenhouseStressMacro;
})();
