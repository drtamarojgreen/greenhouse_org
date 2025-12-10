(function () {
    'use strict';

    const GreenhouseGeneticProtein = {
        drawProteinView(ctx, x, y, w, h, activeGene, proteinCache, drawPiPFrameCallback) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Protein Structure");
            }

            if (!activeGene) return;

            // Initialize Protein Cache if needed (handled by caller usually, but we can check)
            // Assuming proteinCache is passed in and managed by main controller

            // Generate Protein Chain for this gene if not exists
            let protein = proteinCache[activeGene.id];
            if (!protein && window.GreenhouseGeneticGeometry) {
                protein = window.GreenhouseGeneticGeometry.generateProteinChain(activeGene.id);
                proteinCache[activeGene.id] = protein;
            }

            if (!protein) return;

            const proteinCamera = {
                x: 0, y: 0, z: -100,
                rotationX: Date.now() * 0.0005,
                rotationY: Date.now() * 0.001,
                rotationZ: 0,
                fov: 400
            };

            // Project Chain
            const projected = protein.vertices.map(v => {
                // Rotate
                let vx = v.x, vy = v.y, vz = v.z;
                // Rot Y
                let tx = vx * Math.cos(proteinCamera.rotationY) - vz * Math.sin(proteinCamera.rotationY);
                let tz = vx * Math.sin(proteinCamera.rotationY) + vz * Math.cos(proteinCamera.rotationY);
                vx = tx; vz = tz;
                // Rot X
                let ty = vy * Math.cos(proteinCamera.rotationX) - vz * Math.sin(proteinCamera.rotationX);
                tz = vy * Math.sin(proteinCamera.rotationX) + vz * Math.cos(proteinCamera.rotationX);
                vy = ty; vz = tz;

                const p = GreenhouseModels3DMath.project3DTo2D(vx, vy, vz, proteinCamera, { width: w, height: h, near: 10, far: 5000 });
                return { x: p.x + x, y: p.y + y, scale: p.scale, depth: p.depth };
            });

            // Draw Chain based on Mode
            // mode: 'ribbon' (default), 'ball-and-stick', 'space-filling'
            const mode = activeGene.proteinMode || 'ribbon';

            if (mode === 'ribbon') {
                // Ribbon Mode (Thick Line)
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                for (let i = 0; i < projected.length - 1; i++) {
                    const p1 = projected[i];
                    const p2 = projected[i + 1];

                    if (p1.scale > 0 && p2.scale > 0) {
                        const avgDepth = (p1.depth + p2.depth) / 2;
                        const alpha = Math.min(1, Math.max(0.2, 1 - avgDepth / 1000));
                        const width = 8 * ((p1.scale + p2.scale) / 2);

                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);

                        // Color gradient based on Secondary Structure (Simulated)
                        // Helix (Magenta), Sheet (Yellow), Coil (White)
                        const structureType = Math.floor(i / 10) % 3;
                        let r, g, b;
                        if (structureType === 0) { r = 255; g = 0; b = 255; } // Helix
                        else if (structureType === 1) { r = 255; g = 215; b = 0; } // Sheet
                        else { r = 240; g = 240; b = 240; } // Coil

                        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.lineWidth = width;
                        ctx.stroke();

                        // Draw "Atom" at joint
                        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.beginPath();
                        ctx.arc(p2.x, p2.y, width / 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (mode === 'ball-and-stick') {
                // Ball-and-Stick Mode
                // Thin bonds, small spheres
                for (let i = 0; i < projected.length - 1; i++) {
                    const p1 = projected[i];
                    const p2 = projected[i + 1];

                    if (p1.scale > 0 && p2.scale > 0) {
                        const avgDepth = (p1.depth + p2.depth) / 2;
                        const alpha = Math.min(1, Math.max(0.2, 1 - avgDepth / 1000));

                        // Bond
                        ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
                        ctx.lineWidth = 2 * ((p1.scale + p2.scale) / 2);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Draw Atoms on top
                // Sort by depth for correct occlusion? Already projected in order? 
                // No, projected is in chain order. Should sort by depth for balls.
                const sortedAtoms = [...projected].map((p, i) => ({ ...p, index: i })).sort((a, b) => b.depth - a.depth);

                sortedAtoms.forEach(p => {
                    if (p.scale > 0) {
                        const alpha = Math.min(1, Math.max(0.2, 1 - p.depth / 1000));
                        const size = 6 * p.scale;

                        // CPK Coloring (Simulated by index position in residue)
                        // N (Blue), C (Grey), O (Red), S (Yellow)
                        const atomType = p.index % 3; // 0: N, 1: C, 2: O (Simplified)
                        let r, g, b;
                        if (atomType === 0) { r = 50; g = 50; b = 255; } // N
                        else if (atomType === 1) { r = 100; g = 100; b = 100; } // C
                        else { r = 255; g = 50; b = 50; } // O

                        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                        ctx.fill();

                        // Highlight
                        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(p.x - size * 0.3, p.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });

            } else if (mode === 'space-filling') {
                // Space-Filling Mode (Van der Waals)
                // Large spheres, no bonds visible
                const sortedAtoms = [...projected].map((p, i) => ({ ...p, index: i })).sort((a, b) => b.depth - a.depth);

                sortedAtoms.forEach(p => {
                    if (p.scale > 0) {
                        const alpha = Math.min(1, Math.max(0.2, 1 - p.depth / 1000));
                        const size = 12 * p.scale; // Larger size

                        // CPK Coloring
                        const atomType = p.index % 3; // 0: N, 1: C, 2: O
                        let r, g, b;
                        if (atomType === 0) { r = 50; g = 50; b = 255; } // N
                        else if (atomType === 1) { r = 100; g = 100; b = 100; } // C
                        else { r = 255; g = 50; b = 50; } // O

                        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                        ctx.fill();

                        // Highlight
                        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(p.x - size * 0.3, p.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }

            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Polypeptide Chain", x + w / 2, y + h - 10);

            ctx.restore(); // Restore context from drawPiPFrame
        },

        hitTest(mouseX, mouseY, x, y, w, h, activeGene, proteinCache) {
            if (!activeGene) return null;
            const protein = proteinCache[activeGene.id];
            if (!protein) return null;

            // Re-calculate projection (Duplicate logic, ideally shared)
            // For now, we just approximate or need to store the last projected points?
            // Storing last projected points is better for performance and consistency.
            // Let's assume we can't easily access the last frame's data without refactoring.
            // So we re-project.

            const proteinCamera = {
                x: 0, y: 0, z: -150,
                rotationX: Date.now() * 0.0005,
                rotationY: Date.now() * 0.001,
                rotationZ: 0,
                fov: 400
            };

            // Check bounding box of PiP
            if (mouseX < x || mouseX > x + w || mouseY < y || mouseY > y + h) return null;

            // Check Atoms
            for (let i = 0; i < protein.vertices.length; i++) {
                const v = protein.vertices[i];
                // Rotate
                let vx = v.x, vy = v.y, vz = v.z;
                let tx = vx * Math.cos(proteinCamera.rotationY) - vz * Math.sin(proteinCamera.rotationY);
                let tz = vx * Math.sin(proteinCamera.rotationY) + vz * Math.cos(proteinCamera.rotationY);
                vx = tx; vz = tz;
                let ty = vy * Math.cos(proteinCamera.rotationX) - vz * Math.sin(proteinCamera.rotationX);
                tz = vy * Math.sin(proteinCamera.rotationX) + vz * Math.cos(proteinCamera.rotationX);
                vy = ty; vz = tz;

                const p = GreenhouseModels3DMath.project3DTo2D(vx, vy, vz, proteinCamera, { width: w, height: h, near: 10, far: 5000 });

                if (p.scale > 0) {
                    const screenX = p.x + x;
                    const screenY = p.y + y;
                    const dx = mouseX - screenX;
                    const dy = mouseY - screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 10 * p.scale) {
                        return { type: 'protein_atom', index: i, geneId: activeGene.id };
                    }
                }
            }
            return null;
        }
    };

    window.GreenhouseGeneticProtein = GreenhouseGeneticProtein;
})();
