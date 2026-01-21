/**
 * @file serotonin_controls.js
 * @description UI controls for Serotonin Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.createUI = function (container) {
        const controls = document.createElement('div');
        controls.className = 'serotonin-controls';

        const views = ['5-HT1A Complex', 'Ligand Pocket', 'Lipid Interactions', 'Extracellular Loop', 'Time-lapse'];
        views.forEach(view => {
            const btn = document.createElement('button');
            btn.className = 'serotonin-btn';
            btn.innerText = view;
            btn.onclick = () => {
                console.log(`Switching to ${view}`);
            };
            controls.appendChild(btn);
        });

        // Toggle Buttons for Physiological States
        const states = [
            { name: 'Depression', toggle: () => { G.Transport.tphActivity = G.Transport.tphActivity === 1.0 ? 0.3 : 1.0; } },
            { name: 'Time-lapse', toggle: () => { G.timeLapse = !G.timeLapse; } },
            { name: 'Phasic Mode', toggle: () => { G.Transport.firingMode = G.Transport.firingMode === 'tonic' ? 'phasic' : 'tonic'; } },
            { name: 'Inflammation', toggle: () => { G.Transport.inflammationActive = !G.Transport.inflammationActive; } },
            { name: 'Pineal Mode', toggle: () => { G.Transport.pinealMode = !G.Transport.pinealMode; } },
            { name: 'Serotonin Syndrome', toggle: () => {
                if (!G.ssActive) {
                    G.Transport.sertActivity = 0;
                    G.Transport.maoActivity = 0;
                    G.ssActive = true;
                } else {
                    G.Transport.sertActivity = 1.0;
                    G.Transport.maoActivity = 1.0;
                    G.ssActive = false;
                }
            }}
        ];

        states.forEach(state => {
            const btn = document.createElement('button');
            btn.className = 'serotonin-btn';
            btn.innerText = `Toggle ${state.name}`;
            btn.onclick = () => {
                state.toggle();
                btn.style.borderColor = btn.style.borderColor === 'red' ? '#4a5568' : 'red';
            };
            controls.appendChild(btn);
        });

        container.appendChild(controls);

        const info = document.createElement('div');
        info.className = 'serotonin-info';
        info.innerHTML = '<strong>Serotonin Structural Model</strong><br>Visualization of 5-HT1A in complex with Gi.';
        container.appendChild(info);

        // Zoom Control (Category 10, #90)
        const zoomControl = document.createElement('div');
        zoomControl.style.position = 'absolute';
        zoomControl.style.top = '10px';
        zoomControl.style.right = '10px';
        zoomControl.style.display = 'flex';
        zoomControl.style.flexDirection = 'column';
        zoomControl.style.gap = '5px';

        const zoomIn = document.createElement('button');
        zoomIn.className = 'serotonin-btn';
        zoomIn.innerText = 'Zoom In (+)';
        zoomIn.onclick = () => { G.state.camera.zoom *= 1.1; };

        const zoomOut = document.createElement('button');
        zoomOut.className = 'serotonin-btn';
        zoomOut.innerText = 'Zoom Out (-)';
        zoomOut.onclick = () => { G.state.camera.zoom *= 0.9; };

        zoomControl.appendChild(zoomIn);
        zoomControl.appendChild(zoomOut);
        container.appendChild(zoomControl);

        // Subcellular Markers (Category 10, #93)
        this.renderSubcellularMarkers = (ctx, project, cam, w, h) => {
            // Cytoskeleton visualization (Category 10, #93)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = -300; i <= 300; i += 100) {
                const start = project(-300, i, 0, cam, { width: w, height: h, near: 10, far: 5000 });
                const end = project(300, i, 0, cam, { width: w, height: h, near: 10, far: 5000 });
                if (start.scale > 0 && end.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();
                }
            }

            // Golgi Apparatus
            const golgiPos = project(-200, -250, -100, cam, { width: w, height: h, near: 10, far: 5000 });
            if (golgiPos.scale > 0) {
                ctx.strokeStyle = 'rgba(255, 100, 255, 0.4)';
                ctx.lineWidth = 5 * golgiPos.scale;
                ctx.beginPath();
                ctx.moveTo(golgiPos.x - 20 * golgiPos.scale, golgiPos.y);
                ctx.bezierCurveTo(golgiPos.x, golgiPos.y - 20 * golgiPos.scale, golgiPos.x, golgiPos.y + 20 * golgiPos.scale, golgiPos.x + 20 * golgiPos.scale, golgiPos.y);
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '9px Arial';
                ctx.fillText('Golgi', golgiPos.x, golgiPos.y - 15 * golgiPos.scale);
            }

            // Endoplasmic Reticulum (ER)
            const erPos = project(-250, -150, 50, cam, { width: w, height: h, near: 10, far: 5000 });
            if (erPos.scale > 0) {
                ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(erPos.x, erPos.y, 30 * erPos.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText('ER', erPos.x, erPos.y);
            }
        };
    };

    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);

        const ctx = G.ctx;
        // Serotonin Syndrome visuals (Category 7, #69)
        if (G.ssActive) {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + Math.sin(Date.now() * 0.01) * 0.05})`;
            ctx.fillRect(0, 0, G.width, G.height);
        }
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        if (G.renderSubcellularMarkers) G.renderSubcellularMarkers(ctx, project, cam, w, h);
    };
})();
