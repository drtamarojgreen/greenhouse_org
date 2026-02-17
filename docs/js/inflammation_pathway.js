/**
 * @file inflammation_pathway.js
 * @description Specialized Pathway Visualization for the Neuroinflammation Simulation.
 * Implements items 88-94 from the 100 enhancements list.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationPathway = {
        isLoading: false,
        error: null,
        searchQuery: '',
        layoutMode: 'anatomical', // anatomical, radial, layered
        showOnlyActiveFactors: false,

        render(ctx, state, camera, projection, ui3d) {
            if (this.isLoading) {
                this.drawLoadingIndicator(ctx, projection);
                return;
            }
            if (this.error) {
                this.drawErrorMessage(ctx, projection);
                return;
            }

            const nodes = ui3d.currentPathwayNodes || [];
            const edges = ui3d.currentPathwayEdges || [];
            const Math3D = window.GreenhouseModels3DMath;

            if (!nodes.length || !Math3D) return;

            // Apply Layout (Item 90)
            const projectedNodes = nodes.map((node, i) => {
                let x = node.x, y = node.y, z = node.z;
                if (this.layoutMode === 'radial') {
                    const angle = (i / nodes.length) * Math.PI * 2;
                    x = Math.cos(angle) * 300;
                    y = Math.sin(angle) * 300;
                    z = 0;
                } else if (this.layoutMode === 'layered') {
                    x = -300 + (i % 5) * 150;
                    y = -200 + Math.floor(i / 5) * 100;
                    z = 0;
                }
                const p = Math3D.project3DTo2D(x, y, z, camera, projection);
                return { ...node, ...p };
            });

            // Filter nodes by search or active factors (Items 92, 93)
            const filteredNodes = projectedNodes.filter(n => {
                const matchesSearch = !this.searchQuery || (n.label || n.name || '').toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesActive = !this.showOnlyActiveFactors || state.factors[n.id] === 1;
                return matchesSearch && matchesActive;
            });

            // Draw Edges (Item 91)
            ctx.save();
            edges.forEach(edge => {
                const s = filteredNodes.find(n => n.id === edge.source);
                const t = filteredNodes.find(n => n.id === edge.target);
                if (s && t && s.scale > 0 && t.scale > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = edge.type === 'inhibitory' ? 'rgba(255, 85, 51, 0.4)' : 'rgba(76, 161, 175, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(t.x, t.y);
                    ctx.stroke();

                    // Directional Arrow (Item 91)
                    const dx = t.x - s.x;
                    const dy = t.y - s.y;
                    const angle = Math.atan2(dy, dx);
                    const arrowSize = 6 * t.scale;
                    ctx.save();
                    ctx.translate(t.x - Math.cos(angle) * 10, t.y - Math.sin(angle) * 10);
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-arrowSize, -arrowSize/2);
                    ctx.lineTo(-arrowSize, arrowSize/2);
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fill();
                    ctx.restore();
                }
            });
            ctx.restore();

            // Draw Nodes
            filteredNodes.forEach(n => {
                if (n.scale <= 0) return;
                ctx.fillStyle = state.factors[n.id] === 1 ? '#00ff99' : '#4ca1af';
                ctx.beginPath();
                ctx.arc(n.x, n.y, 5 * n.scale, 0, Math.PI * 2);
                ctx.fill();

                if (n.scale > 0.5) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText((n.label || n.id).toUpperCase(), n.x, n.y + 15 * n.scale);
                }
            });

            this.drawPathwayLegend(ctx, projection); // Item 94
            this.drawPathwayControls(ctx, projection); // Layout/Filter controls
        },

        drawLoadingIndicator(ctx, projection) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText('FETCHING PATHWAY DATA...', projection.width / 2, projection.height / 2);
            // Simple spinning arc
            ctx.strokeStyle = '#4ca1af';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(projection.width / 2, projection.height / 2 + 30, 15, 0, (Date.now() % 1000) / 1000 * Math.PI * 2);
            ctx.stroke();
        },

        drawErrorMessage(ctx, projection) {
            ctx.fillStyle = '#ff5533';
            ctx.font = 'bold 14px Quicksand';
            ctx.textAlign = 'center';
            ctx.fillText(`PATHWAY ERROR: ${this.error}`, projection.width / 2, projection.height / 2);
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText('CHECK ENDPOINTS OR METADATA CONFIG', projection.width / 2, projection.height / 2 + 20);
        },

        drawPathwayLegend(ctx, projection) {
            const x = 40, y = projection.height - 180;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(x, y, 150, 80);
            ctx.strokeStyle = '#4ca1af';
            ctx.strokeRect(x, y, 150, 80);

            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 10px Quicksand';
            ctx.fillText('PATHWAY LEGEND', x + 10, y + 15);

            ctx.fillStyle = '#00ff99'; ctx.beginPath(); ctx.arc(x + 15, y + 30, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('ACTIVE FACTOR', x + 25, y + 33);

            ctx.fillStyle = '#4ca1af'; ctx.beginPath(); ctx.arc(x + 15, y + 45, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText('INACTIVE', x + 25, y + 48);

            ctx.strokeStyle = 'rgba(76, 161, 175, 0.8)'; ctx.beginPath(); ctx.moveTo(x + 10, y + 60); ctx.lineTo(x + 20, y + 60); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.fillText('STIMULATORY', x + 25, y + 63);

            ctx.strokeStyle = 'rgba(255, 85, 51, 0.8)'; ctx.beginPath(); ctx.moveTo(x + 10, y + 75); ctx.lineTo(x + 20, y + 75); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.fillText('INHIBITORY', x + 25, y + 78);
        },

        drawPathwayControls(ctx, projection) {
            const x = projection.width - 200, y = 140;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(x, y, 180, 100);
            ctx.strokeStyle = '#4ca1af';
            ctx.strokeRect(x, y, 180, 100);

            ctx.fillStyle = '#4ca1af'; ctx.font = 'bold 10px Quicksand';
            ctx.fillText('PATHWAY CONTROLS', x + 10, y + 15);

            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText(`LAYOUT: ${this.layoutMode.toUpperCase()} (L)`, x + 10, y + 35);
            ctx.fillText(`SEARCH: ${this.searchQuery || 'NONE'} (S)`, x + 10, y + 50);
            ctx.fillText(`ACTIVE ONLY: ${this.showOnlyActiveFactors ? 'ON' : 'OFF'} (A)`, x + 10, y + 65);
            ctx.fillText(`RESET FOCUS (F)`, x + 10, y + 80);
        }
    };

    window.GreenhouseInflammationPathway = GreenhouseInflammationPathway;
})();
