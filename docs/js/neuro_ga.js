// docs/js/neuro_ga.js
// Genetic Algorithm for Neuron Growth Simulation

(function() {
    'use strict';

    class NeuroGA {
        constructor() {
            this.populationSize = 20;
            this.mutationRate = 0.05;
            this.population = [];
            this.generation = 0;
            this.bestGenome = null;
            this.bounds = { x: 400, y: 400, z: 400 }; // Simulation bounds
            this.targetPoints = []; // Points neurons try to reach
            this.adhdConfig = {
                activeEnhancements: new Set(),
                snr: 1.0,
                sustainedAttention: 1.0,
                rewardDelayFactor: 1.0,
                taskSwitchingLatency: 0,
                impulsivityRate: 0.0,
                blinkCooldown: 0,
                fatigue: 0.0,
                learningRateBoost: 1.0
            };
        }

        init(config = {}) {
            if (config.populationSize) this.populationSize = config.populationSize;
            if (config.bounds) this.bounds = config.bounds;

            this.generateTargetPoints(10); // Create some target connection points
            this.createInitialPopulation();
        }

        setADHDEnhancement(id, active) {
            if (active) this.adhdConfig.activeEnhancements.add(id);
            else this.adhdConfig.activeEnhancements.delete(id);

            // Immediate effect mapping
            if (id === 46) this.adhdConfig.learningRateBoost = active ? 2.0 : 1.0;
        }

        generateTargetPoints(count) {
            this.targetPoints = [];
            for (let i = 0; i < count; i++) {
                this.targetPoints.push({
                    x: (Math.random() - 0.5) * this.bounds.x,
                    y: (Math.random() - 0.5) * this.bounds.y,
                    z: (Math.random() - 0.5) * this.bounds.z
                });
            }
        }

        createInitialPopulation() {
            this.population = [];
            for (let i = 0; i < this.populationSize; i++) {
                this.population.push(this.createRandomGenome());
            }
            this.evaluateFitness();
        }

        createRandomGenome() {
            // A genome represents a network structure
            // For simplicity, let's say a genome is a set of 3D points (neurons)
            // and connections are inferred or explicit.
            const neuronCount = 15;
            const neurons = [];

            // Start with a central neuron
            neurons.push({ x: 0, y: 0, z: 0, id: 0, type: 'soma' });

            for (let i = 1; i < neuronCount; i++) {
                neurons.push({
                    x: (Math.random() - 0.5) * this.bounds.x,
                    y: (Math.random() - 0.5) * this.bounds.y,
                    z: (Math.random() - 0.5) * this.bounds.z,
                    id: i,
                    type: 'dendrite'
                });
            }

            // Random connections
            const connections = [];
            for (let i = 0; i < neuronCount; i++) {
                // Connect to 1-3 other random neurons
                const numConnections = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < numConnections; j++) {
                    const targetId = Math.floor(Math.random() * neuronCount);
                    if (targetId !== i) {
                        connections.push({ from: i, to: targetId, weight: Math.random() });
                    }
                }
            }

            return {
                neurons: neurons,
                connections: connections,
                fitness: 0
            };
        }

        evaluateFitness() {
            let maxFitness = -Infinity;
            this.bestGenome = null;

            // ADHD: Reward Delay Discounting (Enhancement 5)
            const delayFactor = this.adhdConfig.activeEnhancements.has(5) ? 0.8 : 1.0;

            this.population.forEach(genome => {
                let fitness = 0;

                // 1. Connectivity Score: Reward connections to target points
                genome.neurons.forEach(neuron => {
                    this.targetPoints.forEach((target, tIdx) => {
                        // ADHD: Salience Network Misalignment (Enhancement 59)
                        // If enhancement 59 is active, distractors (odd indices) might be rewarded
                        let targetWeight = 1.0;
                        if (this.adhdConfig.activeEnhancements.has(59) && tIdx % 2 !== 0) targetWeight = 1.5;

                        const dist = Math.sqrt(
                            Math.pow(neuron.x - target.x, 2) +
                            Math.pow(neuron.y - target.y, 2) +
                            Math.pow(neuron.z - target.z, 2)
                        );
                        if (dist < 100) {
                            fitness += (100 - dist) * targetWeight * delayFactor; // Closer is better
                        }
                    });
                });

                // ADHD: Distractibility Index (Enhancement 15)
                if (this.adhdConfig.activeEnhancements.has(15)) {
                    fitness -= (Math.random() * 20); // Random noise in fitness
                }

                // ADHD: Pathology - Cortico-Striatal Decoupling (Enhancement 54)
                if (this.adhdConfig.activeEnhancements.has(54)) {
                    genome.connections.forEach(c => {
                        const fromNode = genome.neurons[c.from];
                        const toNode = genome.neurons[c.to];
                        if ((fromNode.region === 'pfc' && toNode.region === 'striatum') ||
                            (fromNode.region === 'striatum' && toNode.region === 'pfc')) {
                            fitness -= 10; // Penalize connection
                        }
                    });
                }

                // 2. Network Cohesion: Penalize isolated clusters (simplified)
                // (Not implementing full graph traversal for speed, just rewarding total connections)
                let cohesionWeight = 5;
                // ADHD: Pathology - Synaptic Pruning Deficits (Enhancement 57)
                if (this.adhdConfig.activeEnhancements.has(57)) cohesionWeight = 10; // Reward over-connectivity

                fitness += genome.connections.length * cohesionWeight * this.adhdConfig.learningRateBoost;

                // 3. Spacial Distribution: Penalize neurons being too close to each other
                for(let i=0; i<genome.neurons.length; i++) {
                    for(let j=i+1; j<genome.neurons.length; j++) {
                         const dist = Math.sqrt(
                            Math.pow(genome.neurons[i].x - genome.neurons[j].x, 2) +
                            Math.pow(genome.neurons[i].y - genome.neurons[j].y, 2) +
                            Math.pow(genome.neurons[i].z - genome.neurons[j].z, 2)
                        );
                        if (dist < 20) fitness -= 50; // Penalty for overlap
                    }
                }

                genome.fitness = fitness;

                if (fitness > maxFitness) {
                    maxFitness = fitness;
                    this.bestGenome = genome;
                }
            });
        }

        step() {
            // ADHD: Attentional Blink (Enhancement 1)
            if (this.adhdConfig.activeEnhancements.has(1)) {
                if (this.adhdConfig.blinkCooldown > 0) {
                    this.adhdConfig.blinkCooldown--;
                    return this.bestGenome; // Skip processing this generation
                }
                if (Math.random() < 0.1) this.adhdConfig.blinkCooldown = 3;
            }

            // ADHD: Time Perception Distortion (Enhancement 12)
            if (this.adhdConfig.activeEnhancements.has(12)) {
                if (Math.random() < 0.2) return this.bestGenome; // Variable lag
            }

            // 1. Selection
            const newPopulation = [];

            // ADHD: Elitism Rate change (ElitismRate from config would be better)
            if (this.bestGenome) {
                newPopulation.push(JSON.parse(JSON.stringify(this.bestGenome)));
            }

            // ADHD: Sustained Attention Decay (Enhancement 7)
            if (this.adhdConfig.activeEnhancements.has(7)) {
                this.adhdConfig.sustainedAttention *= 0.999;
            }

            // ADHD: Cognitive Fatigue (Enhancement 19) / Sleep Deprivation (Enhancement 82)
            const fatigueInc = this.adhdConfig.activeEnhancements.has(82) ? 0.005 : 0.001;
            if (this.adhdConfig.activeEnhancements.has(19) || this.adhdConfig.activeEnhancements.has(82)) {
                this.adhdConfig.fatigue = Math.min(1.0, this.adhdConfig.fatigue + fatigueInc);
            }

            // ADHD: Treatment - Sleep Hygiene Reset (Enhancement 35)
            if (this.adhdConfig.activeEnhancements.has(35) && this.generation % 100 === 0) {
                this.adhdConfig.fatigue = 0;
            }

            // Fill the rest
            while (newPopulation.length < this.populationSize) {
                const parentA = this.selectParent();
                const parentB = this.selectParent();
                const child = this.crossover(parentA, parentB);
                this.mutate(child);
                newPopulation.push(child);
            }

            // ADHD: Forgetfulness Pruning (Enhancement 23)
            if (this.adhdConfig.activeEnhancements.has(23) && Math.random() < 0.3) {
                this.population.forEach(genome => {
                    if (genome.connections.length > 5) {
                        genome.connections.splice(Math.floor(Math.random() * genome.connections.length), 1);
                    }
                });
            }

            this.population = newPopulation;
            this.generation++;
            this.evaluateFitness();

            return this.bestGenome;
        }

        selectParent() {
            // Simple Tournament Selection
            const k = 3;
            let best = null;
            for (let i = 0; i < k; i++) {
                const ind = this.population[Math.floor(Math.random() * this.population.length)];
                if (!best || ind.fitness > best.fitness) {
                    best = ind;
                }
            }
            return best;
        }

        crossover(parentA, parentB) {
            // Crossover neurons: Take half from A, half from B
            const split = Math.floor(parentA.neurons.length / 2);
            const childNeurons = [
                ...parentA.neurons.slice(0, split),
                ...parentB.neurons.slice(split)
            ];

            // Fix IDs to be sequential
            childNeurons.forEach((n, idx) => n.id = idx);

            // Crossover connections: Random mix
            const childConnections = [];
            const maxConnections = Math.max(parentA.connections.length, parentB.connections.length);
            for (let i = 0; i < maxConnections; i++) {
                if (Math.random() < 0.5) {
                    if (parentA.connections[i]) childConnections.push(parentA.connections[i]);
                } else {
                    if (parentB.connections[i]) childConnections.push(parentB.connections[i]);
                }
            }

            // Validate connections (ensure they point to valid neuron IDs)
            const validConnections = childConnections.filter(c =>
                c.from < childNeurons.length && c.to < childNeurons.length
            );

            return {
                neurons: childNeurons,
                connections: validConnections,
                fitness: 0
            };
        }

        mutate(genome) {
            // ADHD: Genetic Predisposition (Enhancement 76) & BDNF (Enhancement 36/63)
            let currentMutationRate = this.mutationRate;
            if (this.adhdConfig.activeEnhancements.has(76)) currentMutationRate *= 1.5;
            if (this.adhdConfig.activeEnhancements.has(36)) currentMutationRate *= 2.0;
            if (this.adhdConfig.activeEnhancements.has(63)) currentMutationRate *= 0.5;

            // ADHD: Etiology - Lead Toxicity (Enhancement 79)
            if (this.adhdConfig.activeEnhancements.has(79) && Math.random() < 0.01) {
                const killIdx = Math.floor(Math.random() * genome.neurons.length);
                if (genome.neurons[killIdx].id !== 0) { // Don't kill soma
                    genome.neurons.splice(killIdx, 1);
                }
            }

            // Mutate Neurons: Jitter position
            genome.neurons.forEach(n => {
                if (Math.random() < currentMutationRate) {
                    n.x += (Math.random() - 0.5) * 20;
                    n.y += (Math.random() - 0.5) * 20;
                    n.z += (Math.random() - 0.5) * 20;
                }
            });

            // ADHD: Impulsive Connection Burst (Enhancement 4)
            const impulsivityBoost = this.adhdConfig.activeEnhancements.has(4) ? 3 : 1;

            // Mutate Connections: Add/Remove
            if (Math.random() < currentMutationRate * impulsivityBoost) {
                // Add connection
                const from = Math.floor(Math.random() * genome.neurons.length);
                const to = Math.floor(Math.random() * genome.neurons.length);
                if (from !== to) {
                    genome.connections.push({ from, to, weight: Math.random() });
                }
            }

            if (Math.random() < this.mutationRate && genome.connections.length > 0) {
                // Remove connection
                const idx = Math.floor(Math.random() * genome.connections.length);
                genome.connections.splice(idx, 1);
            }
        }
    }

    // Export
    window.NeuroGA = NeuroGA;
})();
