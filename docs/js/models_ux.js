// docs/js/models_ux.js

(function() {
    'use strict';
    let resilienceObserver = null;
    const GreenhouseModelsUX = {
        state: {
            consentGiven: false,
            isInitialized: false,
            isLoading: false,
            targetSelector: null,
            baseUrl: null,
            targetElement: null,

            synaptic: {
                isRunning: false,
                intensity: 50,
                speed: 'Normal',
                synapticWeight: 0.5,
                neurotransmitters: 0,
                ionsCrossed: 0,
                learningMetric: 0,
                animationFrameId: null,
                particles: []
            },

            network: {
                isRunning: false,
                intensity: 50,
                speed: 'Normal',
                synapticWeight: 0.5,
                animationFrameId: null,
                actionPotentials: []
            },

            networkLayout: [
                { x: 100, y: 100, activation: 0 }, { x: 250, y: 150, activation: 0 }, { x: 150, y: 250, activation: 0 },
                { x: 400, y: 100, activation: 0 }, { x: 550, y: 150, activation: 0 }, { x: 450, y: 250, activation: 0 }
            ],
            mainAppContainer: null
        },

        init() {
            console.log('Models App: UX init() called.');
            if (this.state.isInitialized || this.state.isLoading) return;
            this.state.isLoading = true;

            this.initialize();
        },

        async initialize() {
            try {
                if (resilienceObserver) resilienceObserver.disconnect();
                if (!this.getConfiguration()) throw new Error("Missing configuration from script tag.");

                this.state.targetElement = await GreenhouseUtils.waitForElement(this.state.targetSelector, 15000);

                GreenhouseModelsUI.init(this.state); // Pass state to UI module

                await GreenhouseModelsUI.loadCSS(this.state.baseUrl);

                await new Promise(resolve => setTimeout(resolve, GreenhouseUtils.config.dom.insertionDelay));

                await GreenhouseModelsData.loadData();

                GreenhouseModelsUI.renderConsentScreen(this.state.targetElement);
                this.addConsentListeners();

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
            if (!window._greenhouseModelsAttributes) {
                console.error('Models App: Global attributes not found.');
                return false;
            }
            this.state.targetSelector = window._greenhouseModelsAttributes.targetSelector;
            this.state.baseUrl = window._greenhouseModelsAttributes.baseUrl;
            // Clean up the global object after use
            delete window._greenhouseModelsAttributes;
            return !!(this.state.targetSelector && this.state.baseUrl);
        },

        addConsentListeners() {
            const consentCheckbox = document.getElementById('consent-checkbox');
            const startButton = document.getElementById('start-simulation-btn');

            if (!consentCheckbox || !startButton) return;

            consentCheckbox.addEventListener('change', () => {
                startButton.disabled = !consentCheckbox.checked;
            });

            startButton.addEventListener('click', () => {
                const { simulationData, lexicon } = GreenhouseModelsData.state;
                if (simulationData && lexicon) {
                    const processedData = GreenhouseModelsData.transformNotesToSimulationInput(
                        simulationData.notes,
                        lexicon
                    );
                    GreenhouseModelsUI.renderSimulationInterface(this.state.targetElement);
                    this.addSimulationListeners();
                    this.bindSimulationControls();
                } else {
                    console.error("Data not loaded, cannot start simulation.");
                }
            });
        },

        bindSimulationControls() {
            const playPauseBtn = document.getElementById('play-pause-btn-network');
            const intensitySlider = document.getElementById('intensity-slider-network');
            const speedSelect = document.getElementById('speed-select-network');
            const resetBtn = document.getElementById('reset-btn-network');

            if (playPauseBtn) {
                playPauseBtn.addEventListener('click', () => {
                    this.state.network.isRunning = !this.state.network.isRunning;
                    if (this.state.network.isRunning) {
                        this.runSimulation();
                        playPauseBtn.textContent = 'Pause';
                    } else {
                        cancelAnimationFrame(this.state.network.animationFrameId);
                        playPauseBtn.textContent = 'Play';
                    }
                });
            }

            if (intensitySlider) {
                intensitySlider.addEventListener('input', e => {
                    this.state.network.intensity = parseInt(e.target.value, 10);
                    if (!this.state.network.isRunning) GreenhouseModelsUI.drawNetworkView();
                });
            }

            if (speedSelect) {
                speedSelect.addEventListener('change', e => {
                    this.state.network.speed = e.target.value;
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.state.network.isRunning = false;
                    cancelAnimationFrame(this.state.network.animationFrameId);
                    playPauseBtn.textContent = 'Play';
                    this.state.network.synapticWeight = 0.5;
                    this.state.networkLayout.forEach(n => n.activation = 0);
                    this.state.network.actionPotentials = [];
                    GreenhouseModelsUI.drawNetworkView();
                });
            }
        },

        runSimulation() {
            if (!this.state.network.isRunning) {
                cancelAnimationFrame(this.state.network.animationFrameId);
                return;
            }

            // Fire new action potentials based on intensity
            if (Math.random() < this.state.network.intensity / 200) {
                const startNode = Math.floor(Math.random() * this.state.networkLayout.length);
                const endNode = Math.floor(Math.random() * this.state.networkLayout.length);
                if (startNode !== endNode) {
                    this.state.network.actionPotentials.push({
                        from: startNode,
                        to: endNode,
                        progress: 0
                    });
                }
            }

            // Update neuron activations and decay them
            this.state.networkLayout.forEach(node => {
                node.activation *= 0.9; // Decay activation
            });

            // Update and draw action potentials
            this.state.network.actionPotentials = this.state.network.actionPotentials.filter(ap => {
                ap.progress += 0.05; // Speed of signal
                if (ap.progress >= 1) {
                    this.state.networkLayout[ap.to].activation = 1; // Activate target neuron
                    return false; // Remove finished potential
                }
                return true;
            });

            GreenhouseModelsUI.drawNetworkView();

            this.state.network.animationFrameId = requestAnimationFrame(() => this.runSimulation());
        },

        addSimulationListeners() {
            document.getElementById('intensity-slider-synaptic').addEventListener('input', e => {
                this.state.synaptic.intensity = parseInt(e.target.value, 10);
                if (!this.state.synaptic.isRunning) GreenhouseModelsUI.drawSynapticView();
            });
            document.getElementById('speed-select-synaptic').addEventListener('change', e => {
                this.state.synaptic.speed = e.target.value;
            });
            document.getElementById('play-pause-btn-synaptic').addEventListener('click', e => {
                this.state.synaptic.isRunning = !this.state.synaptic.isRunning;
                e.target.textContent = this.state.synaptic.isRunning ? 'Pause' : 'Play';
                if (this.state.synaptic.isRunning) {
                    this.simulationLoop();
                }
            });
            document.getElementById('reset-btn-synaptic').addEventListener('click', () => {
                this.state.synaptic.isRunning = false;
                document.getElementById('play-pause-btn-synaptic').textContent = 'Play';
                Object.assign(this.state.synaptic, {
                    synapticWeight: 0.5, neurotransmitters: 0, ionsCrossed: 0, learningMetric: 0
                });
                GreenhouseModelsUI.updateMetrics();
                GreenhouseModelsUI.drawSynapticView();
            });
            window.addEventListener('resize', () => GreenhouseModelsUI.resizeAllCanvases());
        },

        simulationLoop() {
            if (!this.state.synaptic.isRunning) {
                cancelAnimationFrame(this.state.synaptic.animationFrameId);
                return;
            }

            const potentiation = (this.state.synaptic.intensity / 10000);
            const decay = 0.0005;
            this.state.synaptic.synapticWeight += potentiation - decay;
            this.state.synaptic.synapticWeight = Math.max(0.1, Math.min(1.0, this.state.synaptic.synapticWeight));

            this.state.synaptic.neurotransmitters = Math.floor(this.state.synaptic.intensity * this.state.synaptic.synapticWeight);
            this.state.synaptic.ionsCrossed = Math.floor(this.state.synaptic.neurotransmitters * 1.5);
            this.state.synaptic.learningMetric = this.state.synaptic.synapticWeight;

            GreenhouseModelsUI.updateMetrics();
            GreenhouseModelsUI.drawSynapticView();

            const speedMap = { 'Slow': 1000, 'Normal': 500, 'Fast': 250 };
            setTimeout(() => {
                this.state.synaptic.animationFrameId = requestAnimationFrame(() => this.simulationLoop());
            }, speedMap[this.state.synaptic.speed]);
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.classList.contains('greenhouse-landing-container')));
                if (wasRemoved) {
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

        reinitialize() {
            console.log('Models App: Re-initializing from global scope.');
            this.state.isInitialized = false;
            return this.init();
        }
    };

    window.GreenhouseModelsUX = GreenhouseModelsUX;
})();
