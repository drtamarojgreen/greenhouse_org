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

        config: {
            dataUrl: 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/qa_fixture.json',
            lexiconUrl: 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/domain_mapping.json',
        },

        async loadData() {
            // Prioritize Velo data by polling a DOM element bridge
            try {
                const dataElement = await new Promise((resolve, reject) => {
                    let elapsedTime = 0;
                    const poll = setInterval(() => {
                        const element = document.querySelector('#dataTextElement');
                        if (element && element.textContent) {
                            clearInterval(poll);
                            resolve(element);
                        } else {
                            elapsedTime += 100;
                            if (elapsedTime >= 10000) { // 10 second timeout
                                clearInterval(poll);
                                reject(new Error('Timed out waiting for #dataTextElement.'));
                            }
                        }
                    }, 100);
                });

                console.log('Models App: Using data provided from Velo via #dataTextElement.');
                this.state.simulationData = JSON.parse(dataElement.textContent);
                this.state.lexicon = this.state.simulationData.lexicon || {};
                return;

            } catch (error) {
                // If polling fails or parsing fails, fall back to the original method
                console.warn(`Models App: Could not get Velo data (${error.message}). Falling back to default data fetch.`);
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
                    console.log('Simulation data and lexicon loaded via fallback:', this.state);
                } catch (fetchError) {
                    console.error('Error loading fallback data:', fetchError);
                    throw fetchError; // Re-throw to be caught by the caller
                }
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

    window.GreenhouseModelsData = GreenhouseModelsData;
})();
