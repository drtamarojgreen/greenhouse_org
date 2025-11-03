// docs/js/models_ui.js

(function() {
    'use strict';

    const GreenhouseModelsUI = {
        canvases: {},
        contexts: {},
        state: {}, // This will be a reference to the main app state

        init(state) {
            this.state = state;
        },

        async loadCSS(baseUrl) {
            const cssUrl = `${baseUrl}css/model.css`;
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const link = this.createElement('link', { rel: 'stylesheet', href: cssUrl });
                document.head.appendChild(link);
                await new Promise((resolve, reject) => {
                    link.onload = resolve;
                    link.onerror = reject;
                });
            }
        },

        renderConsentScreen(targetElement) {
            targetElement.innerHTML = '';
            const container = this.createElement('div', { className: 'greenhouse-landing-container' });
            container.innerHTML = `
                <h1 class="greenhouse-simulation-title">Exploring Neural Plasticity: A CBT & DBT Model</h1>
                <p>An interactive simulation to help you visualize how therapeutic practices can change the brain.</p>
                <div class="greenhouse-disclaimer-banner">Please Note: This is an educational simulation, not a medical tool.</div>
                <label class="greenhouse-consent-label">
                    <input type="checkbox" id="consent-checkbox" class="greenhouse-consent-checkbox" data-testid="consent-checkbox">
                    I acknowledge that this is an educational tool and not a substitute for professional medical advice.
                </label>
                <button id="start-simulation-btn" class="greenhouse-btn-primary" disabled>Launch Simulation</button>
            `;
            targetElement.appendChild(container);
        },

        renderSimulationInterface(targetElement) {
            targetElement.innerHTML = '';
            const mainContainer = this.createElement('div', { className: 'simulation-main-container' });
            const topBanner = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'For Educational Purposes: This model simulates conceptual brain activity.');

            const contentArea = this.createElement('div', { className: 'simulation-content-area' });
            const leftColumn = this.createElement('div', { className: 'simulation-left-column' });
            const rightColumn = this.createElement('div', { className: 'simulation-right-column' });

            const canvasSynaptic = this.createElement('canvas', { id: 'canvas-synaptic', style: 'width: 100%; height: 250px; background: #f0f0f0; border-radius: 12px; margin-bottom: 15px;' });
            const canvasNetwork = this.createElement('canvas', { id: 'canvas-network', style: 'width: 100%; height: 250px; background: #f0f0f0; border-radius: 12px; margin-bottom: 15px;' });
            const canvasEnvironment = this.createElement('canvas', { id: 'canvas-environment', style: 'width: 100%; height: 250px; background: #e9e9e9; border-radius: 12px;' });
            
            const synapticControls = this.createElement('div', { id: 'controls-synaptic' });
            const networkControls = this.createElement('div', { id: 'controls-network' });
            const environmentControls = this.createElement('div', { id: 'controls-environment' });

            leftColumn.append(canvasSynaptic, synapticControls, canvasNetwork, networkControls, canvasEnvironment, environmentControls);

            const synapticMetrics = this.createElement('div', { id: 'metrics-synaptic' });
            const networkMetrics = this.createElement('div', { id: 'metrics-network' });

            rightColumn.append(synapticMetrics, networkMetrics);

            contentArea.append(leftColumn, rightColumn);
            mainContainer.append(topBanner, contentArea);

            this.replaceMainContainer(targetElement, mainContainer);

            this.populateControlsPanel(synapticControls, 'synaptic');
            this.populateControlsPanel(networkControls, 'network');
            this.populateControlsPanel(environmentControls, 'environment');
            this.populateMetricsPanel(synapticMetrics, 'synaptic');
            this.populateMetricsPanel(networkMetrics, 'network');

            this.canvases = {
                synaptic: document.getElementById('canvas-synaptic'),
                network: document.getElementById('canvas-network'),
                environment: document.getElementById('canvas-environment')
            };
            this.contexts = {
                synaptic: this.canvases.synaptic.getContext('2d'),
                network: this.canvases.network.getContext('2d'),
                environment: this.canvases.environment.getContext('2d')
            };

            this.resizeAllCanvases();
            this.drawSynapticView();
            this.drawNetworkView();
        },

        replaceMainContainer(targetElement, newContainer) {
            if (this.state.mainAppContainer && this.state.mainAppContainer.parentNode) {
                this.state.mainAppContainer.remove();
            }
            targetElement.appendChild(newContainer);
            this.state.mainAppContainer = newContainer;
        },

        populateMetricsPanel(panel, type) {
            panel.innerHTML = `
                <h3 class="greenhouse-panel-title">Real-Time Metrics (${type})</h3>
                <p>Synaptic Weight: <span id="metric-weight-${type}">0.50</span></p>
                <p>Neurotransmitters Released: <span id="metric-neuro-${type}">0</span></p>
                <p>Ions Crossed: <span id="metric-ions-${type}">0</span></p>
                <p>Learning Metric: <span id="metric-learning-${type}">0.0</span></p>
            `;
        },

        populateControlsPanel(container, type) {
            const controlsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            if (type === 'synaptic' || type === 'network') {
                controlsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">Simulation Controls (${type})</h3>
                    <div class="control-group">
                        <label>Practice Intensity</label>
                        <input type="range" min="0" max="100" value="50" class="greenhouse-slider" id="intensity-slider-${type}">
                    </div>
                    <div class="control-group">
                        <label>Simulation Speed</label>
                        <select class="greenhouse-select" id="speed-select-${type}">
                            <option>Slow</option>
                            <option selected>Normal</option>
                            <option>Fast</option>
                        </select>
                    </div>
                    <div class="button-group">
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="play-pause-btn-${type}">Play</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn-${type}">Reset Plasticity</button>
                    </div>
                `;
            } else if (type === 'environment') {
                controlsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">Environment Controls</h3>
                    <div class="control-group">
                        <label>External Influence</label>
                        <select class="greenhouse-select" id="environment-type-select">
                            <option value="NEUTRAL">Neutral</option>
                            <option value="POSITIVE">Positive (e.g., CBT)</option>
                            <option value="NEGATIVE">Negative (e.g., Stress)</option>
                        </select>
                    </div>
                `;
            }

            const instructionsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            instructionsPanel.innerHTML = `
                <h3 class="greenhouse-panel-title">How to Use</h3>
                <p>Use the controls to see how different parameters affect the strength of neural connections in real-time.</p>
            `;
            container.appendChild(controlsPanel);
            container.appendChild(instructionsPanel);
        },

        updateMetrics() {
            document.getElementById('metric-weight-synaptic').textContent = this.state.synaptic.synapticWeight.toFixed(2);
            document.getElementById('metric-neuro-synaptic').textContent = this.state.synaptic.neurotransmitters;
            document.getElementById('metric-ions-synaptic').textContent = this.state.synaptic.ionsCrossed;
            document.getElementById('metric-learning-synaptic').textContent = this.state.synaptic.learningMetric.toFixed(2);
            document.getElementById('metric-weight-network').textContent = this.state.network.synapticWeight.toFixed(4);
        },

        updateParticles() {
            const ctx = this.contexts.synaptic;
            const canvas = this.canvases.synaptic;
            const { width, height } = canvas;
            const releaseZoneY = height / 2 - 55;
            const receptorZoneY = height / 2 - 5;
            const terminalWidth = width / 2.5;

            this.state.synaptic.particles.forEach((p, index) => {
                p.y += p.vy;
                p.x += p.vx;
                p.opacity -= 0.01; // Fade out

                if (p.y > receptorZoneY || p.opacity <= 0) {
                    // Create a binding flash effect
                    if (p.y > receptorZoneY) {
                        ctx.fillStyle = `rgba(255, 255, 100, ${p.opacity * 2})`;
                        ctx.beginPath();
                        ctx.arc(p.x, receptorZoneY, 8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    this.state.synaptic.particles.splice(index, 1);
                    return;
                }

                ctx.fillStyle = `rgba(0, 123, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            if (this.state.synaptic.isRunning) {
                const newParticles = this.state.synaptic.neurotransmitters / 25; // Adjusted density
                for (let i = 0; i < newParticles; i++) {
                    this.state.synaptic.particles.push({
                        x: width / 2 + (Math.random() - 0.5) * terminalWidth,
                        y: releaseZoneY + (Math.random() * 20), // Release from a zone
                        vx: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
                        vy: 0.8 + Math.random() * 0.5, // Slower, more deliberate speed
                        radius: 2 + Math.random() * 1,
                        opacity: 0.8 + Math.random() * 0.2 // Initial opacity
                    });
                }
            }
        },

        drawSynapticView() {
            const ctx = this.contexts.synaptic;
            const canvas = this.canvases.synaptic;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const preSynapticY = height / 2 - 40;
            const postSynapticY = height / 2 + 40;
            const terminalWidth = width / 2.5;

            // Pre-synaptic terminal (more detailed)
            ctx.fillStyle = 'rgba(115, 39, 81, 0.7)';
            ctx.strokeStyle = 'rgba(85, 9, 51, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - terminalWidth, preSynapticY - 60);
            ctx.quadraticCurveTo(width / 2, preSynapticY + 20, width / 2 + terminalWidth, preSynapticY - 60);
            ctx.stroke();
            ctx.fill();

            // Synaptic vesicles
            const releaseZoneY = preSynapticY - 15;
            this.state.synaptic.vesicles.forEach(v => {
                const x = width / 2 + (v.x - 0.5) * terminalWidth * 1.5;
                let y = releaseZoneY - 5 - v.y * 40;

                let radius = 4;
                if (v.state === 'FUSING') {
                    y += 5; // Move closer to membrane
                    radius = 5; // Swell before release
                }

                if (v.state !== 'RELEASED') {
                    ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Synaptic Cleft
            const cleftTop = preSynapticY - 10;
            const cleftBottom = postSynapticY - 70;
            const gradient = ctx.createLinearGradient(0, cleftTop, 0, cleftBottom);
            gradient.addColorStop(0, 'rgba(240, 240, 240, 0.1)');
            gradient.addColorStop(0.5, 'rgba(220, 220, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(240, 240, 240, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, cleftTop, width, cleftBottom - cleftTop);


            // Post-synaptic terminal (more detailed) with receptors
            ctx.fillStyle = 'rgba(53, 116, 56, 0.7)';
            ctx.strokeStyle = 'rgba(23, 86, 26, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - terminalWidth, postSynapticY);
            ctx.quadraticCurveTo(width / 2, postSynapticY - 120, width / 2 + terminalWidth, postSynapticY);
            ctx.stroke();
            ctx.fill();

            // Receptors
            const receptorCount = 20;
            ctx.fillStyle = 'rgba(70, 150, 255, 0.9)';
            for (let i = 0; i < receptorCount; i++) {
                const x = width / 2 + (i - receptorCount / 2) * (terminalWidth * 1.2 / receptorCount);
                const y = postSynapticY - 75;
                ctx.fillRect(x, y, 3, 8);
            }

            this.updateParticles();

            // Synaptic strength indicator (more subtle)
            ctx.fillStyle = `rgba(255, 255, 100, ${this.state.synaptic.synapticWeight * 0.5})`;
            ctx.beginPath();
            const strengthRadius = this.state.synaptic.synapticWeight * 15;
            ctx.arc(width / 2, height / 2 - 25, strengthRadius, 0, Math.PI * 2);
            ctx.fill();
        },

        drawNeuron(ctx, x, y, radius, node) {
            const { activation, state } = node;
            let baseColor, highlightColor, shadowColor;

            switch (state) {
                case 'FIRING':
                    baseColor = `rgba(255, 255, 150, ${0.8 + activation * 0.2})`;
                    highlightColor = 'rgba(255, 255, 200, 0.9)';
                    shadowColor = `rgba(255, 255, 0, ${activation * 0.7})`;
                    break;
                case 'REFRACTORY':
                    baseColor = `rgba(100, 120, 150, 0.6)`;
                    highlightColor = 'rgba(150, 180, 200, 0.7)';
                    shadowColor = 'rgba(0, 0, 0, 0)';
                    break;
                case 'RESTING':
                default:
                    baseColor = `rgba(53, 116, 56, 0.8)`;
                    highlightColor = 'rgba(150, 255, 150, 0.9)';
                    shadowColor = `rgba(180, 255, 180, ${activation * 0.7})`;
                    break;
            }

            // Soma (cell body)
            const somaGradient = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, radius * 0.1, x, y, radius);
            somaGradient.addColorStop(0, highlightColor);
            somaGradient.addColorStop(1, baseColor);

            ctx.fillStyle = somaGradient;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 15 * activation;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow

            // Axon & Dendrites
            ctx.strokeStyle = `rgba(45, 62, 45, ${0.5 + activation * 0.3})`;
            ctx.lineWidth = 1.5 + activation * 1.5;

            // Axon
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.bezierCurveTo(x + radius * 2, y, x + radius * 2.5, y + radius * 1.5, x + radius * 3, y + radius * 3);
            ctx.stroke();

            // Dendrites
            const dendriteCount = 6;
            for (let i = 0; i < dendriteCount; i++) {
                const angle = (i / dendriteCount) * Math.PI * 1.5 - Math.PI * 0.75;
                const startLength = radius * 1.1;
                const endLength = radius * (1.5 + Math.random() * 0.5);
                const startX = x + Math.cos(angle) * startLength;
                const startY = y + Math.sin(angle) * startLength;
                const endX = x + Math.cos(angle) * endLength;
                const endY = y + Math.sin(angle) * endLength;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo((startX + endX) / 2, (startY + endY) / 2, endX, endY);
                ctx.stroke();
            }
        },

        drawNetworkView() {
            const ctx = this.contexts.network;
            const canvas = this.canvases.network;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const scaleX = width / 650;
            const scaleY = height / 350;

            // Draw synapses
            this.state.synapses.forEach(synapse => {
                const fromNode = this.state.networkLayout[synapse.from];
                const toNode = this.state.networkLayout[synapse.to];

                const startX = fromNode.x * scaleX;
                const startY = fromNode.y * scaleY;
                const endX = toNode.x * scaleX;
                const endY = toNode.y * scaleY;

                const blueToWhite = `rgba(${128 + synapse.weight * 127}, ${128 + synapse.weight * 127}, 255, ${0.4 + synapse.weight * 0.6})`;

                ctx.strokeStyle = blueToWhite;
                ctx.lineWidth = 1 + synapse.weight * 4;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            });

            // Draw action potentials
            if (this.state.network.actionPotentials) {
                this.state.network.actionPotentials.forEach(ap => {
                    const fromNode = this.state.networkLayout[ap.from];
                    const toNode = this.state.networkLayout[ap.to];
                    const startX = fromNode.x * scaleX;
                    const startY = fromNode.y * scaleY;
                    const endX = toNode.x * scaleX;
                    const endY = toNode.y * scaleY;

                    const currentX = startX + (endX - startX) * ap.progress;
                    const currentY = startY + (endY - startY) * ap.progress;

                    ctx.fillStyle = 'rgba(255, 255, 150, 0.9)';
                    ctx.shadowColor = 'rgba(255, 255, 0, 1)';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
            }

            // Draw neurons
            this.state.networkLayout.forEach(node => {
                this.drawNeuron(ctx, node.x * scaleX, node.y * scaleY, 12, node);
            });
        },

        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            const canvas = this.canvases.environment;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const { type, auraOpacity } = this.state.environment;
            if (type === 'NEUTRAL') return;

            const color = type === 'POSITIVE' ? 'rgba(100, 200, 255, 0.5)' : 'rgba(255, 100, 100, 0.5)';

            ctx.fillStyle = color;
            ctx.globalAlpha = auraOpacity;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1.0;
        },

        resizeAllCanvases() {
            for (const key in this.canvases) {
                const canvas = this.canvases[key];
                if (canvas) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                }
            }
            this.drawSynapticView();
            this.drawNetworkView();
            this.drawEnvironmentView();
        },

        createElement(tag, attributes = {}, ...children) {
            const el = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else {
                    el.appendChild(child);
                }
            });
            return el;
        }
    };

    window.GreenhouseModelsUI = GreenhouseModelsUI;
})();
