// docs/js/models.js

(function() {
    'use strict';

    const GreenhouseModels = {
        // App state
        state: {
            simulationData: null,
            lexicon: null,
            consentGiven: false,
            simulationRunning: false,
        },

        // Configuration
        config: {
            dataUrl: 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/qa_fixture.json',
            lexiconUrl: 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/domain_mapping.json',
        },

        async init(targetSelector) {
            this.targetElement = document.querySelector(targetSelector);
            if (!this.targetElement) {
                console.error('Models App: Target element not found');
                return;
            }

            // Ensure data is loaded before rendering anything
            await this.loadData();
            this.renderConsentScreen();

            // Signal that the app is ready for interaction
            this.targetElement.dataset.loaded = "true";
        },

        async loadData() {
            try {
                const [simResponse, lexResponse] = await Promise.all([
                    fetch(this.config.dataUrl),
                    fetch(this.config.lexiconUrl)
                ]);
                if (!simResponse.ok || !lexResponse.ok) {
                    throw new Error('Failed to load simulation data.');
                }
                this.state.simulationData = await simResponse.json();
                this.state.lexicon = await lexResponse.json();
                console.log('Simulation data and lexicon loaded:', this.state);
            } catch (error) {
                console.error('Error loading data:', error);
                // Handle error appropriately in the UI
            }
        },

        // ** TRANSFORMATION PIPELINE (from pseudocode) **
        transformNotesToSimulationInput(rawNotes, lexicon) {
            console.log("Starting transformation pipeline...");

            const simulation = {
                session_id: `sid-${Date.now()}`,
                consent: true,
                created_at: new Date().toISOString(),
                nodes: [],
                synapses: [],
                events: [],
                meta: { source_counts: { research: 0, patient: 0, user: 0 } }
            };
            const tempNodeMap = new Map();

            // Helper functions
            const sanitize = (text) => text.replace(/[^a-zA-Z0-9\s-]/g, ''); // Simple sanitizer
            const createLabel = (text) => sanitize(text).substring(0, 20).replace(/\s+/g, '_').toUpperCase();
            const extractTags = (text, tagMap) => {
                const foundTags = [];
                const lowerText = text.toLowerCase();
                for (const tag in tagMap) {
                    if (tagMap[tag].some(keyword => lowerText.includes(keyword))) {
                        foundTags.push(tag);
                    }
                }
                return foundTags;
            };

            rawNotes.forEach(note => {
                const sanitizedContent = note.content; // Assuming content is safe for this demo
                const sourceType = note.type;
                simulation.meta.source_counts[sourceType]++;

                const domainTags = extractTags(sanitizedContent, lexicon.domain_tags);
                const neuroAffinities = extractTags(sanitizedContent, lexicon.neurotransmitter_affinity);
                const nodeLabel = createLabel(sanitizedContent);

                if (!tempNodeMap.has(nodeLabel)) {
                    let strengthPrior = 0.5;
                    if (sourceType === "research") strengthPrior = 0.75;
                    else if (sourceType === "patient") strengthPrior = 0.4;
                    else if (sourceType === "user") strengthPrior = 0.2;

                    const newNode = {
                        id: `node-${tempNodeMap.size + 1}`,
                        type: sourceType,
                        label: nodeLabel,
                        domain_tags: domainTags,
                        strength_prior: strengthPrior,
                        neuro_affinity: neuroAffinities,
                        notes_ref: [`ref-${Date.now()}`]
                    };
                    tempNodeMap.set(nodeLabel, newNode);
                    simulation.nodes.push(newNode);
                }

                if (sourceType === "user") {
                    const newEvent = {
                        id: `evt-${simulation.events.length + 1}`,
                        node: tempNodeMap.get(nodeLabel).id,
                        type: "practice",
                        subtype: "breathing_practice", // Inferred for demo
                        timestamp: new Date().toISOString(),
                        intensity: 0.5,
                        duration_minutes: 10,
                        notes_snippet: sanitizedContent.substring(0, 50)
                    };
                    simulation.events.push(newEvent);
                }
            });

            if (simulation.nodes.length >= 2) {
                const synapse = {
                    id: "syn-1",
                    pre: simulation.nodes[0].id,
                    post: simulation.nodes[1].id,
                    weight: (simulation.nodes[0].strength_prior + simulation.nodes[1].strength_prior) / 2,
                    plasticity_rate: 0.01,
                    neurotransmitter: "serotonin"
                };
                simulation.synapses.push(synapse);
            }

            console.log("Transformation complete:", simulation);
            return simulation;
        },

        renderConsentScreen() {
            const container = this.createElement('div', { className: 'greenhouse-landing-container' });

            const title = this.createElement('h1', { className: 'greenhouse-simulation-title' }, 'Neural Plasticity & CBT/DBT');
            const intro = this.createElement('p', {}, 'This is a browser-based educational simulation that visually demonstrates how CBT and DBT practice can conceptually drive neural plasticity. It is an educational simulation only, not clinical treatment.');

            const disclaimer = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — Educational model only. Not a substitute for clinical care.');

            const consentLabel = this.createElement('label', { className: 'greenhouse-consent-label' });
            const consentCheckbox = this.createElement('input', { type: 'checkbox', id: 'consent-checkbox', className: 'greenhouse-consent-checkbox' });
            consentLabel.appendChild(consentCheckbox);
            consentLabel.appendChild(document.createTextNode('I understand this simulation is educational only and not a substitute for clinical care.'));

            const startButton = this.createElement('button', { id: 'start-simulation-btn', className: 'greenhouse-btn-primary' }, 'Start Simulation');
            startButton.disabled = true;

            container.appendChild(title);
            container.appendChild(intro);
            container.appendChild(disclaimer);
            container.appendChild(consentLabel);
            container.appendChild(startButton);

            this.targetElement.appendChild(container);

            this.addEventListeners();
        },

        renderSimulationInterface(simulationData) {
            this.targetElement.innerHTML = ''; // Clear the consent screen
            this.state.processedSimulation = simulationData; // Store the processed data

            const mainContainer = this.createElement('div', { className: 'simulation-main-container' });

            // Top Banner
            const topBanner = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — not clinical therapy.');

            // Main Content Area (using a flexbox or grid layout)
            const contentArea = this.createElement('div', { style: 'display: flex; gap: 20px; margin-top: 20px;' });

            // Left column for canvas and metrics
            const leftColumn = this.createElement('div', { style: 'flex: 3;' });

            // Canvas
            const canvas = this.createElement('canvas', { id: 'simulation-canvas', style: 'width: 100%; height: 400px; background: #f0f0f0; border-radius: 12px;' });

            // Metrics Panel - Now data-driven
            const metricsPanel = this.createElement('div', { className: 'greenhouse-metrics-panel' });
            const metricsTitle = this.createElement('h3', { className: 'greenhouse-panel-title' }, 'Metrics');

            // Get initial weight from the first synapse, or default to 0
            const initialWeight = simulationData.synapses.length > 0 ? simulationData.synapses[0].weight.toFixed(2) : 'N/A';

            const synapticWeight = this.createElement('p', { id: 'metric-synaptic-weight' }, `Synaptic Weight: ${initialWeight}`);
            const neurotransmitters = this.createElement('p', { id: 'metric-neurotransmitters' }, 'Neurotransmitters Released: 0');
            const ionsCrossed = this.createElement('p', { id: 'metric-ions-crossed' }, 'Ions Crossed: 0');
            const nodeCount = this.createElement('p', {}, `Node Count: ${simulationData.nodes.length}`);
            metricsPanel.append(metricsTitle, synapticWeight, neurotransmitters, ionsCrossed, nodeCount);

            leftColumn.append(canvas, metricsPanel);

            // Right column for controls and instructions
            const rightColumn = this.createElement('div', { style: 'flex: 1;' });

            // Controls Panel
            const controlsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            const controlsTitle = this.createElement('h3', { className: 'greenhouse-panel-title' }, 'Controls');

            const intensityLabel = this.createElement('label', {}, 'Practice Intensity');
            const intensitySlider = this.createElement('input', { type: 'range', min: '0', max: '100', value: '50', className: 'greenhouse-slider' });

            const speedLabel = this.createElement('label', {}, 'Simulation Speed');
            const speedSelect = this.createElement('select', { className: 'greenhouse-select' });
            ['Slow', 'Normal', 'Fast'].forEach(speed => {
                const option = this.createElement('option', {}, speed);
                speedSelect.appendChild(option);
            });

            const playPauseBtn = this.createElement('button', { className: 'greenhouse-btn-secondary' }, 'Play/Pause');
            const resetBtn = this.createElement('button', { className: 'greenhouse-btn-secondary' }, 'Reset Plasticity');

            controlsPanel.append(controlsTitle, intensityLabel, intensitySlider, speedLabel, speedSelect, playPauseBtn, resetBtn);

            // Instructions Panel
            const instructionsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            const instructionsTitle = this.createElement('h3', { className: 'greenhouse-panel-title' }, 'Instructions');
            const instructionsText = this.createElement('p', {}, 'Adjust the "Practice Intensity" to see how it affects the neural connections.');
            instructionsPanel.append(instructionsTitle, instructionsText);

            rightColumn.append(controlsPanel, instructionsPanel);

            contentArea.append(leftColumn, rightColumn);

            // Footer
            const footer = this.createElement('div', { style: 'text-align: center; margin-top: 20px; font-size: 0.8em; color: #888;' }, 'Prompt version: 1.0.0');

            mainContainer.append(topBanner, contentArea, footer);
            this.targetElement.appendChild(mainContainer);
        },


        addEventListeners() {
            const consentCheckbox = document.getElementById('consent-checkbox');
            const startButton = document.getElementById('start-simulation-btn');

            if (!consentCheckbox || !startButton) return;

            consentCheckbox.addEventListener('change', () => {
                startButton.disabled = !consentCheckbox.checked;
            });

            startButton.addEventListener('click', () => {
                if (this.state.simulationData && this.state.lexicon) {
                    const processedData = this.transformNotesToSimulationInput(
                        this.state.simulationData.notes,
                        this.state.lexicon
                    );
                    this.renderSimulationInterface(processedData);
                    this.bindSimulationControls();
                } else {
                    console.error("Data not loaded, cannot start simulation.");
                }
            });
        },

        bindSimulationControls() {
            const playPauseBtn = document.querySelector('.greenhouse-btn-secondary'); // Simple selector for demo
            if(playPauseBtn) {
                playPauseBtn.addEventListener('click', () => {
                    this.state.simulationRunning = !this.state.simulationRunning;
                    if (this.state.simulationRunning) {
                        this.runSimulation();
                        playPauseBtn.textContent = 'Pause';
                    } else {
                        playPauseBtn.textContent = 'Play';
                    }
                });
            }
        },

        // ** SIMULATION & RENDERING LOGIC **
        runSimulation() {
            if (!this.state.simulationRunning) return;

            this.update();
            this.draw();

            requestAnimationFrame(() => this.runSimulation());
        },

        update() {
            // Plasticity update algorithm
            const { synapses, events } = this.state.processedSimulation;
            if (!synapses || synapses.length === 0) return;

            const synapse = synapses[0]; // Operate on the first synapse for this demo
            const η = synapse.plasticity_rate;
            const p = document.querySelector('.greenhouse-slider').value / 100; // Intensity from slider
            const λ = 0.0001; // Decay constant

            // LTP-like potentiation
            const delta_w = η * p * (1 - synapse.weight);
            synapse.weight += delta_w;

            // Decay
            synapse.weight *= Math.exp(-λ);

            // Clamp weight
            synapse.weight = Math.max(0.05, Math.min(synapse.weight, 1.2));

            // Update metrics UI
            document.getElementById('metric-synaptic-weight').textContent = `Synaptic Weight: ${synapse.weight.toFixed(4)}`;
        },

        draw() {
            const canvas = document.getElementById('simulation-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const { nodes, synapses } = this.state.processedSimulation;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Simple visualization: draw nodes as circles and synapses as lines
            const nodePositions = new Map();
            nodes.forEach((node, i) => {
                const x = 50 + i * 150;
                const y = canvas.height / 2;
                nodePositions.set(node.id, { x, y });

                ctx.beginPath();
                ctx.arc(x, y, 20, 0, 2 * Math.PI);
                ctx.fillStyle = '#357438';
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(node.label, x, y + 30);
            });

            if (synapses.length > 0) {
                const synapse = synapses[0];
                const prePos = nodePositions.get(synapse.pre);
                const postPos = nodePositions.get(synapse.post);

                ctx.beginPath();
                ctx.moveTo(prePos.x, prePos.y);
                ctx.lineTo(postPos.x, postPos.y);
                ctx.lineWidth = synapse.weight * 10; // Visual weight
                ctx.strokeStyle = '#1d7a1d';
                ctx.stroke();
            }
        },

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

    // Expose to global scope for the main loader
    window.GreenhouseModels = GreenhouseModels;

})();
