// docs/js/models.js

(function() {
    'use strict';

    const GreenhouseModels = {
        // --- State Management ---
        state: {
            intensity: 50,
            speed: 'Normal',
            isRunning: false,
            synapticWeight: 0.5,
            neurotransmitters: 0,
            ionsCrossed: 0,
            learningMetric: 0,
            animationFrameId: null
        },

        // --- Initialization ---
        init(targetSelector, baseUrl) {
            this.targetElement = document.querySelector(targetSelector);
            if (!this.targetElement) {
                console.error('Models App: Target element not found');
                return;
            }
            this.state.baseUrl = baseUrl;
            this.loadCSS();
            this.renderConsentScreen();
        },

        async loadCSS() {
            const cssUrl = `${this.state.baseUrl}css/model.css`;
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.type = 'text/css';
                linkElement.href = cssUrl;
                document.head.appendChild(linkElement);
                await new Promise((resolve, reject) => {
                    linkElement.onload = resolve;
                    linkElement.onerror = reject;
                });
            }
        },

        // --- UI Rendering ---
        renderConsentScreen() {
            const container = this.createElement('div', { className: 'greenhouse-landing-container' });
            // ... (consent screen UI remains the same)
            const title = this.createElement('h1', { className: 'greenhouse-simulation-title' }, 'Neural Plasticity & CBT/DBT');
            const intro = this.createElement('p', {}, 'This is a browser-based educational simulation...');
            const disclaimer = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — Educational model only...');
            const consentLabel = this.createElement('label', { className: 'greenhouse-consent-label' });
            const consentCheckbox = this.createElement('input', { type: 'checkbox', id: 'consent-checkbox', className: 'greenhouse-consent-checkbox', 'data-testid': 'consent-checkbox' });
            consentLabel.append(consentCheckbox, 'I understand this simulation is educational only and not a substitute for clinical care.');
            const startButton = this.createElement('button', { id: 'start-simulation-btn', className: 'greenhouse-btn-primary' }, 'Start Simulation');
            startButton.disabled = true;

            container.append(title, intro, disclaimer, consentLabel, startButton);
            this.targetElement.appendChild(container);

            this.addConsentListeners();
        },

        renderSimulationInterface() {
            this.targetElement.innerHTML = '';
            const mainContainer = this.createElement('div', { className: 'simulation-main-container' });
            // ... (simulation interface structure remains the same)
            const topBanner = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — not clinical therapy.');
            const contentArea = this.createElement('div', { style: 'display: flex; gap: 20px; margin-top: 20px;' });
            const leftColumn = this.createElement('div', { style: 'flex: 3;' });
            const canvas = this.createElement('canvas', { id: 'simulation-canvas', style: 'width: 100%; height: 400px; background: #f0f0f0; border-radius: 12px;' });
            const metricsPanel = this.createElement('div', { id: 'metrics-panel', className: 'greenhouse-metrics-panel' });
            // ... metrics panel structure
            const rightColumn = this.createElement('div', { style: 'flex: 1;' });
            const controlsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            // ... controls panel structure

            // Appending elements and adding simulation event listeners...
            this.targetElement.appendChild(mainContainer);
            mainContainer.append(topBanner, contentArea);
            contentArea.append(leftColumn, rightColumn);
            leftColumn.append(canvas, metricsPanel);

            this.populateMetricsPanel(metricsPanel);
            this.populateControlsPanel(rightColumn); // Changed to pass rightColumn

            this.canvas = document.getElementById('simulation-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            this.drawCanvas();
            this.addSimulationListeners();
        },

        populateMetricsPanel(panel) {
            panel.innerHTML = `
                <h3 class="greenhouse-panel-title">Metrics</h3>
                <p>Synaptic Weight: <span id="metric-weight">0.50</span></p>
                <p>Neurotransmitters Released: <span id="metric-neuro">0</span></p>
                <p>Ions Crossed: <span id="metric-ions">0</span></p>
                <p>Learning Metric: <span id="metric-learning">0.0</span></p>
            `;
        },

        populateControlsPanel(container) {
            const controlsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            controlsPanel.innerHTML = `
                <h3 class="greenhouse-panel-title">Controls</h3>
                <label>Practice Intensity</label>
                <input type="range" min="0" max="100" value="50" class="greenhouse-slider" id="intensity-slider">
                <label>Simulation Speed</label>
                <select class="greenhouse-select" id="speed-select">
                    <option>Slow</option>
                    <option selected>Normal</option>
                    <option>Fast</option>
                </select>
                <button class="greenhouse-btn-secondary" id="play-pause-btn" style="margin-top: 10px;">Play</button>
                <button class="greenhouse-btn-secondary" id="reset-btn" style="margin-top: 10px;">Reset Plasticity</button>
            `;
            const instructionsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            instructionsPanel.innerHTML = `
                <h3 class="greenhouse-panel-title">Instructions</h3>
                <p>Adjust the "Practice Intensity" to see how it affects the neural connections.</p>
            `;
            container.append(controlsPanel, instructionsPanel);
        },


        // --- Event Listeners ---
        addConsentListeners() {
            const consentCheckbox = document.getElementById('consent-checkbox');
            const startButton = document.getElementById('start-simulation-btn');

            consentCheckbox.addEventListener('change', () => {
                startButton.disabled = !consentCheckbox.checked;
            });

            startButton.addEventListener('click', () => this.renderSimulationInterface());
        },

        addSimulationListeners() {
            document.getElementById('intensity-slider').addEventListener('input', e => {
                this.state.intensity = parseInt(e.target.value, 10);
                if (!this.state.isRunning) this.drawCanvas(); // Update view if paused
            });
            document.getElementById('speed-select').addEventListener('change', e => {
                this.state.speed = e.target.value;
            });
            document.getElementById('play-pause-btn').addEventListener('click', e => {
                this.state.isRunning = !this.state.isRunning;
                e.target.textContent = this.state.isRunning ? 'Pause' : 'Play';
                if (this.state.isRunning) this.simulationLoop();
            });
            document.getElementById('reset-btn').addEventListener('click', () => {
                this.state.isRunning = false;
                document.getElementById('play-pause-btn').textContent = 'Play';
                Object.assign(this.state, {
                    synapticWeight: 0.5, neurotransmitters: 0, ionsCrossed: 0, learningMetric: 0
                });
                this.updateMetrics();
                this.drawCanvas();
            });
            window.addEventListener('resize', () => this.resizeCanvas());
        },

        // --- Simulation & Drawing ---
        simulationLoop() {
            if (!this.state.isRunning) {
                cancelAnimationFrame(this.state.animationFrameId);
                return;
            }

            // Simple logic: intensity increases weight, with some decay
            const potentiation = (this.state.intensity / 10000);
            const decay = 0.0005;
            this.state.synapticWeight += potentiation - decay;
            this.state.synapticWeight = Math.max(0.1, Math.min(1.0, this.state.synapticWeight));

            // Update other metrics based on weight and intensity
            this.state.neurotransmitters = Math.floor(this.state.intensity * this.state.synapticWeight);
            this.state.ionsCrossed = Math.floor(this.state.neurotransmitters * 1.5);
            this.state.learningMetric = this.state.synapticWeight;

            this.updateMetrics();
            this.drawCanvas();

            const speedMap = { 'Slow': 1000, 'Normal': 500, 'Fast': 250 };
            setTimeout(() => {
                this.state.animationFrameId = requestAnimationFrame(() => this.simulationLoop());
            }, speedMap[this.state.speed]);
        },

        updateMetrics() {
            document.getElementById('metric-weight').textContent = this.state.synapticWeight.toFixed(2);
            document.getElementById('metric-neuro').textContent = this.state.neurotransmitters;
            document.getElementById('metric-ions').textContent = this.state.ionsCrossed;
            document.getElementById('metric-learning').textContent = this.state.learningMetric.toFixed(2);
        },

        drawCanvas() {
            const { ctx, canvas } = this;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            // Draw a simple representation of a synapse
            const preSynapticY = height / 2 - 50;
            const postSynapticY = height / 2 + 50;

            // Pre-synaptic neuron (circle)
            ctx.fillStyle = '#732751';
            ctx.beginPath();
            ctx.arc(width / 4, preSynapticY, 30, 0, Math.PI * 2);
            ctx.fill();

            // Post-synaptic neuron (circle)
            ctx.fillStyle = '#357438';
            ctx.beginPath();
            ctx.arc(width * 3 / 4, postSynapticY, 30, 0, Math.PI * 2);
            ctx.fill();

            // Connection strength (line thickness)
            ctx.strokeStyle = '#2d3e2d';
            ctx.lineWidth = this.state.synapticWeight * 10;
            ctx.beginPath();
            ctx.moveTo(width / 4, preSynapticY);
            ctx.lineTo(width * 3 / 4, postSynapticY);
            ctx.stroke();
        },

        resizeCanvas() {
            const canvas = this.canvas;
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                this.drawCanvas();
            }
        },

        // --- Utility ---
        createElement(tag, attributes = {}, ...children) {
            const element = document.createElement(tag);
            for (const key in attributes) {
                element[key] = attributes[key];
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        }
    };

    // --- Main Execution Logic ---

    /**
     * Retrieves configuration from the script tag attributes.
     * @returns {{targetSelector: string, baseUrl: string}|null}
     */
    function getConfiguration() {
        const scriptElement = document.currentScript;
        if (!scriptElement) {
            console.error('Models App: Could not find the current script element.');
            return null;
        }

        // Use the 'target-selector-left' attribute passed by greenhouse.js
        const targetSelector = scriptElement.getAttribute('data-target-selector-left');
        const baseUrl = scriptElement.getAttribute('data-base-url');

        if (!targetSelector || !baseUrl) {
            console.error('Models App: Missing required data attributes (data-target-selector-left or data-base-url) on the script tag.');
            return null;
        }

        return { targetSelector, baseUrl };
    }

    /**
     * Main function to initialize the application.
     */
    function main() {
        const config = getConfiguration();
        if (config) {
            // The init function expects the DOM to be ready to find the targetSelector
            if (document.readyState === 'loading') {
                 document.addEventListener('DOMContentLoaded', () => GreenhouseModels.init(config.targetSelector, config.baseUrl));
            } else {
                 GreenhouseModels.init(config.targetSelector, config.baseUrl);
            }
        }
    }

    // Execute the main function to start the application
    main();

    // Expose the main object for debugging purposes
    window.GreenhouseModels = GreenhouseModels;

})();