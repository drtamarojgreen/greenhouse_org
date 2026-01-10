// docs/js/models_ux.js

(function () {
    'use strict';
    let resilienceObserver = null;
    const GreenhouseModelsUX = {
        config: {
            COMMUNITY_BOOST_THRESHOLD: 0.7,
            COMMUNITY_BOOST_FACTOR: 1.5,
            GENETICS_RISK_THRESHOLD: 0.8,
            GENETICS_RISK_FACTOR: 0.999
        },
        state: {
            darkMode: false,
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
                particles: [],
                vesicles: [],
                receptors: [],
                ionChannels: [],
                proteinKinases: [],
                rna: [],
                cytoplasmDensity: 0.5,
                lastUpdateTime: 0
            },

            network: {
                isRunning: false,
                intensity: 50,
                speed: 'Normal',
                synapticWeight: 0.5,
                animationFrameId: null,
                actionPotentials: []
            },

            environment: {
                isRunning: false,
                community: 0.5,
                society: 0.5,
                genetics: 0.5,
                type: 'NEUTRAL', // NEUTRAL, POSITIVE, NEGATIVE
                auraOpacity: 0,
                animationFrameId: null,
                stress: 0.5,
                support: 0.5,
                regions: {
                    pfc: { activation: 0.3 },
                    amygdala: { activation: 0.4 },
                    hippocampus: { activation: 0.2 }
                },
                hoveredRegionKey: null, // #99 - Track hovered region
                tooltip: {
                    visible: false,
                    text: '',
                    x: 0,
                    y: 0
                }
            },

            networkLayout: [
                { x: 100, y: 100, activation: 0, state: 'RESTING', refractoryPeriod: 0, type: 'PYRAMIDAL', geneExpressionLevel: 0.0, transcriptionFactors: 0, label: 'pfc_desc' },
                { x: 250, y: 150, activation: 0, state: 'RESTING', refractoryPeriod: 0, type: 'PYRAMIDAL', geneExpressionLevel: 0.0, transcriptionFactors: 0, label: 'amygdala_desc' },
                { x: 150, y: 250, activation: 0, state: 'RESTING', refractoryPeriod: 0, type: 'OLIGODENDROCYTE', geneExpressionLevel: 0.0, transcriptionFactors: 0, label: 'hippocampus_desc' },
                { x: 400, y: 100, activation: 0, state: 'RESTING', refractoryPeriod: 0, type: 'PYRAMIDAL', geneExpressionLevel: 0.0, transcriptionFactors: 0, label: 'pfc_desc' },
                { x: 550, y: 150, activation: 0, state: 'RESTING', refractoryPeriod: 0, type: 'OLIGODENDROCYTE', geneExpressionLevel: 0.0, transcriptionFactors: 0, label: 'amygdala_desc' },
                { x: 450, y: 250, activation: 0, state: 'RESTING', refractoryPeriod: 0, type: 'PYRAMIDAL', geneExpressionLevel: 0.0, transcriptionFactors: 0, label: 'hippocampus_desc' }
            ],

            synapses: [],

            mainAppContainer: null
        },

        init() {
            const initializeLogic = () => {
                console.log('Models App: UX init() called.');
                if (this.state.isInitialized || this.state.isLoading) return;
                this.state.isLoading = true;
                this.initialize();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeLogic);
            } else {
                initializeLogic();
            }
        },

        async initialize() {
            try {
                if (resilienceObserver) resilienceObserver.disconnect();
                if (!this.getConfiguration()) throw new Error("Missing configuration from script tag.");

                this.state.targetElement = await GreenhouseUtils.waitForElement(this.state.targetSelector, 15000);

                // Load data before rendering anything
                await GreenhouseModelsData.loadData();
                Object.assign(this.state, GreenhouseModelsData.state);

                GreenhouseModelsUI.init(this.state, window.GreenhouseModelsUtil);

                await GreenhouseModelsUI.loadCSS(this.state.baseUrl);

                await new Promise(resolve => setTimeout(resolve, GreenhouseUtils.config.dom.insertionDelay));

                GreenhouseModelsUI.renderConsentScreen(this.state.targetElement);
                this.addConsentListeners();

                this.state.isInitialized = true;
                this._applySharedParameters();
                this.observeAndReinitializeApp(this.state.targetElement); // Re-enabled to handle Wix DOM manipulation
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
            //delete window._greenhouseModelsAttributes;
            return !!(this.state.targetSelector && this.state.baseUrl);
        },

        addConsentListeners() {
            const consentCheckbox = document.getElementById('consent-checkbox');
            const startButton = document.getElementById('start-simulation-btn');

            if (!consentCheckbox || !startButton) return;

            consentCheckbox.addEventListener('change', () => {
                startButton.disabled = !consentCheckbox.checked;
            });

            startButton.addEventListener('click', async () => {
                try {
                    // Disconnect the resilience observer to prevent re-initialization during simulation
                    if (resilienceObserver) {
                        resilienceObserver.disconnect();
                        resilienceObserver = null;
                    }

                    const { simulationData, lexicon } = this.state;
                    if (simulationData && lexicon) {
                        const processedData = GreenhouseModelsData.transformNotesToSimulationInput(
                            simulationData.notes,
                            lexicon
                        );

                        // Pre-populate vesicles
                        for (let i = 0; i < 20; i++) {
                            this.state.synaptic.vesicles.push({
                                x: Math.random(), // Relative x position
                                y: Math.random(), // Relative y position
                                state: 'IDLE', // IDLE, FUSING
                                fuseProgress: 0
                            });
                        }

                        // Pre-populate receptors
                        for (let i = 0; i < 30; i++) {
                            this.state.synaptic.receptors.push({
                                isBound: false,
                                boundUntil: 0
                            });
                        }

                        // Pre-populate ion channels (from data or default)
                        if (GreenhouseModelsData.state.synapseData && GreenhouseModelsData.state.synapseData.ionChannels) {
                            this.state.synaptic.ionChannels = JSON.parse(JSON.stringify(GreenhouseModelsData.state.synapseData.ionChannels));
                        } else {
                            // Fallback
                            this.state.synaptic.ionChannels = [
                                { id: 1, type: 'sodium', x: -40, state: 'closed' },
                                { id: 2, type: 'calcium', x: 30, state: 'open' }
                            ];
                        }

                        // Pre-populate Protein Kinases
                        for (let i = 0; i < 5; i++) {
                            this.state.synaptic.proteinKinases.push({
                                x: Math.random() * 200 - 100, // Relative to center
                                y: Math.random() * 50 + 50,   // Below synapse
                                active: false,
                                vx: (Math.random() - 0.5) * 0.5,
                                vy: (Math.random() - 0.5) * 0.5
                            });
                        }

                        // Pre-populate RNA
                        if (GreenhouseModelsData.state.synapseData && GreenhouseModelsData.state.synapseData.localRNA) {
                             for (let i = 0; i < 8; i++) {
                                this.state.synaptic.rna.push({
                                    x: Math.random() * 250 - 125,
                                    y: Math.random() * 60 + 80,
                                    phase: Math.random() * Math.PI * 2
                                });
                            }
                        }

                        // Pre-populate synapses
                        for (let i = 0; i < this.state.networkLayout.length; i++) {
                            for (let j = i + 1; j < this.state.networkLayout.length; j++) {
                                this.state.synapses.push({
                                    from: i,
                                    to: j,
                                    weight: Math.random()
                                });
                            }
                        }

                        GreenhouseModelsUI.renderSimulationInterface(this.state.targetElement);
                        this.addSimulationListeners();
                        this.bindSimulationControls();
                        this.addEnvironmentListeners();

                        // Clear loading state and draw final views
                        GreenhouseModelsUI.drawSynapticView();
                        GreenhouseModelsUI.drawNetworkView();
                        GreenhouseModelsUI.drawEnvironmentView();
                    }
                    else {
                        console.error("Data not loaded, cannot start simulation.");
                    }
                } catch (error) {
                    console.error('Models App: Simulation start failed:', error);
                    GreenhouseUtils.displayError(`Failed to start simulation: ${error.message}`);
                } finally {
                    this.state.isLoading = false;
                }
            });
        },

        bindSimulationControls() {
            this.bindNetworkControls();
            this.bindEnvironmentControls();
            this.bindGeneralControls();
        },

        bindGeneralControls() {
            const resetButton = document.getElementById('reset-btn-general');
            if (resetButton) {
                resetButton.addEventListener('click', () => this.resetSimulation());
            }
            const shareButton = document.getElementById('share-btn-general');
            if (shareButton) {
                shareButton.addEventListener('click', () => this.shareSimulation());
            }
            const downloadButton = document.getElementById('download-btn-general');
            if (downloadButton) {
                downloadButton.addEventListener('click', () => this.downloadSimulation());
            }
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            if (darkModeToggle) {
                darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
            }
            const fullscreenButton = document.getElementById('fullscreen-btn-general');
            if (fullscreenButton) {
                fullscreenButton.addEventListener('click', () => this.toggleFullScreen());
            }
        },

        toggleFullScreen() {
            if (!document.fullscreenElement) {
                this.state.mainAppContainer.requestFullscreen().catch(err => {
                    alert(`${window.GreenhouseModelsUtil.t('alert_fullscreen_error')}: ${err.message} (${err.name})`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        },

        toggleDarkMode() {
            this.state.darkMode = !this.state.darkMode;
            const container = this.state.mainAppContainer;
            if (this.state.darkMode) {
                container.classList.add('dark-mode');
            } else {
                container.classList.remove('dark-mode');
            }
            // Redraw canvases to apply new theme
            GreenhouseModelsUI.drawSynapticView();
            GreenhouseModelsUI.drawNetworkView();
            GreenhouseModelsUI.drawEnvironmentView();
        },

        downloadSimulation() {
            const tempCanvas = document.createElement('canvas');
            const synapseCanvas = GreenhouseModelsUI.canvases.synaptic;
            const networkCanvas = GreenhouseModelsUI.canvases.network;
            const environmentCanvas = GreenhouseModelsUI.canvases.environment;

            const totalWidth = environmentCanvas.width + synapseCanvas.width;
            const totalHeight = Math.max(environmentCanvas.height, synapseCanvas.height + networkCanvas.height);

            tempCanvas.width = totalWidth;
            tempCanvas.height = totalHeight;
            const ctx = tempCanvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, totalWidth, totalHeight);

            ctx.drawImage(environmentCanvas, 0, 0);
            ctx.drawImage(synapseCanvas, environmentCanvas.width, 0);
            ctx.drawImage(networkCanvas, environmentCanvas.width, synapseCanvas.height);

            const link = document.createElement('a');
            link.download = 'greenhouse-simulation.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        },

        shareSimulation() {
            const params = {
                synapticIntensity: this.state.synaptic.intensity,
                synapticSpeed: this.state.synaptic.speed,
                networkIntensity: this.state.network.intensity,
                networkSpeed: this.state.network.speed,
                stress: this.state.environment.stress,
                support: this.state.environment.support,
                genetics: this.state.environment.genetics,
                environmentType: this.state.environment.type
            };
            const queryString = new URLSearchParams(params).toString();
            const url = `${window.location.origin}${window.location.pathname}?${queryString}`;

            navigator.clipboard.writeText(url).then(() => {
                alert(window.GreenhouseModelsUtil.t('alert_url_copied'));
            }, () => {
                alert(window.GreenhouseModelsUtil.t('alert_url_fail') + '\n' + url);
            });
        },

        resetSimulation() {
            // Stop all animations
            this.state.synaptic.isRunning = false;
            this.state.network.isRunning = false;
            this.state.environment.isRunning = false;
            cancelAnimationFrame(this.state.synaptic.animationFrameId);
            cancelAnimationFrame(this.state.network.animationFrameId);
            cancelAnimationFrame(this.state.environment.animationFrameId);

            // Reset synaptic state
            Object.assign(this.state.synaptic, {
                isRunning: false,
                intensity: 50,
                speed: 'Normal',
                synapticWeight: 0.5,
                neurotransmitters: 0,
                ionsCrossed: 0,
                learningMetric: 0,
                lastUpdateTime: 0
            });

            // Reset network state
            Object.assign(this.state.network, {
                isRunning: false,
                intensity: 50,
                speed: 'Normal',
                synapticWeight: 0.5,
                actionPotentials: []
            });
            this.state.networkLayout.forEach(node => {
                node.activation = 0;
                node.state = 'RESTING';
                node.refractoryPeriod = 0;
            });

            // Reset environment state
            Object.assign(this.state.environment, {
                isRunning: false,
                community: 0.5,
                society: 0.5,
                genetics: 0.5,
                type: 'NEUTRAL',
                auraOpacity: 0,
                stress: 0.5,
                support: 0.5,
                regions: {
                    pfc: { activation: 0 },
                    amygdala: { activation: 0 },
                    hippocampus: { activation: 0 }
                }
            });

            // Redraw all canvases
            GreenhouseModelsUI.drawSynapticView();
            GreenhouseModelsUI.drawNetworkView();
            GreenhouseModelsUI.drawEnvironmentView();
            GreenhouseModelsUI.updateMetrics();

            // Reset UI elements to their default values
            document.getElementById('intensity-slider-synaptic').value = 50;
            document.getElementById('speed-select-synaptic').value = 'Normal';
            document.getElementById('play-pause-btn-synaptic').textContent = 'Play';
            document.getElementById('play-pause-btn-synaptic').disabled = true;

            document.getElementById('intensity-slider-network').value = 50;
            document.getElementById('speed-select-network').value = 'Normal';
            document.getElementById('play-pause-btn-network').textContent = 'Play';
            document.getElementById('play-pause-btn-network').disabled = true;

            const playPauseBtnEnv = document.getElementById('play-pause-btn-environment');
            if (playPauseBtnEnv) {
                playPauseBtnEnv.textContent = 'Play';
                playPauseBtnEnv.disabled = true;
            }

            document.getElementById('stress-slider').value = 0.5;
            document.getElementById('support-slider').value = 0.5;
            const envTypeSelect = document.getElementById('environment-type-select');
            if (envTypeSelect) {
                envTypeSelect.value = 'NEUTRAL';
            }
        },

        bindNetworkControls() {
            const playPauseBtn = document.getElementById('play-pause-btn-network');
            const intensitySlider = document.getElementById('intensity-slider-network');
            const speedSelect = document.getElementById('speed-select-network');
            const resetBtn = document.getElementById('reset-btn-network');

            if (playPauseBtn) {
                playPauseBtn.addEventListener('click', () => {
                    this.state.network.isRunning = !this.state.network.isRunning;
                    if (this.state.network.isRunning) {
                        this.runSimulation();
                        playPauseBtn.textContent = window.GreenhouseModelsUtil.t('btn_pause');
                    } else {
                        cancelAnimationFrame(this.state.network.animationFrameId);
                        playPauseBtn.textContent = window.GreenhouseModelsUtil.t('btn_play');
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

        bindEnvironmentControls() {
            const stressSlider = document.getElementById('stress-slider');
            if (stressSlider) {
                stressSlider.addEventListener('input', e => {
                    this.state.environment.stress = parseFloat(e.target.value);
                });
            }

            const supportSlider = document.getElementById('support-slider');
            if (supportSlider) {
                supportSlider.addEventListener('input', e => {
                    this.state.environment.support = parseFloat(e.target.value);
                });
            }

            const geneBtn1 = document.getElementById('gene-btn-1');
            if (geneBtn1) {
                geneBtn1.addEventListener('click', () => {
                    this.state.environment.genetics = Math.random();
                });
            }

            const geneBtn2 = document.getElementById('gene-btn-2');
            if (geneBtn2) {
                geneBtn2.addEventListener('click', () => {
                    this.state.environment.genetics = Math.random();
                });
            }
        },

        runSimulation() {
            if (!this.state.network.isRunning) {
                cancelAnimationFrame(this.state.network.animationFrameId);
                return;
            }

            // Environment influence
            let fireThreshold = this.state.network.intensity / 200;
            if (this.state.environment.type === 'POSITIVE') {
                fireThreshold *= 0.5; // Less random firing
                this.state.environment.auraOpacity = Math.min(1, this.state.environment.auraOpacity + 0.01);
            } else if (this.state.environment.type === 'NEGATIVE') {
                fireThreshold *= 2.0; // More chaotic firing
                this.state.environment.auraOpacity = Math.min(1, this.state.environment.auraOpacity + 0.01);
            } else {
                this.state.environment.auraOpacity = Math.max(0, this.state.environment.auraOpacity - 0.01);
            }

            // Update synapse weights based on environment
            this.state.synapses.forEach(synapse => {
                if (this.state.environment.type === 'POSITIVE') {
                    synapse.weight = Math.min(1, synapse.weight + 0.0001);
                } else if (this.state.environment.type === 'NEGATIVE') {
                    synapse.weight = Math.max(0, synapse.weight - 0.0001);
                }
            });

            // Update neuron states and decay activations
            this.state.networkLayout.forEach(node => {
                node.activation *= 0.95; // Slower decay for a longer glow
                if (node.state === 'FIRING') {
                    node.state = 'REFRACTORY';
                    node.refractoryPeriod = 50; // 50 frames refractory period
                } else if (node.state === 'REFRACTORY') {
                    node.refractoryPeriod--;
                    if (node.refractoryPeriod <= 0) {
                        node.state = 'RESTING';
                    }
                }
            });

            // Fire new action potentials based on intensity
            if (Math.random() < fireThreshold) {
                const startNodeIndex = Math.floor(Math.random() * this.state.networkLayout.length);
                const endNodeIndex = Math.floor(Math.random() * this.state.networkLayout.length);
                const startNode = this.state.networkLayout[startNodeIndex];

                if (startNodeIndex !== endNodeIndex && startNode.state === 'RESTING') {
                    this.state.network.actionPotentials.push({
                        from: startNodeIndex,
                        to: endNodeIndex,
                        progress: 0,
                        currentSegment: 0
                    });
                    startNode.state = 'FIRING';
                    startNode.activation = 1;
                }
            }

            // Update and draw action potentials
            this.state.network.actionPotentials = this.state.network.actionPotentials.filter(ap => {
                ap.progress += 0.05; // Speed of signal
                if (ap.progress >= 1) {
                    const targetNode = this.state.networkLayout[ap.to];
                    if (targetNode.state === 'RESTING') {
                        targetNode.state = 'FIRING';
                        targetNode.activation = 1;
                    }
                    return false; // Remove finished potential
                }
                return true;
            });

            // Update brain region activations based on environment
            const regions = this.state.environment.regions;
            if (this.state.environment.type === 'POSITIVE') {
                regions.pfc.activation = Math.min(1, regions.pfc.activation + 0.01);
                regions.amygdala.activation = Math.max(0, regions.amygdala.activation - 0.01);
            } else if (this.state.environment.type === 'NEGATIVE') {
                regions.pfc.activation = Math.max(0, regions.pfc.activation - 0.01);
                regions.amygdala.activation = Math.min(1, regions.amygdala.activation + 0.01);
            }
            // Simple model for hippocampus activation based on overall network firing
            const firingNodes = this.state.networkLayout.filter(n => n.state === 'FIRING').length;
            regions.hippocampus.activation = Math.min(1, firingNodes / this.state.networkLayout.length);

            // Genetics influence
            if (this.state.environment.genetics > this.config.GENETICS_RISK_THRESHOLD) {
                this.state.network.synapticWeight *= this.config.GENETICS_RISK_FACTOR;
            }

            GreenhouseModelsUI.drawNetworkView();
            GreenhouseModelsUI.drawEnvironmentView();

            this.state.network.animationFrameId = requestAnimationFrame(() => this.runSimulation());
        },

        runEnvironmentSimulation() {
            if (!this.state.environment.isRunning) {
                cancelAnimationFrame(this.state.environment.animationFrameId);
                return;
            }

            // Fluctuate the environment factors
            // #99 - Fluctuate brain region activations instead of general factors
            const regions = this.state.environment.regions;
            const stress = this.state.environment.stress;
            const support = this.state.environment.support;

            // Amygdala activation increases with stress, decreases with support
            regions.amygdala.activation = Math.max(0, Math.min(1, regions.amygdala.activation + (stress - support) * 0.005 + (Math.random() - 0.5) * 0.01));
            // PFC activation increases with support, decreases with stress
            regions.pfc.activation = Math.max(0, Math.min(1, regions.pfc.activation + (support - stress) * 0.005 + (Math.random() - 0.5) * 0.01));
            // Hippocampus activation fluctuates gently
            regions.hippocampus.activation = Math.max(0, Math.min(1, regions.hippocampus.activation + (Math.random() - 0.5) * 0.01));

            GreenhouseModelsUI.drawEnvironmentView();

            this.state.environment.animationFrameId = requestAnimationFrame(() => this.runEnvironmentSimulation());
        },

        addEnvironmentListeners() {
            const environmentSelect = document.getElementById('environment-type-select');
            if (environmentSelect) {
                environmentSelect.addEventListener('change', e => {
                    this.state.environment.type = e.target.value;
                });
            }

            const canvas = GreenhouseModelsUI.canvases.environment;
            if (canvas) {
                // OPTIMIZATION: Throttle mousemove events using requestAnimationFrame
                // This reduces processing from 100-300 Hz to 60 Hz (matching RAF loop)
                let mouseMoveScheduled = false;
                let lastMouseEvent = null;

                const throttledMouseMove = (event) => {
                    lastMouseEvent = event;
                    if (!mouseMoveScheduled) {
                        mouseMoveScheduled = true;
                        requestAnimationFrame(() => {
                            if (lastMouseEvent) {
                                GreenhouseModelsUI._handleMouseMove(lastMouseEvent);
                                lastMouseEvent = null;
                            }
                            mouseMoveScheduled = false;
                        });
                    }
                };

                canvas.addEventListener('mousemove', throttledMouseMove);
                canvas.addEventListener('click', e => {
                    if (GreenhouseModelsUI._handleClick) {
                        GreenhouseModelsUI._handleClick(e);
                    }
                });
            }

            // OPTIMIZATION: Debounce resize events to prevent excessive redraws
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    GreenhouseModelsUI.resizeAllCanvases();
                }, 100); // Debounce 100ms
            });
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
                e.target.textContent = this.state.synaptic.isRunning ? window.GreenhouseModelsUtil.t('btn_pause') : window.GreenhouseModelsUtil.t('btn_play');
                if (this.state.synaptic.isRunning) {
                    this.simulationLoop(performance.now());
                }

            });

            const playPauseBtnEnv = document.getElementById('play-pause-btn-environment');
            if (playPauseBtnEnv) {
                playPauseBtnEnv.addEventListener('click', () => {
                    this.state.environment.isRunning = !this.state.environment.isRunning;
                    playPauseBtnEnv.textContent = this.state.environment.isRunning ? window.GreenhouseModelsUtil.t('btn_pause') : window.GreenhouseModelsUtil.t('btn_play');
                    if (this.state.environment.isRunning) {
                        this.runEnvironmentSimulation();
                    }
                });
            }

            document.getElementById('reset-btn-synaptic').addEventListener('click', () => {
                this.state.synaptic.isRunning = false;
                cancelAnimationFrame(this.state.synaptic.animationFrameId);
                document.getElementById('play-pause-btn-synaptic').textContent = 'Play';
                Object.assign(this.state.synaptic, {
                    synapticWeight: 0.5, neurotransmitters: 0, ionsCrossed: 0, learningMetric: 0
                });
                GreenhouseModelsUI.updateMetrics();
                GreenhouseModelsUI.drawSynapticView();
            });
            // REMOVED: Duplicate resize listener (already added in addEnvironmentListeners)
        },

        simulationLoop(timestamp) {
            if (!this.state.synaptic.isRunning) {
                cancelAnimationFrame(this.state.synaptic.animationFrameId);
                return;
            }

            const speedMap = { 'Slow': 1000, 'Normal': 500, 'Fast': 250 };
            const currentTime = timestamp || 0;
            const elapsed = currentTime - (this.state.synaptic.lastUpdateTime || 0);
            const interval = speedMap[this.state.synaptic.speed];

            if (elapsed > interval) {
                this.state.synaptic.lastUpdateTime = currentTime;

                // Vesicle fusion simulation
                if (Math.random() < this.state.synaptic.intensity / 500) {
                    const idleVesicles = this.state.synaptic.vesicles.filter(v => v.state === 'IDLE');
                    if (idleVesicles.length > 0) {
                        const vesicleToFuse = idleVesicles[Math.floor(Math.random() * idleVesicles.length)];
                        vesicleToFuse.state = 'FUSING';

                        setTimeout(() => {
                            vesicleToFuse.state = 'IDLE'; // Reset after a short time
                        }, 500);
                    }
                }

                const communityBoost = this.state.environment.community > this.config.COMMUNITY_BOOST_THRESHOLD ? this.config.COMMUNITY_BOOST_FACTOR : 1;
                const potentiation = (this.state.synaptic.intensity / 10000) * communityBoost;
                const decay = 0.0005;
                this.state.synaptic.synapticWeight += potentiation - decay;
                this.state.synaptic.synapticWeight = Math.max(0.1, Math.min(1.0, this.state.synaptic.synapticWeight));

                this.state.synaptic.neurotransmitters = Math.floor(this.state.synaptic.intensity * this.state.synaptic.synapticWeight);
                this.state.synaptic.ionsCrossed = Math.floor(this.state.synaptic.neurotransmitters * 1.5);
                this.state.synaptic.learningMetric = this.state.synaptic.synapticWeight;

                GreenhouseModelsUI.updateMetrics();
                GreenhouseModelsUI.drawSynapticView();
            }

            this.state.synaptic.animationFrameId = requestAnimationFrame((t) => this.simulationLoop(t));
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
        },

        _applySharedParameters() {
            const params = new URLSearchParams(window.location.search);
            if (params.has('synapticIntensity')) {
                this.state.synaptic.intensity = parseInt(params.get('synapticIntensity'), 10);
            }
            if (params.has('synapticSpeed')) {
                this.state.synaptic.speed = params.get('synapticSpeed');
            }
            if (params.has('networkIntensity')) {
                this.state.network.intensity = parseInt(params.get('networkIntensity'), 10);
            }
            if (params.has('networkSpeed')) {
                this.state.network.speed = params.get('networkSpeed');
            }
            if (params.has('stress')) {
                this.state.environment.stress = parseFloat(params.get('stress'));
            }
            if (params.has('support')) {
                this.state.environment.support = parseFloat(params.get('support'));
            }
            if (params.has('genetics')) {
                this.state.environment.genetics = parseFloat(params.get('genetics'));
            }
            if (params.has('environmentType')) {
                this.state.environment.type = params.get('environmentType');
            }
        }
    };

    window.GreenhouseModelsUX = GreenhouseModelsUX;
})();
