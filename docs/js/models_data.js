// docs/js/models_data.js

(function() {
    'use strict';

    const GreenhouseModelsData = {
        state: {
            simulationData: null,
            lexicon: null,
            processedSimulation: null,
            synapticWeight: 0.5,
            neurotransmitters: 0,
            ionsCrossed: 0,
            learningMetric: 0,
        },


        async loadData() {
            try {
                const dataElement = await new Promise((resolve, reject) => {
                    let elapsedTime = 0;
                    const poll = setInterval(() => {
                        const element = document.querySelector('section.wixui-section:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)');
                        if (element && element.dataset.customHolder && element.dataset.customHolder.length > 2) {
                            clearInterval(poll);
                            resolve(element);
                        } else {
                            elapsedTime += 100;
                            if (elapsedTime >= 1000) { // 1 second timeout for local testing
                                clearInterval(poll);
                                resolve(null); // Resolve with null to indicate fallback
                            }
                        }
                    }, 100);
                });

                if (dataElement) {
                    console.log('Models App: Using data provided from Velo via data-custom-holder attribute.');
                    const veloData = JSON.parse(dataElement.dataset.customHolder);
                    this.state.simulationData = veloData;
                    this.state.lexicon = veloData.lexicon || {};
                    this.state.synapseData = veloData.synapse;
                    this.state.brainData = veloData.brain;
                    this.state.environmentData = veloData.environment;
                } else {
                    console.log('Models App: Data holder not found, using fallback data for local testing.');
                    this.state.simulationData = { notes: [] }; // Provide minimal valid data
                    this.state.lexicon = { domain_tags: {}, neurotransmitter_affinity: {} };
                    this.state.synapseData = {
                        elements: [
                            {
                                "type": "ellipse",
                                "cx": "w/2",
                                "cy": "psy",
                                "rx": 100,
                                "ry": 40,
                                "style": {
                                    "fillStyle": "rgba(100, 100, 100, 0.5)",
                                    "strokeStyle": "rgba(200, 200, 200, 0.8)",
                                    "lineWidth": 2
                                }
                            }
                        ],
                        ionChannels: [
                            { id: 1, type: 'sodium', x: -50, state: 'closed' },
                            { id: 2, type: 'calcium', x: 20, state: 'open' },
                            { id: 3, type: 'sodium', x: 60, state: 'closed' }
                        ],
                        cytoplasmDensity: 0.5,
                        localRNA: true
                    };
                    this.state.brainData = {
                        elements: [
                            {
                                "type": "tree",
                                "shape": "polygon",
                                "style": {
                                    "fillStyle": "rgba(34, 139, 34, 0.5)",
                                    "strokeStyle": "rgba(0, 100, 0, 0.7)",
                                    "lineWidth": 2
                                },
                                "points": [
                                    { "x": 325, "y": 350 },
                                    { "x": 325, "y": 300 },
                                    { "x": 275, "y": 300 },
                                    { "x": 275, "y": 250 },
                                    { "x": 300, "y": 250 },
                                    { "x": 250, "y": 200 },
                                    { "x": 275, "y": 200 },
                                    { "x": 225, "y": 150 },
                                    { "x": 250, "y": 150 },
                                    { "x": 200, "y": 100 },
                                    { "x": 450, "y": 100 },
                                    { "x": 400, "y": 150 },
                                    { "x": 425, "y": 150 },
                                    { "x": 375, "y": 200 },
                                    { "x": 400, "y": 200 },
                                    { "x": 350, "y": 250 },
                                    { "x": 375, "y": 250 },
                                    { "x": 375, "y": 300 },
                                    { "x": 325, "y": 300 }
                                ]
                            }
                        ]
                    };
                    this.state.environmentData = {};
                }
            } catch (error) {
                console.error('Models App: Error in loadData, falling back to default data.', error);
                this.state.simulationData = { notes: [] };
                this.state.lexicon = { domain_tags: {}, neurotransmitter_affinity: {} };
                this.state.synapseData = {};
                this.state.brainData = { elements: [] };
                this.state.environmentData = {};
            }
        },

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
            const sanitize = (text) => text.replace(/[^a-zA-Z0-9\s-]/g, '');
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

            if (rawNotes) {
                rawNotes.forEach(note => {
                const sanitizedContent = note.content;
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
                        subtype: "breathing_practice",
                        timestamp: new Date().toISOString(),
                        intensity: 0.5,
                        duration_minutes: 10,
                        notes_snippet: sanitizedContent.substring(0, 50)
                    };
                    simulation.events.push(newEvent);
                }
            });

            }

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
            this.state.processedSimulation = simulation;
            return simulation;
        },

        update(networkState) {
            const { synapses } = this.state.processedSimulation;
            if (!synapses || synapses.length === 0) return;

            const synapse = synapses[0];
            const η = synapse.plasticity_rate;
            const p = networkState.intensity / 100;
            const λ = 0.0001;

            let currentWeight = networkState.synapticWeight;
            const delta_w = η * p * (1 - currentWeight);
            currentWeight += delta_w;
            currentWeight *= Math.exp(-λ);
            networkState.synapticWeight = Math.max(0.05, Math.min(currentWeight, 1.2));

            return networkState; // Return the updated state
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GreenhouseModelsData;
    } else {
        window.GreenhouseModelsData = GreenhouseModelsData;
    }
})();
