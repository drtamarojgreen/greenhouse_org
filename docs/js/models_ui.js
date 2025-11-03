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

            // The third canvas (Environment) goes on the left.
            leftColumn.append(canvasEnvironment, environmentControls);

            // The first two canvases (Synaptic, Network) and their controls go on the right.
            rightColumn.append(canvasSynaptic, synapticControls, canvasNetwork, networkControls);

            const synapticMetrics = this.createElement('div', { id: 'metrics-synaptic' });
            const networkMetrics = this.createElement('div', { id: 'metrics-network' });

            // The metrics also go on the right.
            rightColumn.append(synapticMetrics, networkMetrics);

            contentArea.append(leftColumn, rightColumn);
            mainContainer.append(topBanner, contentArea);

            this.replaceMainContainer(targetElement, mainContainer);

            this.populateControlsPanel(synapticControls, 'synaptic');
            this.populateControlsPanel(networkControls, 'network');
            this.populateControlsPanel(document.getElementById('controls-environment'), 'environment');
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
            let controlsHtml = `<h3 class="greenhouse-panel-title">Simulation Controls (${type})</h3>`;

            if (type === 'synaptic' || type === 'network') {
                controlsHtml += `
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
                `;
            }

            controlsHtml += `
                <div class="button-group">
                    <button class="greenhouse-btn greenhouse-btn-secondary" id="play-pause-btn-${type}">Play</button>
                    <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn-${type}">Reset</button>
                </div>
            `;

            controlsPanel.innerHTML = controlsHtml;

            container.appendChild(controlsPanel);

            if (type === 'synaptic' || type === 'network') {
                const instructionsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
                instructionsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">How to Use</h3>
                    <p>Use the controls to see how different parameters affect the strength of neural connections in real-time.</p>
                `;
                container.appendChild(instructionsPanel);
            }
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
            const vesicleCount = 15;
            const releaseZoneY = preSynapticY - 15;
            ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
            for (let i = 0; i < vesicleCount; i++) {
                const x = width / 2 + (Math.random() - 0.5) * terminalWidth * 1.5;
                // Position vesicles closer to the bottom edge of the terminal
                const y = releaseZoneY - 5 - Math.random() * 40;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

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

        drawNeuron(ctx, x, y, radius, activation = 0) {
            // Soma (cell body)
            const somaGradient = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, radius * 0.1, x, y, radius);
            somaGradient.addColorStop(0, 'rgba(150, 255, 150, 0.9)'); // Lighter center for 3D effect
            somaGradient.addColorStop(1, `rgba(53, 116, 56, ${0.8 + activation * 0.2})`); // Base color, brighter with activation

            ctx.fillStyle = somaGradient;
            ctx.shadowColor = `rgba(180, 255, 180, ${activation * 0.7})`;
            ctx.shadowBlur = 15 * activation;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow

            // Axon
            ctx.strokeStyle = `rgba(45, 62, 45, ${0.6 + activation * 0.3})`;
            ctx.lineWidth = 2 + activation * 2;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.bezierCurveTo(x + radius * 2, y, x + radius * 2.5, y + radius * 1.5, x + radius * 3, y + radius * 3);
            ctx.stroke();

            // Dendrites
            const dendriteCount = 6;
            ctx.strokeStyle = `rgba(45, 62, 45, ${0.5 + activation * 0.2})`;
            ctx.lineWidth = 1.5;

            for (let i = 0; i < dendriteCount; i++) {
                const angle = (i / dendriteCount) * Math.PI * 1.5 - Math.PI * 0.75; // Only on one side
                const startLength = radius * (1.1 + Math.random() * 0.2);
                const endLength = radius * (1.5 + Math.random() * 0.5);

                const startX = x + Math.cos(angle) * startLength;
                const startY = y + Math.sin(angle) * startLength;
                const endX = x + Math.cos(angle - 0.1 + Math.random() * 0.2) * endLength;
                const endY = y + Math.sin(angle - 0.1 + Math.random() * 0.2) * endLength;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(
                    (startX + endX) / 2 + (Math.random() - 0.5) * 20,
                    (startY + endY) / 2 + (Math.random() - 0.5) * 20,
                    endX, endY
                );
                ctx.stroke();

                // Smaller branches
                const branchAngle = angle + (Math.random() - 0.5) * 0.5;
                const branchLength = endLength * 0.5;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX + Math.cos(branchAngle) * branchLength,
                    endY + Math.sin(branchAngle) * branchLength
                );
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

            // Draw base connections
            ctx.strokeStyle = 'rgba(45, 62, 45, 0.3)'; // Dimmed base connections
            ctx.lineWidth = 1;
            for (let i = 0; i < this.state.networkLayout.length; i++) {
                for (let j = i + 1; j < this.state.networkLayout.length; j++) {
                    ctx.beginPath();
                    ctx.moveTo(this.state.networkLayout[i].x * scaleX, this.state.networkLayout[i].y * scaleY);
                    ctx.lineTo(this.state.networkLayout[j].x * scaleX, this.state.networkLayout[j].y * scaleY);
                    ctx.stroke();
                }
            }

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
                this.drawNeuron(ctx, node.x * scaleX, node.y * scaleY, 12, node.activation || 0);
            });
        },

        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            if (!ctx) return;
            const canvas = this.canvases.environment;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            // Draw brain outline
            ctx.strokeStyle = '#2d3e2d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 50);
            ctx.bezierCurveTo(width / 4, 50, width / 4, height / 2, width / 2, height - 50);
            ctx.bezierCurveTo(width * 3 / 4, height / 2, width * 3 / 4, 50, width / 2, 50);
            ctx.stroke();

            // Draw icons
            const factors = ['community', 'society', 'genetics', 'environment'];
            factors.forEach((factor, index) => {
                const angle = (index / factors.length) * 2 * Math.PI;
                const x = width / 2 + Math.cos(angle) * 100;
                const y = height / 2 + Math.sin(angle) * 100;
                const value = this.state.environment[factor];

                ctx.fillStyle = `rgba(53, 116, 56, ${value})`;
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, 2 * Math.PI);
                ctx.fill();

                ctx.fillStyle = '#2d3e2d';
                ctx.font = '12px Quicksand, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(factor, x, y + 30);
            });
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
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    el.setAttribute('class', value);
                } else {
                    el.setAttribute(key, value);
                }
            });
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
