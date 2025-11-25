// docs/js/models_ui.js

(function () {
    'use strict';

    const GreenhouseModelsUI = {
        canvases: {},
        contexts: {},
        state: {}, // This will be a reference to the main app state

        init(state, GreenhouseModelsUtil) {
            this.state = state;
            this.util = GreenhouseModelsUtil;
            Object.assign(this, GreenhouseModelsUISynapse);
            Object.assign(this, GreenhouseModelsUIBrain);
            Object.assign(this, GreenhouseModelsUIEnvironment);
        },

        async loadCSS(baseUrl) {
            const cssUrl = `${baseUrl}css/model.css`;
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const link = GreenhouseModelsUtil.createElement('link', { rel: 'stylesheet', href: cssUrl });
                document.head.appendChild(link);
                await new Promise((resolve, reject) => {
                    link.onload = resolve;
                    link.onerror = reject;
                });
            }
        },

        renderConsentScreen(targetElement) {
            targetElement.innerHTML = '';
            const container = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-landing-container' });
            container.innerHTML = `
                <h1 class="greenhouse-simulation-title">Exploring Neural Plasticity: A CBT & DBT Model</h1>
                <p>An interactive simulation to help you visualize how therapeutic practices can change the brain.</p>
                <div class="greenhouse-disclaimer-banner">Please Note: This is an educational simulation, not a medical tool.</div>
                <label class="greenhouse-consent-label">
                    <input type="checkbox" id="consent-checkbox" class="greenhouse-consent-checkbox" data-testid="consent-checkbox">
                    I acknowledge that this is an educational tool and not a substitute for professional medical advice.
                </label>
                <button id="start-simulation-btn" class="greenhouse-btn-primary" disabled data-testid="start-simulation-btn">Launch Simulation</button>
            `;
            targetElement.appendChild(container);
        },

        renderSimulationInterface(targetElement) {
            targetElement.innerHTML = '';
            const mainContainer = GreenhouseModelsUtil.createElement('div', { className: 'simulation-main-container' });
            const topBanner = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'For Educational Purposes: This model simulates conceptual brain activity.');

            const contentArea = GreenhouseModelsUtil.createElement('div', { className: 'simulation-content-area' });
            const leftColumn = GreenhouseModelsUtil.createElement('div', { className: 'simulation-left-column' });
            const rightColumn = GreenhouseModelsUtil.createElement('div', { className: 'simulation-right-column' });

            const canvasSynaptic = GreenhouseModelsUtil.createElement('canvas', { id: 'canvas-synaptic', style: 'width: 100%; height: 250px; background: #f0f0f0; border-radius: 12px; margin-bottom: 15px;' });
            const canvasNetwork = GreenhouseModelsUtil.createElement('canvas', { id: 'canvas-network', style: 'width: 100%; height: 250px; background: #f0f0f0; border-radius: 12px; margin-bottom: 15px;' });
            const canvasEnvironment = GreenhouseModelsUtil.createElement('canvas', { id: 'canvas-environment', style: 'width: 100%; height: 250px; background: #e9e9e9; border-radius: 12px;' });

            const synapticControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-synaptic' });
            const networkControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-network' });
            const environmentControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-environment' });

            const generalControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-general' });

            // The third canvas (Environment) goes on the left.
            leftColumn.append(canvasEnvironment, environmentControls, generalControls);

            // The first two canvases (Synaptic, Network) and their controls go on the right.
            rightColumn.append(canvasSynaptic, synapticControls, canvasNetwork, networkControls);

            const synapticMetrics = GreenhouseModelsUtil.createElement('div', { id: 'metrics-synaptic' });
            const networkMetrics = GreenhouseModelsUtil.createElement('div', { id: 'metrics-network' });

            // The metrics also go on the right.
            rightColumn.append(synapticMetrics, networkMetrics);

            contentArea.append(leftColumn, rightColumn);
            mainContainer.append(topBanner, contentArea);

            this.replaceMainContainer(targetElement, mainContainer);

            this.populateControlsPanel(synapticControls, 'synaptic');
            this.populateControlsPanel(networkControls, 'network');
            this.populateControlsPanel(document.getElementById('controls-environment'), 'environment');
            this.populateControlsPanel(document.getElementById('controls-general'), 'general');
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
            this._drawLoadingState(this.contexts.environment, this.canvases.environment);
        },

        _drawLoadingState(ctx, canvas) {
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = this.state.darkMode ? '#1A1A1A' : '#E9E9E9';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = this.state.darkMode ? '#FFFFFF' : '#000000';
            ctx.font = '20px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Simulation...', width / 2, height / 2);
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
            const controlsPanel = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-controls-panel' });
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
                    <div class="button-group">
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="play-pause-btn-${type}">Play</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn-${type}">Reset Plasticity</button>
                    </div>
                `;
            } else if (type === 'environment') {
                controlsHtml += `
                    <h3 class="greenhouse-panel-title">Environment Controls</h3>
                    <div class="control-group">
                        <label>Environmental Stress</label>
                        <input type="range" min="0" max="1" step="0.01" value="0.5" class="greenhouse-slider" id="stress-slider">
                    </div>
                    <div class="control-group">
                        <label>Social Support Level</label>
                        <input type="range" min="0" max="1" step="0.01" value="0.5" class="greenhouse-slider" id="support-slider">
                    </div>
                    <div class="control-group">
                        <label>Genetic Factors</label>
                        <div class="button-group">
                            <button class="greenhouse-btn greenhouse-btn-secondary" id="gene-btn-1">Gene A</button>
                            <button class="greenhouse-btn greenhouse-btn-secondary" id="gene-btn-2">Gene B</button>
                        </div>
                    </div>
                `;
            } else if (type === 'general') {
                controlsHtml += `
                    <h3 class="greenhouse-panel-title">General Controls</h3>
                    <div class="button-group">
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn-general">Reset Simulation</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="share-btn-general">Share View</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="download-btn-general">Download Image</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="dark-mode-toggle">Toggle Dark Mode</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="fullscreen-btn-general">Full Screen</button>
                    </div>
                `;
            }

            controlsPanel.innerHTML = controlsHtml;
            container.appendChild(controlsPanel);

            if (type === 'synaptic' || type === 'network') {
                const instructionsPanel = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-controls-panel' });
                instructionsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">How to Use</h3>
                    <p>Use the controls to see how different parameters affect the strength of neural connections in real-time.</p>
                `;
                container.appendChild(instructionsPanel);
            } else if (type === 'environment') {
                const instructionsPanel = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-controls-panel' });
                instructionsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">How to Use</h3>
                    <p>Use the sliders to adjust environmental stress and social support. Click the gene buttons to simulate genetic predispositions.</p>
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
        }
    };

    window.GreenhouseModelsUI = GreenhouseModelsUI;
})();
