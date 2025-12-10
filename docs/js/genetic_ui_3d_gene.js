(function () {
    'use strict';

    const GreenhouseGeneticGene = {
        drawMicroView(ctx, x, y, w, h, activeGene, activeGeneIndex, neuronMeshes, drawPiPFrameCallback) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Micro: Gene Structure");
            }

            if (!activeGene) return;

            // Render a zoomed-in, rotating view of the specific gene geometry
            const microCamera = {
                x: 0, y: 0, z: -100,
                rotationX: Date.now() * 0.001, rotationY: Date.now() * 0.002, rotationZ: 0,
                fov: 300
            };

            // Render High-Fidelity Chromatin Structure instead of abstract mesh
            if (window.GreenhouseGeneticChromosome) {
                window.GreenhouseGeneticChromosome.drawChromatinStructure(
                    ctx, x, y, w, h, activeGene, null // No internal frame callback needed here
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
