/**
 * @file inflammation_macro.js
 * @description Macro-level (Brain) rendering logic for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationMacro = {
        render(ctx, state, camera, projection, ui3d) {
            if (!ui3d.brainShell || !window.GreenhouseNeuroBrain) return;
            const tone = state.metrics.inflammatoryTone;
            const Math3D = window.GreenhouseModels3DMath;

            // 1. Shift colors of regions based on tone
            const regions = ui3d.brainShell.regions;
            for (const key in regions) {
                const safeTone = isNaN(tone) ? 0.02 : tone;
                if (safeTone > 0.4) {
                    const r = Math.min(255, 100 + safeTone * 255);
                    const g = 150 * (1 - safeTone);
                    const b = 255 * (1 - safeTone);
                    const a = 0.4 + safeTone * 0.4;
                    regions[key].color = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
                } else {
                    regions[key].color = ui3d.originalRegionColors[key] || 'rgba(100, 150, 255, 0.4)';
                }
            }

            // 2. Main Brain Draw
            window.GreenhouseNeuroBrain.drawBrainShell(ctx, ui3d.brainShell, camera, projection, projection.width, projection.height);

            // 3. BBB Integrity Shield visualization
            const bbb = state.metrics.bbbIntegrity;
            if (bbb < 0.9) {
                ctx.save();
                ctx.strokeStyle = `rgba(255, 50, 0, ${0.5 * (1 - bbb)})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 5]);
                ui3d.brainShell.vertices.forEach((v, i) => {
                    if (i % 20 === 0) {
                        const p = Math3D.project3DTo2D(v.x * 1.1, v.y * 1.1, v.z * 1.1, camera, projection);
                        if (p.scale > 0) {
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                });
                ctx.restore();
            }

            // 4. Draw Floating Region Labels
            if (ui3d.brainShell.regions) {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (const key in ui3d.brainShell.regions) {
                    const region = ui3d.brainShell.regions[key];
                    if (region.centroid) {
                        const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                        if (p.scale > 0 && p.depth < 0.7) {
                            const alpha = Math3D.applyDepthFog(0.9, p.depth, 0.3, 0.8);
                            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                            ctx.font = 'bold 12px Quicksand, sans-serif';
                            ctx.shadowBlur = 4;
                            ctx.shadowColor = 'rgba(0, 0, 0, 1)';
                            ctx.fillText(t(region.name), p.x, p.y);
                        }
                    }
                }
                ctx.restore();
            }
        }
    };

    window.GreenhouseInflammationMacro = GreenhouseInflammationMacro;
})();
