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
        }

        init(config = {}) {
            if (config.populationSize) this.populationSize = config.populationSize;
            if (config.bounds) this.bounds = config.bounds;

            this.generateTargetPoints(10); // Create some target connection points
            this.createInitialPopulation();
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

            this.population.forEach(genome => {
                let fitness = 0;

                // 1. Connectivity Score: Reward connections to target points
                // (simplified: proximity of neurons to target points)
                genome.neurons.forEach(neuron => {
                    this.targetPoints.forEach(target => {
                        const dist = Math.sqrt(
                            Math.pow(neuron.x - target.x, 2) +
                            Math.pow(neuron.y - target.y, 2) +
                            Math.pow(neuron.z - target.z, 2)
                        );
                        if (dist < 100) {
                            fitness += (100 - dist); // Closer is better
                        }
                    });
                });

                // 2. Network Cohesion: Penalize isolated clusters (simplified)
                // (Not implementing full graph traversal for speed, just rewarding total connections)
                fitness += genome.connections.length * 5;

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
            // 1. Selection (Elitism + Roulette Wheel would be better, but doing simple tournament/elitism)
            const newPopulation = [];

            // Keep the best
            if (this.bestGenome) {
                newPopulation.push(JSON.parse(JSON.stringify(this.bestGenome)));
            }

            // Fill the rest
            while (newPopulation.length < this.populationSize) {
                const parentA = this.selectParent();
                const parentB = this.selectParent();
                const child = this.crossover(parentA, parentB);
                this.mutate(child);
                newPopulation.push(child);
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
            // Mutate Neurons: Jitter position
            genome.neurons.forEach(n => {
                if (Math.random() < this.mutationRate) {
                    n.x += (Math.random() - 0.5) * 20;
                    n.y += (Math.random() - 0.5) * 20;
                    n.z += (Math.random() - 0.5) * 20;
                }
            });

            // Mutate Connections: Add/Remove
            if (Math.random() < this.mutationRate) {
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
