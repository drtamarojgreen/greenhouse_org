// docs/js/models.js

(function() {
    'use strict';
    console.log('Models App: Script execution started.');

    let GreenhouseUtils; // Will be assigned after loading
    let resilienceObserver = null;

    // --- Robust Dependency Loading from scheduler.js ---
    const loadDependencies = async () => {
        console.log('Models App: loadDependencies started.');
        if (window.GreenhouseDependencyManager) {
            console.log('Models App: Using GreenhouseDependencyManager for dependency loading');
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
                console.log('Models App: GreenhouseUtils loaded via dependency manager');
            } catch (error) {
                console.error('Models App: Failed to load GreenhouseUtils via dependency manager:', error.message);
            }
        } else {
            console.log('Models App: Using fallback event-based system with polling');
            await new Promise(resolve => {
                if (window.GreenhouseUtils) {
                    console.log('Models App: GreenhouseUtils already available');
                    resolve();
                    return;
                }
                const handleReady = () => {
                    window.removeEventListener('greenhouse:utils-ready', handleReady);
                    clearInterval(pollInterval);
                    clearTimeout(timeoutId);
                    resolve();
                };
                window.addEventListener('greenhouse:utils-ready', handleReady);
                let attempts = 0;
                const maxAttempts = 200;
                const pollInterval = setInterval(() => {
                    if (window.GreenhouseUtils) {
                        clearInterval(pollInterval);
                        clearTimeout(timeoutId);
                        window.removeEventListener('greenhouse:utils-ready', handleReady);
                        resolve();
                    } else if (++attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        clearTimeout(timeoutId);
                        window.removeEventListener('greenhouse:utils-ready', handleReady);
                        console.error('Models App: GreenhouseUtils not available after 10 second timeout');
                        resolve();
                    }
                }, 50);
                const timeoutId = setTimeout(() => {
                    clearInterval(pollInterval);
                    window.removeEventListener('greenhouse:utils-ready', handleReady);
                    console.error('Models App: Final timeout reached');
                    resolve();
                }, 12000);
            });
        }
        console.log('Models App: loadDependencies finished.');
    };

    const GreenhouseModels = {
        state: {
            isInitialized: false,
            isLoading: false,
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
            mainAppContainer: null
        },

        async init() {
            console.log('Models App: init() called.');
            if (this.state.isInitialized || this.state.isLoading) return;
            this.state.isLoading = true;
            try {
                if (resilienceObserver) resilienceObserver.disconnect();
                if (!this.getConfiguration()) throw new Error("Missing configuration from script tag.");
                console.log(`Models App: Configuration loaded. Target: ${this.state.targetSelector}`);
                this.state.targetElement = await GreenhouseUtils.waitForElement(this.state.targetSelector, 15000);
                console.log('Models App: Target element found.');
                await this.loadCSS();
                console.log('Models App: CSS loaded.');
                await new Promise(resolve => setTimeout(resolve, GreenhouseUtils.config.dom.insertionDelay));
                this.renderConsentScreen();
                this.state.isInitialized = true;
                this.observeAndReinitializeApp(this.state.targetElement);
            } catch (error) {
                console.error('Models App: Initialization failed:', error);
                GreenhouseUtils.displayError(`Failed to load simulation: ${error.message}`);
            } finally {
                this.state.isLoading = false;
            }
        },

        getConfiguration() {
            const scriptElement = document.currentScript;
            if (!scriptElement) {
                console.error('Models App: Could not find current script element.');
                return false;
            }
            this.state.targetSelector = scriptElement.getAttribute('data-target-selector-left');
            this.state.baseUrl = scriptElement.getAttribute('data-base-url');
            return !!(this.state.targetSelector && this.state.baseUrl);
        },

        async loadCSS() {
            const cssUrl = `${this.state.baseUrl}css/model.css`;
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssUrl;
                document.head.appendChild(link);
                await new Promise((resolve, reject) => { link.onload = resolve; link.onerror = reject; });
            }
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.classList.contains('greenhouse-landing-container')));
                if (wasRemoved) {
                    console.warn('Models App Resilience: Main container removed. Re-initializing.');
                    if (resilienceObserver) resilienceObserver.disconnect();
                    setTimeout(() => {
                        if (window.GreenhouseModels && typeof window.GreenhouseModels.reinitialize === 'function') {
                            window.GreenhouseModels.reinitialize();
                        }
                    }, 5000);
                }
            };
            resilienceObserver = new MutationObserver(observerCallback);
            resilienceObserver.observe(container, { childList: true });
        },

        renderConsentScreen() {
            console.log('Models App: renderConsentScreen() called.');
            this.state.targetElement.innerHTML = '';
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
            this.state.targetElement.appendChild(container);
            this.addConsentListeners();
        },

        async renderSimulationInterface() {
            const mainContainer = this.createElement('div', { className: 'simulation-main-container' });

            const topBanner = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'For Educational Purposes: This model simulates conceptual brain activity.');
            const contentArea = this.createElement('div', { className: 'simulation-content-area' });
            const leftColumn = this.createElement('div', { className: 'simulation-left-column' });
            const canvas = this.createElement('canvas', { id: 'simulation-canvas', style: 'width: 100%; height: 400px; background: #f0f0f0; border-radius: 12px;' });
            const metricsPanel = this.createElement('div', { id: 'metrics-panel', className: 'greenhouse-metrics-panel' });
            const rightColumn = this.createElement('div', { className: 'simulation-right-column' });

            mainContainer.appendChild(topBanner);
            mainContainer.appendChild(contentArea);
            contentArea.appendChild(leftColumn);
            contentArea.appendChild(rightColumn);
            leftColumn.appendChild(canvas);
            leftColumn.appendChild(metricsPanel);

            this.populateMetricsPanel(metricsPanel);
            this.populateControlsPanel(rightColumn);

            this.replaceMainContainer(mainContainer);

            this.canvas = document.getElementById('simulation-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            this.drawSynapticView();
            this.addSimulationListeners();
        },

        replaceMainContainer(newContainer) {
            if (this.state.mainAppContainer && this.state.mainAppContainer.parentNode) {
                this.state.mainAppContainer.remove();
            }
            this.state.targetElement.appendChild(newContainer);
            this.state.mainAppContainer = newContainer;
        },

        populateMetricsPanel(panel) {
            panel.innerHTML = `
                <h3 class="greenhouse-panel-title">Real-Time Metrics</h3>
                <p>Synaptic Weight: <span id="metric-weight">0.50</span></p>
                <p>Neurotransmitters Released: <span id="metric-neuro">0</span></p>
                <p>Ions Crossed: <span id="metric-ions">0</span></p>
                <p>Learning Metric: <span id="metric-learning">0.0</span></p>
            `;
        },

        populateControlsPanel(container) {
            const controlsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            controlsPanel.innerHTML = `
                <h3 class="greenhouse-panel-title">Simulation Controls</h3>
                <div class="control-group">
                    <label>Practice Intensity</label>
                    <input type="range" min="0" max="100" value="50" class="greenhouse-slider" id="intensity-slider">
                </div>
                <div class="control-group">
                    <label>Simulation Speed</label>
                    <select class="greenhouse-select" id="speed-select">
                        <option>Slow</option>
                        <option selected>Normal</option>
                        <option>Fast</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Visualization Mode</label>
                    <select class="greenhouse-select" id="mode-select">
                        <option value="synaptic" selected>Synaptic Close-up</option>
                        <option value="network">Network Overview</option>
                    </select>
                </div>
                <div class="button-group">
                    <button class="greenhouse-btn greenhouse-btn-secondary" id="play-pause-btn">Play</button>
                    <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn">Reset Plasticity</button>
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

        addConsentListeners() {
            const check = document.getElementById('consent-checkbox');
            const btn = document.getElementById('start-simulation-btn');
            check.addEventListener('change', () => { btn.disabled = !check.checked; });
            btn.addEventListener('click', () => this.renderSimulationInterface());
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
                if (this.state.isRunning) {
                    this.simulationLoop();
                }
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

        simulationLoop() {
            if (!this.state.isRunning) {
                cancelAnimationFrame(this.state.animationFrameId);
                return;
            }

            const potentiation = (this.state.intensity / 10000);
            const decay = 0.0005;
            this.state.synapticWeight += potentiation - decay;
            this.state.synapticWeight = Math.max(0.1, Math.min(1.0, this.state.synapticWeight));

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

            this.state.particles.forEach((p, index) => {
                p.y += p.vy;
                if (p.y > cleftBottom) {
                    this.state.particles.splice(index, 1);
                    return;
                }
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            if (this.state.isRunning) {
                const newParticles = this.state.neurotransmitters / 20;
                for (let i = 0; i < newParticles; i++) {
                    this.state.particles.push({
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
            const { ctx, canvas } = this;
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

            ctx.fillStyle = `rgba(45, 62, 45, ${this.state.synapticWeight * 0.7})`;
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

            const scaleX = width / 650;
            const scaleY = height / 350;

            ctx.strokeStyle = '#2d3e2d';
            for (let i = 0; i < this.state.networkLayout.length; i++) {
                for (let j = i + 1; j < this.state.networkLayout.length; j++) {
                    const weight = (i + j) % 3 === 0 ? this.state.synapticWeight : 0.2 + Math.random() * 0.2;
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

    async function main() {
        console.log('Models App: main() started.');
        await loadDependencies();
        GreenhouseUtils = window.GreenhouseUtils;
        if (!GreenhouseUtils) {
            console.error('Models App: CRITICAL - Aborting main() due to missing GreenhouseUtils.');
            return;
        }
        console.log('Models App: GreenhouseUtils is available, proceeding with init.');
        GreenhouseModels.init();
    }

    // --- Main Execution Logic ---
    main();

    window.GreenhouseModels = {
        reinitialize: () => {
            console.log('Models App: Re-initializing from global scope.');
            GreenhouseModels.state.isInitialized = false;
            return GreenhouseModels.init();
        }
    };
})();
