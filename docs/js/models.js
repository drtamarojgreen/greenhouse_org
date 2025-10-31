// docs/js/models.js

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
            animationFrameId: null,
            mode: 'synaptic', // 'synaptic' or 'network'
            particles: [],
            networkLayout: [
                { x: 100, y: 100 }, { x: 250, y: 150 }, { x: 150, y: 250 },
                { x: 400, y: 100 }, { x: 550, y: 150 }, { x: 450, y: 250 }
            ],
            compatibilityLayer: null,
            mainAppContainer: null
        },

        // --- Initialization ---
        async init(targetSelector, baseUrl) {
            this.targetElement = document.querySelector(targetSelector);
            if (!this.targetElement) {
                console.error('Models App: Target element not found');
                return;
            }
            this.state.baseUrl = baseUrl;

            await this.loadDependencies();
            this.state.compatibilityLayer = window.GreenhouseReactCompatibility;

            await this.loadCSS();
            await this.renderConsentScreen();
        },

        async loadDependencies() {
            const utils = window.GreenhouseUtils;
            if (!utils) {
                console.error("Models App: GreenhouseUtils.js is required but not found.");
                return;
            }

            const compatibilityScriptUrl = `${this.state.baseUrl}js/GreenhouseReactCompatibility.js`;
            if (!window.GreenhouseReactCompatibility) {
                try {
                    await utils.loadScript(compatibilityScriptUrl, 'GreenhouseReactCompatibility');
                } catch (error) {
                    console.error('Models App: Failed to load GreenhouseReactCompatibility.js', error);
                }
            }
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
        async renderConsentScreen() {
            const comp = this.state.compatibilityLayer;
            const container = comp.createElementSafely('div', { className: 'greenhouse-landing-container' });

            const title = comp.createElementSafely('h1', { className: 'greenhouse-simulation-title' }, 'Neural Plasticity & CBT/DBT');
            const intro = comp.createElementSafely('p', {}, 'This is a browser-based educational simulation...');
            const disclaimer = comp.createElementSafely('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — Educational model only...');
            const consentLabel = comp.createElementSafely('label', { className: 'greenhouse-consent-label' });
            const consentCheckbox = comp.createElementSafely('input', { type: 'checkbox', id: 'consent-checkbox', className: 'greenhouse-consent-checkbox', 'data-testid': 'consent-checkbox' });

            consentLabel.appendChild(consentCheckbox);
            consentLabel.appendChild(document.createTextNode(' I understand this simulation is educational only and not a substitute for clinical care.'));

            const startButton = comp.createElementSafely('button', { id: 'start-simulation-btn', className: 'greenhouse-btn-primary' }, 'Start Simulation');
            startButton.disabled = true;

            await comp.insertElementSafely(container, title);
            await comp.insertElementSafely(container, intro);
            await comp.insertElementSafely(container, disclaimer);
            await comp.insertElementSafely(container, consentLabel);
            await comp.insertElementSafely(container, startButton);

            await this.replaceMainContainer(container);
            this.addConsentListeners();
        },

        async renderSimulationInterface() {
            const comp = this.state.compatibilityLayer;
            const mainContainer = comp.createElementSafely('div', { className: 'simulation-main-container' });

            const topBanner = comp.createElementSafely('div', { className: 'greenhouse-disclaimer-banner' }, 'Educational Model: Simulating conceptual brain activity for research.');
            const contentArea = comp.createElementSafely('div', { style: 'display: flex; gap: 20px; margin-top: 20px;' });
            const leftColumn = comp.createElementSafely('div', { style: 'flex: 3;' });
            const canvas = comp.createElementSafely('canvas', { id: 'simulation-canvas', style: 'width: 100%; height: 400px; background: #f0f0f0; border-radius: 12px;' });
            const metricsPanel = comp.createElementSafely('div', { id: 'metrics-panel', className: 'greenhouse-metrics-panel' });
            const rightColumn = comp.createElementSafely('div', { style: 'flex: 1;' });

            await comp.insertElementSafely(mainContainer, topBanner);
            await comp.insertElementSafely(mainContainer, contentArea);
            await comp.insertElementSafely(contentArea, leftColumn);
            await comp.insertElementSafely(contentArea, rightColumn);
            await comp.insertElementSafely(leftColumn, canvas);
            await comp.insertElementSafely(leftColumn, metricsPanel);

            this.populateMetricsPanel(metricsPanel);
            await this.populateControlsPanel(rightColumn);

            await this.replaceMainContainer(mainContainer);

            this.canvas = document.getElementById('simulation-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            this.drawSynapticView();
            this.addSimulationListeners();
        },

        async replaceMainContainer(newContainer) {
            const comp = this.state.compatibilityLayer;
            if (this.state.mainAppContainer && this.state.mainAppContainer.parentNode) {
                await comp.removeElementSafely(this.state.mainAppContainer);
            }
            await comp.insertElementSafely(this.targetElement, newContainer);
            this.state.mainAppContainer = newContainer;
        },

        populateMetricsPanel(panel) {
            // DANGEROUS: The use of innerHTML here can still cause issues, but is less
            // likely to cause the main application crash than clearing the root container.
            // This should be refactored in the future to use safe DOM manipulation methods.
            panel.innerHTML = `
                <h3 class="greenhouse-panel-title">Metrics</h3>
                <p>Synaptic Weight: <span id="metric-weight">0.50</span></p>
                <p>Neurotransmitters Released: <span id="metric-neuro">0</span></p>
                <p>Ions Crossed: <span id="metric-ions">0</span></p>
                <p>Learning Metric: <span id="metric-learning">0.0</span></p>
            `;
        },

        async populateControlsPanel(container) {
            const comp = this.state.compatibilityLayer;
            const controlsPanel = comp.createElementSafely('div', { className: 'greenhouse-controls-panel' });
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
                <label style="margin-top: 10px;">Visualization Mode</label>
                <select class="greenhouse-select" id="mode-select">
                    <option value="synaptic" selected>Synaptic Close-up</option>
                    <option value="network">Network Overview</option>
                </select>
                <button class="greenhouse-btn-secondary" id="play-pause-btn" style="margin-top: 10px;">Play</button>
                <button class="greenhouse-btn-secondary" id="reset-btn" style="margin-top: 10px;">Reset Plasticity</button>
            `;
            const instructionsPanel = comp.createElementSafely('div', { className: 'greenhouse-controls-panel' });
            instructionsPanel.innerHTML = `
                <h3 class="greenhouse-panel-title">Instructions</h3>
                <p>Adjust the "Practice Intensity" to see how it affects the neural connections.</p>
            `;
            await comp.insertElementSafely(container, controlsPanel);
            await comp.insertElementSafely(container, instructionsPanel);
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
                if (!this.state.isRunning) this.drawSynapticView(); // Update view if paused
            });
            document.getElementById('speed-select').addEventListener('change', e => {
                this.state.speed = e.target.value;
            });
            document.getElementById('mode-select').addEventListener('change', e => {
                this.state.mode = e.target.value;
                if (!this.state.isRunning) {
                    if (this.state.mode === 'synaptic') {
                        this.drawSynapticView();
                    } else {
                        this.drawNetworkView();
                    }
                }
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
                this.drawSynapticView();
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
            if (this.state.mode === 'synaptic') {
                this.drawSynapticView();
            } else {
                this.drawNetworkView();
            }

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

        updateParticles() {
            const { ctx, canvas } = this;
            const { width, height } = canvas;
            const cleftTop = height / 2 - 10;
            const cleftBottom = height / 2 + 10;

            // Move and draw existing particles
            this.state.particles.forEach((p, index) => {
                p.y += p.vy;

                // Remove particle if it has crossed the cleft
                if (p.y > cleftBottom) {
                    this.state.particles.splice(index, 1);
                    return;
                }

                // Draw particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // Add new particles if running
            if (this.state.isRunning) {
                const newParticles = this.state.neurotransmitters / 20; // Scale down for performance
                for (let i = 0; i < newParticles; i++) {
                    this.state.particles.push({
                        x: Math.random() * (width * 0.6) + (width * 0.2), // Release from middle 60%
                        y: cleftTop - 5,
                        vy: 1 + Math.random(), // Speed
                        radius: 2 + Math.random() * 2,
                        color: `rgba(0, 123, 255, ${Math.random() * 0.5 + 0.5})`
                    });
                }
            }
        },

        drawSynapticView() {
            const { ctx, canvas } = this;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const preSynapticY = height / 2 - 50;
            const cleftHeight = 20;

            // Pre-synaptic terminal (arc)
            ctx.fillStyle = 'rgba(115, 39, 81, 0.8)'; // Darker purple
            ctx.beginPath();
            ctx.arc(width / 2, preSynapticY, width / 3, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.fill();

            // Synaptic Cleft (gap)
            ctx.fillStyle = '#f0f0f0'; // Background color
            ctx.fillRect(0, preSynapticY + 30, width, cleftHeight);

            // Post-synaptic terminal (arc)
            ctx.fillStyle = 'rgba(53, 116, 56, 0.8)'; // Darker green
            ctx.beginPath();
            ctx.arc(width / 2, height / 2 + 50, width / 3, 1.2 * Math.PI, 1.8 * Math.PI, true);
            ctx.fill();

            // Animate neurotransmitters
            this.updateParticles();

            // Connection strength visualization (opacity of a bar in the cleft)
            ctx.fillStyle = `rgba(45, 62, 45, ${this.state.synapticWeight * 0.7})`;
            ctx.fillRect(width * 0.2, height / 2 - 5, width * 0.6, 10);
        },

        drawNeuron(ctx, x, y, radius) {
            // Draw central body (soma)
            ctx.fillStyle = 'rgba(53, 116, 56, 0.9)'; // Use a slightly transparent green
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw dendrites
            const dendriteCount = 5 + Math.floor(Math.random() * 3); // 5 to 7 dendrites
            ctx.strokeStyle = 'rgba(45, 62, 45, 0.7)'; // Use a slightly transparent dark color
            ctx.lineWidth = 1.5;

            for (let i = 0; i < dendriteCount; i++) {
                const angle = (i / dendriteCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5; // Add some randomness to angle
                const length = radius * (1.5 + Math.random()); // Random length

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + Math.cos(angle) * length,
                    y + Math.sin(angle) * length
                );
                ctx.stroke();
            }
        },

        drawNetworkView() {
            const { ctx, canvas } = this;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            // Scale node positions to canvas size
            const scaleX = width / 650;
            const scaleY = height / 350;

            // Draw connections
            ctx.strokeStyle = '#2d3e2d';
            for (let i = 0; i < this.state.networkLayout.length; i++) {
                for (let j = i + 1; j < this.state.networkLayout.length; j++) {
                    // Make connection strength vary for visual interest
                    const weight = (i + j) % 3 === 0 ? this.state.synapticWeight : 0.2 + Math.random() * 0.2;
                    ctx.lineWidth = weight * 5;
                    ctx.beginPath();
                    ctx.moveTo(this.state.networkLayout[i].x * scaleX, this.state.networkLayout[i].y * scaleY);
                    ctx.lineTo(this.state.networkLayout[j].x * scaleX, this.state.networkLayout[j].y * scaleY);
                    ctx.stroke();
                }
            }

            // Draw neurons
            this.state.networkLayout.forEach(node => {
                this.drawNeuron(ctx, node.x * scaleX, node.y * scaleY, 12);
            });
        },

        resizeCanvas() {
            const canvas = this.canvas;
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                if (this.state.mode === 'synaptic') {
                    this.drawSynapticView();
                } else {
                    this.drawNetworkView();
                }
            }
        },

        // --- Utility ---
        // The custom createElement function has been removed in favor of
        // GreenhouseReactCompatibility.createElementSafely to prevent DOM conflicts.
    };

    window.GreenhouseModels = GreenhouseModels;

})();