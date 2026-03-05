/**
 * @file stress_pathway.js
 * @description Scientifically comprehensive HPA-Axis and Dynamic Pathway Visualization.
 * Renders KEGG-sourced pathways integrated from the shared data bridge.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressPathway = {
        bursts: [], // {x, y, targetX, targetY, life, type}

        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const f = state.factors;
            const time = state.time || 0;
            const activePathId = f.activePathway || 'hpa';

            const sourceNodes = (ui3d.currentPathwayNodes && ui3d.currentPathwayNodes.length > 0) ? ui3d.currentPathwayNodes : ui3d.hpaNodes;
            const sourceEdges = ui3d.currentPathwayEdges || [];

            camera.rotationY += 0.001;

            // --- GRAPH VISUALIZATION INTEGRATION ---
            // If the Graph Viewer is available and active, render it INSTEAD or ON TOP
            // We'll add a toggle in the UI section below.
            const GraphViewer = window.GreenhouseModelGraphViewer;

            // Auto-load data if present but not initialized
            if (GraphViewer && (!GraphViewer.graphData) && window.GreenhouseGraphParser) {
                if (typeof GraphViewer.initDataOnly === 'function') GraphViewer.initDataOnly();
                // Ensure data is fetching if not already started
                if (!window.GreenhouseGraphParser.isLoaded) {
                    if (!window.GreenhouseGraphParser._setupStarted) {
                        window.GreenhouseGraphParser._setupStarted = true;
                        const baseUrl = (ui3d.app && ui3d.app.baseUrl) ? ui3d.app.baseUrl : '';
                        window.GreenhouseGraphParser.init('endpoints/graph.csv', 50, baseUrl);
                    }
                }
            }

            // Check State for Graph Mode (Default to false)
            if (f.showGraphView && GraphViewer && GraphViewer.graphData) {
                // Update Physics (with current canvas size)
                GraphViewer.updatePhysics();

                // Render Graph (Pass 3D Camera/Projection)
                // render(ctx, width, height, camera, projection)
                GraphViewer.render(ctx, projection.width, projection.height, camera, projection);

                // Draw a "Exit Graph" button or similar overlay
                this.drawGraphControls(ctx, projection);

                return; // Skip standard pathway rendering
            }
            // ----------------------------------------

            const nodes = sourceNodes.map(node => {
                const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                let throb = 1.0;
                // CAR peaks affect HPA node activity
                const car = ui3d.app.clock ? ui3d.app.clock.getCortisolFactor() : 1.0;
                if (node.id === 'hypothalamus' || node.type === 'gene') throb = 1 + Math.sin(time * 0.005) * 0.08 * car;
                return { ...node, ...p, throb };
            });

            // 0. Update Bursts (Pulsatile release)
            this.updateBursts(16); // Rough dt

            // 1. Draw Edges (Neural/Hormonal Differentiation)
            ctx.save();
            sourceEdges.forEach(edge => {
                const n1 = nodes.find(n => n.id === edge.source);
                const n2 = nodes.find(n => n.id === edge.target);
                if (n1 && n2 && n1.scale > 0 && n2.scale > 0) {
                    const isNeural = edge.type === 'neural' || (activePathId !== 'hpa');

                    ctx.beginPath();
                    if (isNeural) {
                        ctx.strokeStyle = `rgba(100, 255, 200, ${0.1 * n1.scale})`;
                        ctx.setLineDash([5, 5]);
                    } else {
                        ctx.strokeStyle = `rgba(255, 200, 100, ${0.15 * n1.scale})`;
                    }
                    ctx.lineWidth = 1;
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Trigger bursts periodically based on intensity
                    const intensity = state.factors.stressorIntensity || 0.5;
                    if (Math.random() < 0.01 + intensity * 0.02) {
                        this.triggerBurst(n1, n2, isNeural ? 'neural' : 'hormonal');
                    }
                }
            });
            ctx.restore();

            // 1b. Render Bursts
            this.drawBursts(ctx);

            // 2. Draw Nodes
            nodes.forEach(node => {
                if (node.scale <= 0) return;
                if (node.mesh && (activePathId === 'hpa' || node.id === 'hypothalamus')) {
                    this.drawGlandMesh(ctx, node, camera, projection);
                } else {
                    this.drawKeggNode(ctx, node);
                }
            });

            // 3. Labels (Internationalized)
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            nodes.forEach(n => {
                if (n.scale > 0.45) {
                    const labelStr = (n.label || n.name || '').toUpperCase();
                    // Attempt translation or use raw string
                    const displayLabel = t(labelStr) || labelStr;
                    ctx.fillText(displayLabel, n.x, n.y + 18 * n.scale);
                }
            });

            // Draw Toggle for Graph View
            this.drawGraphControls(ctx, projection, false);
        },

        drawGraphControls(ctx, projection, isGraphActive = true) {
            // Draw a button in top-right or similar
            const x = projection.width - 140;
            const y = 80; // Below main nav
            const w = 120;
            const h = 30;

            // Check Interaction
            // We need access to mouse position. Usually passed via state or gathered.
            // stress_app.js has `this.interaction`. ui3d has access to app.
            // We can check `window.GreenhouseStressApp.interaction` if global, or pass it.
            // Simplest: Just draw it, and handle click in a global handler or app handler.
            // For now, let's just draw.

            ctx.fillStyle = 'rgba(50, 50, 70, 0.8)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#4ca1af';
            ctx.strokeRect(x, y, w, h);

            ctx.fillStyle = '#fff';
            ctx.font = '12px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText(isGraphActive ? "EXIT GRAPH VIEW" : "TOPIC GRAPH", x + w / 2, y + 19);

            // Store button bounds for click handling (GLOBAL HACK for quick integration)
            if (!window.GreenhouseStressPathwayButtons) window.GreenhouseStressPathwayButtons = [];
            // Clear previous button definition for this frame to avoid dupes? 
            // Actually just overwrite.
            window.GreenhouseStressPathwayButtons = [{
                id: 'toggle_graph',
                x: x, y: y, w: w, h: h,
                action: (state) => {
                    state.factors.showGraphView = !state.factors.showGraphView;
                }
            }];
        },

        triggerBurst(n1, n2, type) {
            this.bursts.push({
                x: n1.x, y: n1.y,
                tx: n2.x, ty: n2.y,
                life: 1.0,
                type: type,
                speed: type === 'neural' ? 0.05 : 0.01 // Hormones move slower
            });
        },

        updateBursts(dt) {
            for (let i = this.bursts.length - 1; i >= 0; i--) {
                const b = this.bursts[i];
                b.life -= b.speed;
                if (b.life <= 0) {
                    this.bursts.splice(i, 1);
                }
            }
        },

        drawBursts(ctx) {
            ctx.save();
            this.bursts.forEach(b => {
                const p = 1.0 - b.life;
                const bx = b.x + (b.tx - b.x) * p;
                const by = b.y + (b.ty - b.y) * p;

                if (b.type === 'neural') {
                    ctx.fillStyle = '#00ffcc';
                    ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
                    // "Ghost" tail
                    ctx.strokeStyle = 'rgba(0, 255, 200, 0.3)';
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - (b.tx - b.x) * 0.1, by - (b.ty - b.y) * 0.1); ctx.stroke();
                } else {
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
                }
            });
            ctx.restore();
        },

        drawKeggNode(ctx, node) {
            const color = node.type === 'gene' ? '#ffcc00' : (node.type === 'compound' ? '#64d2ff' : '#00ff99');
            ctx.fillStyle = color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4 * node.scale * node.throb, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        },

        drawGlandMesh(ctx, node, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const color = node.color || '#ffcc00';

            ctx.save();
            ctx.translate(node.x, node.y);

            node.mesh.faces.forEach(face => {
                const v1 = node.mesh.vertices[face[0]], v2 = node.mesh.vertices[face[1]], v3 = node.mesh.vertices[face[2]];
                const scale = node.scale * node.throb;
                const alpha = Math3D.applyDepthFog(0.5, node.depth, 0.1, 0.9);

                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                ctx.moveTo(v1.x * scale, v1.y * scale);
                ctx.lineTo(v2.x * scale, v2.y * scale);
                ctx.lineTo(v3.x * scale, v3.y * scale);
                ctx.fill();
            });
            ctx.restore();
        }
    };

    window.GreenhouseStressPathway = GreenhouseStressPathway;
})();
