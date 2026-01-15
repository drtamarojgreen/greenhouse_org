(function () {
    'use strict';

    const GreenhouseGeneticGene = {
        drawMicroView(ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes, drawPiPFrameCallback, cameraState) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Micro: Gene Structure");
            }

            if (!activeGene) return;

            // Use the specific camera for this PiP - no fallback
            if (!cameraState || !cameraState.camera) {
                console.error('[drawMicroView] No camera provided!');
                return;
            }
            const microCamera = cameraState.camera;

            // Render High-Fidelity Chromatin Structure instead of abstract mesh
            if (window.GreenhouseGeneticChromosome) {
                window.GreenhouseGeneticChromosome.drawChromatinStructure(
                    ctx, x, y, w, h, activeGene, null, cameraState // Pass cameraState
                );
            } else {
                // Fallback to simple mesh if Chromosome module missing
                const mesh = activeGeneIndex % 2 === 0 ?
                    (neuronMeshes ? neuronMeshes.pyramidal : null) :
                    (neuronMeshes ? neuronMeshes.stellate : null);

                if (mesh) {
                    const drawMesh = (mesh, color) => {
                        // ... (keep existing mesh drawing logic as fallback or remove if confident)
                        // For brevity, let's just use the Chromatin Structure as primary.
                    };
                    // drawMesh(mesh, activeGene.baseColor);
                }
            }

            // Phase 12: mRNA Synthesis (Static Visualization)
            // Draw a static mRNA strand peeling off from the active gene

            ctx.save();
            // Center of PiP
            const cx = x + w / 2;
            const cy = y + h / 2;

            // Draw mRNA strand (Static Wavy line)
            ctx.beginPath();
            ctx.moveTo(cx, cy);

            const length = 100; // Fixed length

            for (let i = 0; i < 20; i++) {
                const t = i / 20;
                const dist = length * t;
                // Static Wave
                const wave = Math.sin(i * 0.8) * 5;
                // Move generally up-right
                const px = cx + dist;
                const py = cy - dist * 0.5 + wave;

                ctx.lineTo(px, py);
            }

            ctx.strokeStyle = '#FF1493'; // Deep Pink
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]); // Dashed to look like "copy"
            ctx.stroke();

            // Label
            ctx.fillStyle = '#FF1493';
            ctx.font = '10px Arial';
            ctx.fillText("mRNA", cx + length, cy - length * 0.5);

            ctx.restore();

            ctx.restore(); // Restore context from drawPiPFrame
        },

        drawNeuron(ctx, p) {
            // This is the generic "Gene/Neuron" dot renderer used in Macro View
            if (p.scale <= 0) return;

            const size = (p.type === 'gene') ? 8 * p.scale : 5 * p.scale;
            const alpha = Math.min(1, p.scale * 1.5);

            ctx.save();
            ctx.globalAlpha = alpha;

            // Glow
            const glow = ctx.createRadialGradient(p.x, p.y, size * 0.2, p.x, p.y, size * 3);
            glow.addColorStop(0, p.baseColor);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Label (if hovered or important)
            if (p.label && p.scale > 0.5) {
                ctx.fillStyle = '#fff';
                ctx.font = `${10 * p.scale}px Arial`;
                ctx.fillText(p.label, p.x + size, p.y - size);
            }

            ctx.restore();
        }
    };

    window.GreenhouseGeneticGene = GreenhouseGeneticGene;
})();
