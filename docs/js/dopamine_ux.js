/**
 * @file dopamine_ux.js
 * @description UX, Accessibility, and Welcome workflow for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.uxState = {
        fps: 0,
        lastTime: performance.now(),
        frames: 0,
        showPerf: true,
        language: 'en',
        palette: 'default',
        history: JSON.parse(localStorage.getItem('dopamine_sim_history') || '{"favModes": [], "viewedTutorial": false}'),
        isPaused: false,
        reducedMotion: false
    };

    G.initUX = function () {
        this.setupKeyboardShortcuts();
        this.checkWelcome();
    };

    G.checkWelcome = function () {
        // Show welcome modal if not viewed or if forced
        if (!G.uxState.history.viewedTutorial) {
            setTimeout(() => this.showWelcomeModal(), 1000);
        }
    };

    G.showWelcomeModal = function () {
        let modal = document.getElementById('dopamine-welcome-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dopamine-welcome-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '2000';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background: #1a202c; border: 2px solid #4fd1c5; border-radius: 15px; padding: 30px; max-width: 600px; color: #fff; box-shadow: 0 0 30px rgba(79, 209, 197, 0.3); font-family: sans-serif;">
                <h2 style="color: #4fd1c5; margin-top: 0; text-align: center;">Welcome to the Dopamine Signaling Complex</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #cbd5e0;">
                    You are exploring a high-fidelity simulation of dopamine signaling in the striatum, featuring <b>100 scientific enhancements</b> covering molecular pathways, synaptic dynamics, and circuit-level interactions.
                </p>
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="font-size: 16px; margin-top: 0; color: #fff;">Quick Visual Guide:</h3>
                    <ul style="font-size: 13px; color: #a0aec0; padding-left: 20px;">
                        <li><b style="color: #ff4d4d;">Red/Blue Spheres:</b> D1 and D2 Receptors with dynamic IL3/C-tail modeling.</li>
                        <li><b style="color: #5c4033;">Brown Circles:</b> Striosome compartments (Patch neurons).</li>
                        <li><b style="color: #008080;">Cyan Area:</b> Striatal Matrix environment.</li>
                        <li><b style="color: #00ff00;">Green Glow:</b> Extracellular Dopamine flux (Volume Transmission).</li>
                    </ul>
                </div>
                <p style="font-size: 13px; color: #718096; font-style: italic;">
                    Use the <b>Scientific Report</b> button to track all 100 enhancements and view real-time analytic charts.
                </p>
                <div style="display: flex; justify-content: center; margin-top: 20px;">
                    <button id="close-welcome" style="background: #4fd1c5; color: #1a202c; border: none; padding: 10px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s;">ENTER SIMULATION</button>
                </div>
            </div>
        `;

        document.getElementById('close-welcome').onclick = () => {
            modal.style.display = 'none';
            G.uxState.history.viewedTutorial = true;
            localStorage.setItem('dopamine_sim_history', JSON.stringify(G.uxState.history));
            G.state.signalingActive = true;
        };

        modal.style.display = 'flex';
    };

    G.setupKeyboardShortcuts = function () {
        window.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'p':
                    G.uxState.isPaused = !G.uxState.isPaused;
                    break;
                case 'r':
                    G.resetToDefault();
                    break;
                case 'h':
                    this.showWelcomeModal();
                    break;
                case 's':
                    if (G.showScientificDashboard) G.showScientificDashboard();
                    break;
            }
        });
    };

    G.updateUX = function () {
        const now = performance.now();
        G.uxState.frames++;
        if (now > G.uxState.lastTime + 1000) {
            G.uxState.fps = Math.round((G.uxState.frames * 1000) / (now - G.uxState.lastTime));
            G.uxState.lastTime = now;
            G.uxState.frames = 0;
        }
        this.handleContextualCursor();

        // Update UI metrics in the right panel
        if (G.uxState.showPerf && G.rightPanel && G.updateMetric) {
            G.updateMetric(G.rightPanel, 'Performance', 'FPS', G.uxState.fps);
        }
    };

    G.handleContextualCursor = function () {
        if (!G.canvas) return;
        const hoverTarget = G.hoverTarget;
        if (hoverTarget) {
            G.canvas.style.cursor = 'help';
        } else if (G.isDragging) {
            G.canvas.style.cursor = 'grabbing';
        } else {
            G.canvas.style.cursor = 'crosshair';
        }
    };

    G.renderUX = function (ctx) {
        const w = G.width;
        const h = G.height;

        if (G.uxState.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', w / 2, h / 2);
            ctx.font = '16px Arial';
            ctx.fillText('Press P to Resume', w / 2, h / 2 + 40);
        }
    };

    G.resetToDefault = function () {
        console.log("Resetting simulation...");
        G.state.timer = 0;
        G.state.mode = 'D1R Signaling';
        G.state.signalingActive = true;

        if (G.resetMolecular) G.resetMolecular();
        if (G.resetSynapse) G.resetSynapse();
        if (G.resetElectrophysiology) G.resetElectrophysiology();

        // Clear history viewed flag if they want to see tutorial again on reset?
        // No, keep it, but provide 'H' shortcut.
    };
})();
