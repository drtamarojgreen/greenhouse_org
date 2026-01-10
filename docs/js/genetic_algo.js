// docs/js/genetic_algo.js
// Genetic Algorithm Logic for Neural Network Evolution

(function() {
    'use strict';
    console.log('Genetic Algo: Loading...');

    class Network {
        constructor(id, inputSize, hiddenSize, outputSize) {
            this.id = id;
            this.fitness = 0;
            this.nodes = [];
            this.connections = [];

            this.initialize(inputSize, hiddenSize, outputSize);
        }

        initialize(inputSize, hiddenSize, outputSize) {
            let idCounter = 0;

            // Create Input Nodes
            for (let i = 0; i < inputSize; i++) {
                this.nodes.push({ id: idCounter++, type: 'input', layer: 0, activation: 0 });
            }

            // Create Hidden Nodes
            for (let i = 0; i < hiddenSize; i++) {
                this.nodes.push({ id: idCounter++, type: 'hidden', layer: 1, activation: 0 });
            }

            // Create Output Nodes
            for (let i = 0; i < outputSize; i++) {
                this.nodes.push({ id: idCounter++, type: 'output', layer: 2, activation: 0 });
            }

            // Random Connections
            this.randomizeConnections();
        }

        randomizeConnections() {
            this.connections = [];
            const hiddenNodes = this.nodes.filter(n => n.type === 'hidden');
            const outputNodes = this.nodes.filter(n => n.type === 'output');
            const inputNodes = this.nodes.filter(n => n.type === 'input');

            // Input -> Hidden
            inputNodes.forEach(input => {
                hiddenNodes.forEach(hidden => {
                    if (Math.random() > 0.5) {
                        this.connections.push({
                            from: input.id,
                            to: hidden.id,
                            weight: (Math.random() * 2) - 1
                        });
                    }
                });
            });

            // Hidden -> Output
            hiddenNodes.forEach(hidden => {
                outputNodes.forEach(output => {
                    if (Math.random() > 0.5) {
                        this.connections.push({
                            from: hidden.id,
                            to: output.id,
                            weight: (Math.random() * 2) - 1
                        });
                    }
                });
            });
        }

        mutate(rate) {
            // Mutate Weights
            this.connections.forEach(conn => {
                if (Math.random() < rate) {
                    conn.weight += (Math.random() * 0.4) - 0.2; // Small nudge
                    // Clamp weights
                    conn.weight = Math.max(-1, Math.min(1, conn.weight));
                }
            });

            // Structural Mutation (Add/Remove Connection)
            if (Math.random() < rate * 0.1) {
               // Simplified: Just re-randomize a connection
               if (this.connections.length > 0) {
                   const idx = Math.floor(Math.random() * this.connections.length);
                   this.connections[idx].weight = (Math.random() * 2) - 1;
               }
            }
        }
    }

    const GreenhouseGeneticAlgo = {
        population: [],
        generation: 0,
        popSize: 20,
        mutationRate: 0.1,
        bestNetwork: null,

        init() {
            console.log('Genetic Algo: Initializing population...');
            this.population = [];
            for (let i = 0; i < this.popSize; i++) {
                this.population.push(new Network(i, 10, 30, 10));
            }
            this.generation = 1;
            this.evaluate();
        },

        evaluate() {
            // Simulate fitness evaluation
            // In a real scenario, this would test the network against a task.
            // Here, we simulate fitness based on "connectivity balance" or arbitrary goals.

            let maxFitness = -Infinity;
            let bestIndex = -1;

            this.population.forEach((net, index) => {
                // Mock Fitness Function: Prefer weights close to 0.5 or -0.5, avoid 0
                let score = 0;
                net.connections.forEach(c => {
                    score += Math.abs(Math.abs(c.weight) - 0.5);
                });

                // Penalize too many or too few connections
                const density = net.connections.length / (net.nodes.length * 2); // rough estimate
                if (density > 0.8) score -= 5;
                if (density < 0.2) score -= 5;

                // Add random noise to simulate environmental variability
                score += (Math.random() * 2);

                net.fitness = score;

                if (score > maxFitness) {
                    maxFitness = score;
                    bestIndex = index;
                }
            });

            this.bestNetwork = this.population[bestIndex];
        },

        evolve() {
            // Selection & Reproduction
            const newPop = [];

            // Elitism: Keep best
            newPop.push(this.cloneNetwork(this.bestNetwork));

            // Fill rest
            while (newPop.length < this.popSize) {
                const parentA = this.tournamentSelection();
                const parentB = this.tournamentSelection();
                const child = this.crossover(parentA, parentB);
                child.mutate(this.mutationRate);
                newPop.push(child);
            }

            this.population = newPop;
            this.generation++;
            this.evaluate();

            // Mock Activations for Visualization
            this.simulateActivations(this.bestNetwork);
        },

        simulateActivations(network) {
            // Randomly activate inputs
            network.nodes.forEach(n => {
                if (n.type === 'input') n.activation = Math.random();
                else n.activation = 0;
            });

            // Propagate (Simplified)
            network.connections.forEach(conn => {
                const fromNode = network.nodes.find(n => n.id === conn.from);
                const toNode = network.nodes.find(n => n.id === conn.to);
                if (fromNode && toNode) {
                    toNode.activation += fromNode.activation * conn.weight;
                }
            });

            // Activate function (Tanh)
            network.nodes.forEach(n => {
                if (n.type !== 'input') {
                    n.activation = Math.tanh(n.activation);
                }
            });
        },

        tournamentSelection() {
            const k = 3;
            let best = null;
            for (let i = 0; i < k; i++) {
                const ind = this.population[Math.floor(Math.random() * this.population.length)];
                if (best === null || ind.fitness > best.fitness) {
                    best = ind;
                }
            }
            return best;
        },

        crossover(parentA, parentB) {
            // Uniform Crossover
            const child = new Network(-1, 10, 30, 10); // Structure assumed static for now

            // Inherit connections
            // Assuming simplified fixed topology for crossover simplicity in this demo
            // Or just mixing weights
            child.connections = [];

            const len = Math.min(parentA.connections.length, parentB.connections.length);
            for(let i=0; i<len; i++) {
                if (Math.random() > 0.5) {
                    child.connections.push({...parentA.connections[i]});
                } else {
                    child.connections.push({...parentB.connections[i]});
                }
            }

            return child;
        },

        cloneNetwork(network) {
            const clone = new Network(network.id, 10, 30, 10);
            clone.nodes = JSON.parse(JSON.stringify(network.nodes));
            clone.connections = JSON.parse(JSON.stringify(network.connections));
            clone.fitness = network.fitness;
            return clone;
        }
    };

    window.GreenhouseGeneticAlgo = GreenhouseGeneticAlgo;
    console.log('Genetic Algo: Loaded and attached to window.');
})();
