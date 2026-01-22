/**
 * @file dopamine_ux.js
 * @description UX, Accessibility, and Workflow enhancements for Dopamine Simulation.
 * Covers Enhancements 91-100.
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
        palette: 'default', // default, deuteranopia, protanopia, tritanopia
        history: JSON.parse(localStorage.getItem('dopamine_sim_history') || '{"favModes": [], "viewedTutorials": []}'),
        isPaused: false
    };

    G.initUX = function () {
        this.setupKeyboardShortcuts();
        this.setupHistory();
    };

    G.setupKeyboardShortcuts = function () {
        window.addEventListener('keydown', (e) => {
            // 94. Keyboard Shortcuts
            switch (e.key.toLowerCase()) {
                case 'p':
                    G.uxState.isPaused = !G.uxState.isPaused;
                    console.log(G.uxState.isPaused ? "Simulation Paused" : "Simulation Resumed");
                    break;
                case 'r':
                    G.resetToDefault();
                    break;
                case 'm':
                    this.cycleModes();
                    break;
            }
        });
    };

    G.cycleModes = function () {
        const modes = [
            'D1R Signaling', 'D2R Signaling', 'Heteromer',
            'Parkinsonian', 'L-DOPA Pulse',
            'Cocaine', 'Amphetamine', 'Phasic Burst',
            'Schizophrenia', 'ADHD'
        ];
        let currentIndex = modes.indexOf(G.state.mode);
        let nextIndex = (currentIndex + 1) % modes.length;
        G.state.mode = modes[nextIndex];
        console.log(`Mode switched to: ${G.state.mode}`);
    };

    G.setupHistory = function () {
        // 95. User Profile / History
        if (!G.uxState.history.favModes.includes(G.state.mode)) {
            G.uxState.history.favModes.push(G.state.mode);
            localStorage.setItem('dopamine_sim_history', JSON.stringify(G.uxState.history));
        }
    };

    G.updateUX = function () {
        // 98. Simulation Performance Monitor (FPS)
        const now = performance.now();
        G.uxState.frames++;
        if (now > G.uxState.lastTime + 1000) {
            G.uxState.fps = Math.round((G.uxState.frames * 1000) / (now - G.uxState.lastTime));
            G.uxState.lastTime = now;
            G.uxState.frames = 0;
        }

        // 99. Contextual Cursor
        this.handleContextualCursor();
    };

    G.handleContextualCursor = function () {
        if (!G.canvas) return;
        const hoverTarget = G.hoverTarget; // Provided by dopamine_tooltips.js or similar
        if (hoverTarget) {
            G.canvas.style.cursor = 'pointer';
        } else if (G.isDragging) {
            G.canvas.style.cursor = 'grabbing';
        } else {
            G.canvas.style.cursor = 'crosshair';
        }
    };

    G.renderUX = function (ctx) {
        const w = G.width;
        const h = G.height;

        if (G.uxState.showPerf) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(w - 60, h - 30, 50, 20);
            ctx.fillStyle = '#0f0';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`FPS: ${G.uxState.fps}`, w - 15, h - 17);
        }

        if (G.uxState.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', w / 2, h / 2);
        }
    };

    // 100. Reset to Default Safety
    G.resetToDefault = function () {
        console.log("Resetting simulation to default parameters...");
        // Instead of a full reload, reset the core state properties
        G.state.atpConsumed = 0;
        G.state.timer = 0;
        G.state.scenarios = {
            cocaine: false,
            amphetamine: false,
            adhd: false,
            parkinsonian: false,
            schizophrenia: false,
            highStress: false,
            neuroinflammation: false,
            alphaSynuclein: false,
            heteromer: false,
            maoi: false
        };
        G.state.mode = 'D1R';
        G.state.cinematicCamera = true;

        // Reset specific module states if they exist
        if (G.resetMolecular) G.resetMolecular();
        if (G.resetSynapse) G.resetSynapse();
        if (G.resetElectrophysiology) G.resetElectrophysiology();
        if (G.resetCircuit) G.resetCircuit();

        console.log("Simulation state reset complete.");
    };

    // 97. Collaboration Mode (Placeholder logic)
    G.uxState.isCollaborating = false;
    G.toggleCollaboration = function () {
        G.uxState.isCollaborating = !G.uxState.isCollaborating;
        if (G.uxState.isCollaborating) {
            console.log("Collaboration Mode: Session shared. (Simulated)");
            // Add a visual indicator for collaboration
            G.uxState.collabID = Math.random().toString(36).substring(7).toUpperCase();
        } else {
            console.log("Collaboration Mode: Offline.");
        }
    };

    const originalRenderUX = G.renderUX;
    G.renderUX = function (ctx) {
        originalRenderUX.call(this, ctx);
        const w = G.width;
        if (G.uxState.isCollaborating) {
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`COLLAB ACTIVE: ${G.uxState.collabID}`, w - 10, 20);
        }
    };

})();
