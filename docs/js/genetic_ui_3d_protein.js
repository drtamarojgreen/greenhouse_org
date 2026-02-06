(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseGeneticProtein = {
        isGPCR(symbol) {
            const gpcrGenes = ["DRD2", "HTR2A", "OXTR"];
            return gpcrGenes.includes(symbol);
        },

        drawProteinView(ctx, x, y, w, h, activeGene, proteinCache, drawPiPFrameCallback, cameraState) {
            if (drawPiPFrameCallback) {
                const title = this.isGPCR(activeGene?.label) ? t("gpcr_title") : t("Protein Structure");
                drawPiPFrameCallback(ctx, x, y, w, h, title);
            }

            if (!activeGene) return;

            // Use the specific camera for this PiP - no fallback
            if (!cameraState || !cameraState.camera) {
                console.error('[drawProteinView] No camera provided!');
                return;
            }
            const proteinCamera = cameraState.camera;

            // Specialized GPCR Signaling View
            if (this.isGPCR(activeGene.label)) {
                this.drawGPCRSignaling(ctx, x, y, w, h, activeGene, proteinCamera);
                return;
            }

            // Initialize Protein Cache if needed
            let protein = proteinCache[activeGene.id];
            if (!protein && window.GreenhouseGeneticGeometry) {
                protein = window.GreenhouseGeneticGeometry.generateProteinChain(activeGene.id);
                proteinCache[activeGene.id] = protein;
            }

            if (!protein) return;

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
                return { x: p.x + x, y: p.y + y, scale: p.scale, depth: p.depth, type: v.type };
            });

            // Draw Chain based on Mode
            // mode: 'ribbon' (default), 'ball-and-stick', 'space-filling'
            const mode = activeGene.proteinMode || 'ribbon';

            if (mode === 'ribbon') {
                // Ribbon Mode (Thick Line)
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                for (let i = 0; i < projected.length - 1; i++) {
                    const p1 = projected[i];
                    const p2 = projected[i + 1];

                    if (p1.scale > 0 && p2.scale > 0) {
                        const avgDepth = (p1.depth + p2.depth) / 2;
                        const alpha = Math.min(1, Math.max(0.2, 1 - avgDepth / 1000));

                        // Color based on Secondary Structure
                        const structureType = p1.type || 'coil';
                        let r, g, b, baseWidth = 8;
                        if (structureType === 'helix') {
                            r = 255; g = 0; b = 255; // Helix: Magenta
                            baseWidth = 12; // Helices are thicker ribbons
                        } else if (structureType === 'sheet') {
                            r = 255; g = 215; b = 0; // Sheet: Yellow
                            baseWidth = 10;
                        } else {
                            r = 240; g = 240; b = 240; // Coil: White
                            baseWidth = 6;
                        }

                        const width = baseWidth * ((p1.scale + p2.scale) / 2);

                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);

                        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.lineWidth = width;
                        ctx.stroke();

                        // Draw joint for smoothness
                        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                        ctx.beginPath();
                        ctx.arc(p2.x, p2.y, width / 2, 0, Math.PI * 2);
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
            ctx.fillText(t("Polypeptide Chain"), x + w / 2, y + h - 10);

            ctx.restore(); // Restore context from drawPiPFrame
        },

        drawGPCRSignaling(ctx, x, y, w, h, activeGene, camera) {
            const time = Date.now() * 0.001;
            const geo = window.GreenhouseGeneticGeometry;
            if (!geo) return;

            ctx.save();
            ctx.translate(x, y);

            const projectionParams = { width: w, height: h, near: 10, far: 1000 };

            // 1. Draw Cell Membrane (Conceptual)
            ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
            ctx.lineWidth = 2;
            const memY = 0; // Relative Y in 3D
            const memP1 = GreenhouseModels3DMath.project3DTo2D(-100, memY, 0, camera, projectionParams);
            const memP2 = GreenhouseModels3DMath.project3DTo2D(100, memY, 0, camera, projectionParams);
            if (memP1.scale > 0 && memP2.scale > 0) {
                ctx.beginPath();
                ctx.moveTo(memP1.x, memP1.y);
                ctx.lineTo(memP2.x, memP2.y);
                ctx.stroke();
            }

            // 2. Draw 7-Transmembrane Helices
            const helices = [];
            const radius = 30;
            for (let i = 0; i < 7; i++) {
                const angle = (i / 7) * Math.PI * 2;
                const hx = Math.cos(angle) * radius;
                const hz = Math.sin(angle) * radius;
                helices.push({ x: hx, y: -40, z: hz, targetY: 40 });
            }

            helices.forEach((hPos, i) => {
                const p1 = GreenhouseModels3DMath.project3DTo2D(hPos.x, hPos.y, hPos.z, camera, projectionParams);
                const p2 = GreenhouseModels3DMath.project3DTo2D(hPos.x, hPos.targetY, hPos.z, camera, projectionParams);

                if (p1.scale > 0 && p2.scale > 0) {
                    ctx.strokeStyle = `hsl(${(i * 50) % 360}, 70%, 60%)`;
                    ctx.lineWidth = 6 * ((p1.scale + p2.scale) / 2);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });

            // Label 7-TM
            const tmLabelP = GreenhouseModels3DMath.project3DTo2D(0, -50, 0, camera, projectionParams);
            if (tmLabelP.scale > 0) {
                ctx.fillStyle = '#00ffff';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(t("gpcr_7tm"), tmLabelP.x, tmLabelP.y);
            }

            // 3. Draw Heterotrimeric G Protein (Below membrane)
            const gAlphaPos = { x: 20 + Math.sin(time) * 10, y: 50, z: 0 };
            const gBetaPos = { x: 40 + Math.sin(time + 1) * 5, y: 60, z: -10 };
            const gGammaPos = { x: 50 + Math.sin(time + 2) * 5, y: 60, z: 10 };

            const drawSubunit = (pos, color, labelKey) => {
                const p = GreenhouseModels3DMath.project3DTo2D(pos.x, pos.y, pos.z, camera, projectionParams);
                if (p.scale > 0) {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 8 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = '6px Arial';
                    ctx.fillText(t(labelKey), p.x, p.y + 12 * p.scale);
                }
            };

            drawSubunit(gAlphaPos, '#ff4444', 'Gα');
            drawSubunit(gBetaPos, '#44ff44', 'Gβ');
            drawSubunit(gGammaPos, '#4444ff', 'Gγ');

            const gLabelP = GreenhouseModels3DMath.project3DTo2D(40, 80, 0, camera, projectionParams);
            if (gLabelP.scale > 0) {
                ctx.fillStyle = '#aaa';
                ctx.fillText(t("gpcr_gprotein"), gLabelP.x, gLabelP.y);
            }

            // 4. Beta-Arrestin
            const arrestinPos = { x: -40, y: 50 + Math.cos(time) * 5, z: 0 };
            const arrestinP = GreenhouseModels3DMath.project3DTo2D(arrestinPos.x, arrestinPos.y, arrestinPos.z, camera, projectionParams);
            if (arrestinP.scale > 0) {
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(arrestinP.x - 10 * arrestinP.scale, arrestinP.y - 5 * arrestinP.scale, 20 * arrestinP.scale, 10 * arrestinP.scale);
                ctx.fillStyle = '#fff';
                ctx.font = '7px Arial';
                ctx.fillText(t("gpcr_arrestin"), arrestinP.x, arrestinP.y + 12 * arrestinP.scale);
            }

            // 5. Adenyl Cyclase (Membrane bound)
            const acPos = { x: 80, y: 10, z: 0 };
            const acP = GreenhouseModels3DMath.project3DTo2D(acPos.x, acPos.y, acPos.z, camera, projectionParams);
            if (acP.scale > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.rect(acP.x - 15 * acP.scale, acP.y - 15 * acP.scale, 30 * acP.scale, 20 * acP.scale);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 6px Arial';
                ctx.fillText("AC", acP.x, acP.y - 2);
                ctx.fillStyle = '#ffd700';
                ctx.fillText(t("gpcr_adenyl_cyclase"), acP.x, acP.y + 15 * acP.scale);
            }

            // 6. Kinase & Transcription Factor (Deep Cytosol / Nucleus)
            const kinasePos = { x: 60, y: 120, z: 0 };
            const tfPos = { x: 0, y: 180, z: 0 };

            const kinaseP = GreenhouseModels3DMath.project3DTo2D(kinasePos.x, kinasePos.y, kinasePos.z, camera, projectionParams);
            if (kinaseP.scale > 0) {
                ctx.fillStyle = '#9c27b0';
                ctx.beginPath();
                ctx.arc(kinaseP.x, kinaseP.y, 6 * kinaseP.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText(t("gpcr_kinase"), kinaseP.x, kinaseP.y + 10 * kinaseP.scale);
            }

            const tfP = GreenhouseModels3DMath.project3DTo2D(tfPos.x, tfPos.y, tfPos.z, camera, projectionParams);
            if (tfP.scale > 0) {
                // Nucleus Boundary
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(tfP.x, tfP.y, 40 * tfP.scale, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#ff5722';
                ctx.beginPath();
                ctx.arc(tfP.x, tfP.y, 8 * tfP.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText(t("gpcr_transcription_factor"), tfP.x, tfP.y + 12 * tfP.scale);

                // Nuclear Effects Labels
                ctx.font = 'italic 7px Arial';
                ctx.fillText(t("gpcr_transactivation"), tfP.x - 30 * tfP.scale, tfP.y - 20 * tfP.scale);
                ctx.fillText(t("gpcr_transcriptional_control"), tfP.x + 30 * tfP.scale, tfP.y - 20 * tfP.scale);
                ctx.fillStyle = '#4caf50';
                ctx.font = 'bold 8px Arial';
                ctx.fillText(t("gpcr_gene_expression"), tfP.x, tfP.y + 30 * tfP.scale);
            }

            ctx.restore();
            ctx.restore(); // Extra restore to match drawProteinView's ctx.save() in GreenhouseGeneticUI3D
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
