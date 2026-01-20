/**
 * @file dopamine_tooltips.js
 * @description Tooltip logic for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.initTooltips = function (container) {
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = 'dopamine-tooltip';
        this.tooltipEl.style.position = 'absolute';
        this.tooltipEl.style.background = 'rgba(20, 20, 40, 0.9)';
        this.tooltipEl.style.color = '#fff';
        this.tooltipEl.style.padding = '8px';
        this.tooltipEl.style.borderRadius = '4px';
        this.tooltipEl.style.fontSize = '12px';
        this.tooltipEl.style.display = 'none';
        this.tooltipEl.style.pointerEvents = 'none';
        this.tooltipEl.style.zIndex = '200';
        this.tooltipEl.style.maxWidth = '200px';
        this.tooltipEl.style.border = '1px solid #4a5568';
        container.appendChild(this.tooltipEl);

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.handleHover(mouseX, mouseY);
        });
    };

    G.handleHover = function (x, y) {
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;

        let found = null;
        // Check Receptors
        G.state.receptors.forEach(r => {
            const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 30 * p.scale) {
                found = { type: 'receptor', data: r };
            }
        });

        // Check Astrocytes
        if (!found && G.synapseState.astrocytes) {
            G.synapseState.astrocytes.forEach(ast => {
                const p = project(ast.x, ast.y, ast.z, cam, { width: w, height: h, near: 10, far: 5000 });
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < ast.radius * p.scale) {
                    found = { type: 'astrocyte', data: ast };
                }
            });
        }

        if (found) {
            this.tooltipEl.style.left = `${x + 10}px`;
            this.tooltipEl.style.top = `${y + 10}px`;
            this.tooltipEl.style.display = 'block';

            if (found.type === 'receptor') {
                const r = found.data;
                this.tooltipEl.innerHTML = `
                    <strong>${r.type} Receptor</strong><br>
                    Class: ${r.type === 'D1' || r.type === 'D5' ? 'D1-like (Gs)' : 'D2-like (Gi)'}<br>
                    IL3 Size: ${r.il3Size} units<br>
                    C-tail: ${r.tailLength} units<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        ${r.type === 'D1' ? 'Stimulates adenylyl cyclase, increases cAMP.' : 'Inhibits adenylyl cyclase, opens GIRK channels.'}
                        ${G.state.mode === 'Heteromer' ? '<br>Currently in D1-D2 Heteromer state (Gq signaling).' : ''}
                    </div>
                `;
            } else if (found.type === 'astrocyte') {
                this.tooltipEl.innerHTML = `
                    <strong>Astrocyte Process</strong><br>
                    Part of the Tripartite Synapse.<br>
                    <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
                        Clears extracellular dopamine via reuptake and metabolic pathways (MAO/COMT).
                    </div>
                `;
            }
        } else {
            this.tooltipEl.style.display = 'none';
        }
    };

    G.updateTooltips = function () {
        // Any periodic tooltip updates
    };
})();
