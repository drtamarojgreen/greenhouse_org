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

            // The third canvas (Environment) goes on the left.
            leftColumn.append(canvasEnvironment);

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
            const cleftTop = height / 2 - 10;
            const cleftBottom = height / 2 + 10;

            this.state.synaptic.particles.forEach((p, index) => {
                p.y += p.vy;
                if (p.y > cleftBottom) {
                    this.state.synaptic.particles.splice(index, 1);
                    return;
                }
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            if (this.state.synaptic.isRunning) {
                const newParticles = this.state.synaptic.neurotransmitters / 20;
                for (let i = 0; i < newParticles; i++) {
                    this.state.synaptic.particles.push({
                        x: Math.random() * (width * 0.6) + (width * 0.2),
                        y: cleftTop - 5,
                        vy: 1 + Math.random(),
                        radius: 2 + Math.random() * 2,
                        color: `rgba(0, 123, 255, ${Math.random() * 0.5 + 0.5})`
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

            const preSynapticY = height / 2 - 50;
            const cleftHeight = 20;

            ctx.fillStyle = 'rgba(115, 39, 81, 0.8)';
            ctx.beginPath();
            ctx.arc(width / 2, preSynapticY, width / 3, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, preSynapticY + 30, width, cleftHeight);

            ctx.fillStyle = 'rgba(53, 116, 56, 0.8)';
            ctx.beginPath();
            ctx.arc(width / 2, height / 2 + 50, width / 3, 1.2 * Math.PI, 1.8 * Math.PI, true);
            ctx.fill();

            this.updateParticles();

            ctx.fillStyle = `rgba(45, 62, 45, ${this.state.synaptic.synapticWeight * 0.7})`;
            ctx.fillRect(width * 0.2, height / 2 - 5, width * 0.6, 10);
        },

        drawNeuron(ctx, x, y, radius) {
            ctx.fillStyle = 'rgba(53, 116, 56, 0.9)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            const dendriteCount = 5 + Math.floor(Math.random() * 3);
            ctx.strokeStyle = 'rgba(45, 62, 45, 0.7)';
            ctx.lineWidth = 1.5;

            for (let i = 0; i < dendriteCount; i++) {
                const angle = (i / dendriteCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const length = radius * (1.5 + Math.random());
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
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

            ctx.strokeStyle = '#2d3e2d';
            for (let i = 0; i < this.state.networkLayout.length; i++) {
                for (let j = i + 1; j < this.state.networkLayout.length; j++) {
                    const weight = (i + j) % 3 === 0 ? this.state.synaptic.synapticWeight : 0.2 + Math.random() * 0.2;
                    ctx.lineWidth = weight * 5;
                    ctx.beginPath();
                    ctx.moveTo(this.state.networkLayout[i].x * scaleX, this.state.networkLayout[i].y * scaleY);
                    ctx.lineTo(this.state.networkLayout[j].x * scaleX, this.state.networkLayout[j].y * scaleY);
                    ctx.stroke();
                }
            }

            this.state.networkLayout.forEach(node => {
                this.drawNeuron(ctx, node.x * scaleX, node.y * scaleY, 12);
            });
        },

        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            const canvas = this.canvases.environment;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
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
