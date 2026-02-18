// docs/js/neuro_ga.js
// Genetic Algorithm for Neuron Growth Simulation - Optimized for High Performance

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
                snr: 0.0,
                sustainedAttention: 1.0,
                rewardDelayFactor: 1.0,
                taskSwitchingLatency: 0,
                impulsivityRate: 0.0,
                blinkCooldown: 0,
                fatigue: 0.0,
                learningRateBoost: 1.0,
                targetAges: [], // Track how long targets have been active
                procrastinationLag: 0,
                arousal: 0.5,
                focusReward: 1.0,
                noiseSmoothing: 0.0,
                breakInterval: 0,
                userTarget: null,
                circadianCycle: 0,
                inflammationLevel: 0,
                glutamateGabaRatio: 1.0,
                atpLevel: 1.0,
                epigeneticLocks: new Set(),
                dopamineDepletion: 0,
                cholinergicLoss: 0,
                moodCycle: 0,
                pruningVariance: 0,
                stimulationHistory: [], // For Receptor Downregulation (68)
                comtRate: 1.0, // COMT Genetic Variation (69)
                maoActivity: 1.0, // MAO-A Hyperactivity (70)
                dosagePrecision: 1.0 // Dosage Optimization Slider (48)
            };

            // Optimization: Random buffer to avoid expensive Math.random() in loops
            this.randomBuffer = new Float32Array(5000);
            this.randomIdx = 0;
            this.fillRandomBuffer();
        }

        fillRandomBuffer() {
            for (let i = 0; i < this.randomBuffer.length; i++) {
                this.randomBuffer[i] = Math.random();
            }
            this.randomIdx = 0;
        }

        nextRand() {
            if (this.randomIdx >= this.randomBuffer.length) this.fillRandomBuffer();
            return this.randomBuffer[this.randomIdx++];
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
            if (id === 2) this.adhdConfig.snr = active ? 0.5 : 0.0;
            if (id === 34) this.adhdConfig.noiseSmoothing = active ? 0.8 : 0.0; // Mindfulness
            if (id === 46) this.adhdConfig.learningRateBoost = active ? 2.0 : 1.0;

            // New conditions
            if (id === 69) this.adhdConfig.comtRate = active ? 2.0 : 1.0;
            if (id === 70) this.adhdConfig.maoActivity = active ? 2.5 : 1.0;

            if (id === 101) this.adhdConfig.snr = active ? 0.9 : 0.0; // Schizophrenia noise
            if (id === 102) this.adhdConfig.dopamineDepletion = active ? 0.7 : 0.0; // Parkinson's
            if (id === 103) this.adhdConfig.cholinergicLoss = active ? 0.6 : 0.0; // Alzheimer's
            if (id === 104) this.adhdConfig.atpLevel = active ? 0.4 : 1.0; // MDD energy drop
            if (id === 106) this.adhdConfig.pruningVariance = active ? 0.8 : 0.0; // Autism

            // Expanded Treatments
            if (id === 107) this.adhdConfig.snr = active ? 0.2 : this.adhdConfig.snr; // Antipsychotic dampens noise
            if (id === 108) this.adhdConfig.dopamineDepletion = active ? 0.1 : this.adhdConfig.dopamineDepletion; // L-DOPA restores
            if (id === 110) this.adhdConfig.moodCycle = active ? 0.5 : this.adhdConfig.moodCycle; // Lithium stabilizes
        }

        generateTargetPoints(count) {
            this.targetPoints = [];
            this.adhdConfig.targetAges = [];
            for (let i = 0; i < count; i++) {
                this.targetPoints.push({
                    x: (this.nextRand() - 0.5) * this.bounds.x,
                    y: (this.nextRand() - 0.5) * this.bounds.y,
                    z: (this.nextRand() - 0.5) * this.bounds.z
                });
                this.adhdConfig.targetAges.push(0);
            }

            // ADHD: Task-Switching Latency (Enhancement 6)
            if (this.adhdConfig.activeEnhancements.has(6)) {
                this.adhdConfig.taskSwitchingLatency = 10; // Pause evaluation for 10 frames
            }

            // ADHD: Procrastination Lag (Enhancement 22)
            if (this.adhdConfig.activeEnhancements.has(22)) {
                this.adhdConfig.procrastinationLag = 20; // Longer pause for new tasks
            }
        }

        createInitialPopulation() {
            this.population = [];
            for (let i = 0; i < this.populationSize; i++) {
                this.population.push(this.createRandomGenome());
            }

            // ADHD: Early Life Stress (ELS) Map (Enhancement 80) / Maternal Immune Activation (85)
            if (this.adhdConfig.activeEnhancements.has(80) || this.adhdConfig.activeEnhancements.has(85)) {
                this.population.forEach(g => {
                    // Force more Amygdala nodes
                    g.neurons.push({ x: -30, y: 150, z: 50, id: g.neurons.length, region: 'amygdala', type: 'inhibitory' });
                });
                if (this.adhdConfig.activeEnhancements.has(85)) this.adhdConfig.inflammationLevel = 0.8;
            }

            this.evaluateFitness();
        }

        createRandomGenome() {
            // ADHD: Prenatal Exposure Simulation (Enhancement 78)
            const prenatalNoise = this.adhdConfig.activeEnhancements.has(78) ? 50 : 0;

            // ADHD: Working Memory Buffer Overflow (Enhancement 9)
            let neuronCount = 15;
            if (this.adhdConfig.activeEnhancements.has(9)) {
                neuronCount = 5 + Math.floor(this.nextRand() * 5); // Severely limited capacity
            }

            const neurons = [];
            const regionKeys = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem', 'motorCortex'];

            // Start with a central neuron
            neurons.push({ x: 0, y: 0, z: 0, id: 0, type: 'soma', region: 'brainstem' });

            for (let i = 1; i < neuronCount; i++) {
                neurons.push({
                    x: (this.nextRand() - 0.5) * this.bounds.x + (this.nextRand() - 0.5) * prenatalNoise,
                    y: (this.nextRand() - 0.5) * this.bounds.y + (this.nextRand() - 0.5) * prenatalNoise,
                    z: (this.nextRand() - 0.5) * this.bounds.z + (this.nextRand() - 0.5) * prenatalNoise,
                    id: i,
                    type: 'dendrite',
                    region: regionKeys[i % regionKeys.length]
                });
            }

            // Random connections
            const connections = [];
            for (let i = 0; i < neuronCount; i++) {
                // Connect to 1-3 other random neurons
                const numConnections = Math.floor(this.nextRand() * 3) + 1;
                for (let j = 0; j < numConnections; j++) {
                    const targetId = Math.floor(this.nextRand() * neuronCount);
                    if (targetId !== i) {
                        connections.push({ from: i, to: targetId, weight: this.nextRand() });
                    }
                }
            }

            return {
                neurons: neurons,
                connections: connections,
                fitness: 0,
                generation: this.generation,
                parentId: null
            };
        }

        evaluateFitness() {
            let maxFitness = -Infinity;
            this.bestGenome = null;

            // ADHD: Gut-Brain Axis Interaction (Enhancement 94)
            const metabolicPlasticity = this.adhdConfig.activeEnhancements.has(94) ? 1.2 : 1.0;

            // ADHD: Timed Break Intervals (Enhancement 44)
            if (this.adhdConfig.activeEnhancements.has(44)) {
                if (this.generation % 500 === 0) this.adhdConfig.breakInterval = 50;
                if (this.adhdConfig.breakInterval > 0) {
                    this.adhdConfig.breakInterval--;
                    return;
                }
            }

            // ADHD: Sensory Overload Mode (Enhancement 18)
            if (this.adhdConfig.activeEnhancements.has(18) && this.generation % 50 === 0) {
                this.generateTargetPoints(this.targetPoints.length + 1);
            }

            // ADHD: Task-Switching Latency (Enhancement 6) / Procrastination Lag (Enhancement 22)
            if (this.adhdConfig.taskSwitchingLatency > 0) {
                this.adhdConfig.taskSwitchingLatency--;
                return;
            }
            if (this.adhdConfig.procrastinationLag > 0) {
                this.adhdConfig.procrastinationLag--;
                return;
            }

            // ADHD: Neurofeedback Training Loop (Enhancement 32)
            // Reward individuals that stay near previously high-fitness centers
            const neurofeedbackReward = this.adhdConfig.activeEnhancements.has(32) ? 1.2 : 1.0;

            // ADHD: Sustained Attention Decay (Enhancement 7)
            const attentionMultiplier = this.adhdConfig.activeEnhancements.has(7) ? this.adhdConfig.sustainedAttention : 1.0;

            // ADHD: Locus Coeruleus Instability (Enhancement 74)
            const lcMultiplier = this.adhdConfig.activeEnhancements.has(74) ? (0.5 + this.nextRand()) : 1.0;

            // ADHD: Social Support Buffering (Enhancement 41)
            const socialSupport = this.adhdConfig.activeEnhancements.has(41) ? 1.3 : 1.0;

            // Bipolar: Rhythmic Mood Cycling (105)
            if (this.adhdConfig.activeEnhancements.has(105)) {
                this.adhdConfig.moodCycle = (Math.sin(this.generation * 0.05) + 1) / 2; // 0 to 1 cycle
            }

            this.population.forEach(genome => {
                let fitness = 0;

                // ADHD: Receptor Downregulation (Enhancement 68)
                let responseSensitivity = 1.0;
                if (this.adhdConfig.activeEnhancements.has(68)) {
                    const recentStim = this.adhdConfig.stimulationHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
                    if (recentStim > 500) responseSensitivity = 0.5; // Diminished response
                }

                // Optimization: Pre-calculate square bounds for fast distance checks
                const targetDistSqThreshold = 100 * 100;

                // 1. Connectivity Score: Reward connections to target points
                genome.neurons.forEach(neuron => {
                    // ADHD: Signal-to-Noise Ratio (Enhancement 2)
                    let nx = neuron.x;
                    let ny = neuron.y;
                    let nz = neuron.z;
                    if (this.adhdConfig.activeEnhancements.has(2)) {
                        const smoothing = this.adhdConfig.noiseSmoothing; // Mindfulness (34)
                        const noise = (this.nextRand() - 0.5) * 50 * this.adhdConfig.snr * (1 - smoothing);
                        nx += noise;
                        ny += noise;
                        nz += noise;
                    }

                    this.targetPoints.forEach((target, tIdx) => {
                        // ADHD: Thalamic Gating Dysfunction (Enhancement 61) / Pesticide Exposure (87)
                        if (this.adhdConfig.activeEnhancements.has(61) || this.adhdConfig.activeEnhancements.has(87)) {
                            nx += (this.nextRand() - 0.5) * 20; // Extra noise/disruption
                        }

                        // ADHD: Reward Delay Discounting (Enhancement 5)
                        let delayDiscount = 1.0;
                        if (this.adhdConfig.activeEnhancements.has(5)) {
                            const age = this.adhdConfig.targetAges[tIdx];
                            // ADHD: Over-Stimulation Modeling (Enhancement 89)
                            const delayDecay = this.adhdConfig.activeEnhancements.has(89) ? 0.05 : 0.01;
                            delayDiscount = Math.exp(-delayDecay * age);
                        }

                        // ADHD: Interference Sensitivity (Enhancement 8)
                        let interference = 1.0;
                        if (this.adhdConfig.activeEnhancements.has(8)) {
                            interference = 1.0 - (this.adhdConfig.snr * 0.5);
                        }

                        // ADHD: Salience Network Misalignment (Enhancement 59)
                        let targetWeight = 1.0;
                        if (this.adhdConfig.activeEnhancements.has(59) && tIdx % 2 !== 0) targetWeight = 1.5;

                        // Optimization: Use squared distance for inner loop check
                        const dx = nx - target.x;
                        const dy = ny - target.y;
                        const dz = nz - target.z;
                        const distSq = dx * dx + dy * dy + dz * dz;

                        if (distSq < targetDistSqThreshold) {
                            const dist = Math.sqrt(distSq);
                            // ADHD: Evolutionary Adaptation View (Enhancement 93)
                            const noveltyBonus = this.adhdConfig.activeEnhancements.has(93) ? 1.5 : 1.0;

                            // ADHD: Dosage Optimization Slider (Enhancement 48) - precision impact
                            const precision = this.adhdConfig.dosagePrecision;

                            fitness += (100 - dist) * targetWeight * delayDiscount * interference * attentionMultiplier * neurofeedbackReward * socialSupport * lcMultiplier * metabolicPlasticity * noveltyBonus * responseSensitivity * precision;
                        }

                        // ADHD: Gamified Focus Tasks (Enhancement 43)
                        if (this.adhdConfig.userTarget) {
                            const udx = nx - this.adhdConfig.userTarget.x;
                            const udy = ny - this.adhdConfig.userTarget.y;
                            const udz = nz - this.adhdConfig.userTarget.z;
                            if (udx * udx + udy * udy + udz * udz < 2500) fitness += 500; // Large reward for user-defined focus
                        }
                    });
                });

                // ADHD: Amygdala Hyper-Sensitivity (Enhancement 73)
                if (this.adhdConfig.activeEnhancements.has(73)) {
                    // Trigger threat response to neutral targets (penalize fitness)
                    if (this.nextRand() < 0.1) fitness *= 0.5;
                }

                // ADHD: HPA Axis Overdrive (Enhancement 96)
                if (this.adhdConfig.activeEnhancements.has(96)) {
                    // Chronic cortisol shrinks hippocampal nodes (penalize memory/parietal regions)
                    if (genome.neurons.some(n => n.region === 'parietalLobe')) fitness -= 30;
                }

                // ADHD: Disorganization Entropy (Enhancement 21)
                if (this.adhdConfig.activeEnhancements.has(21)) {
                    // Penalize randomness in connection directions
                    let entropy = 0;
                    genome.connections.forEach(c => {
                        const n1 = genome.neurons[c.from];
                        const n2 = genome.neurons[c.to];
                        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
                        entropy += Math.abs(angle);
                    });
                    fitness -= (entropy * 0.1);
                }

                // ADHD: Treatment - Non-Stimulant NE Modulation (Enhancement 29)
                if (this.adhdConfig.activeEnhancements.has(29)) {
                    genome.neurons.forEach(n => {
                        if (n.region === 'pfc') fitness += 10; // Boost PFC specific fitness
                    });
                }

                // ADHD: Glutamate/GABA Imbalance (Enhancement 62)
                if (this.adhdConfig.activeEnhancements.has(62)) {
                    const excitatoryCount = genome.neurons.filter(n => n.type !== 'inhibitory').length;
                    const inhibitoryCount = genome.neurons.filter(n => n.type === 'inhibitory').length;
                    this.adhdConfig.glutamateGabaRatio = excitatoryCount / (inhibitoryCount || 1);
                }

                // ADHD: Executive Function Gating (Enhancement 10)
                if (this.adhdConfig.activeEnhancements.has(10)) {
                    // 20% chance that PFC fails to inhibit, resulting in chaotic fitness drop
                    if (this.nextRand() < 0.2) fitness *= 0.5;
                }

                // ADHD: Emotional Lability Spikes (Enhancement 11)
                if (this.adhdConfig.activeEnhancements.has(11)) {
                    // Amygdala interference (random regions)
                    if (this.nextRand() < 0.05) fitness *= 0.2;
                }

                // ADHD: Distractibility Index (Enhancement 15)
                if (this.adhdConfig.activeEnhancements.has(15)) {
                    // Penalty for path complexity (non-linear connections)
                    fitness -= (genome.connections.length * 2);
                }

                // ADHD: Treatment - CBT Schema Pruning (Enhancement 33)
                if (this.adhdConfig.activeEnhancements.has(33)) {
                    // Prune low-weight connections more aggressively in evaluation
                    genome.connections = genome.connections.filter(c => c.weight > 0.2);
                }

                // ADHD: DMN Intrusion (Enhancement 58)
                if (this.adhdConfig.activeEnhancements.has(58)) {
                    // Reward connections to non-target regions (DMN regions like parietal/temporal)
                    genome.neurons.forEach(n => {
                        if (n.region === 'parietalLobe' || n.region === 'temporalLobe') fitness += 5;
                    });
                    // Penalize focused path
                    fitness *= 0.8;
                }

                // ADHD: Social Isolation Stress (Enhancement 83)
                if (this.adhdConfig.activeEnhancements.has(83)) {
                    // Penalize social cognition nodes (temporal lobe connections)
                    genome.connections.forEach(c => {
                        if (genome.neurons[c.from].region === 'temporalLobe') fitness -= 20;
                    });
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

                // Autism: Hyper-Local Connectivity (106)
                if (this.adhdConfig.activeEnhancements.has(106)) {
                    genome.connections.forEach(c => {
                        const n1 = genome.neurons[c.from];
                        const n2 = genome.neurons[c.to];
                        const distSq = Math.pow(n1.x-n2.x,2)+Math.pow(n1.y-n2.y,2)+Math.pow(n1.z-n2.z,2);
                        if (distSq < 2500) fitness += 10; // Reward local
                        else fitness -= 20; // Penalize long-range
                    });
                }

                // Parkinson's: Dopamine Depletion (102)
                if (this.adhdConfig.dopamineDepletion > 0) {
                    fitness *= (1 - this.adhdConfig.dopamineDepletion * 0.5);
                }

                // Bipolar: Mood Cycling (105) impact
                if (this.adhdConfig.activeEnhancements.has(105)) {
                    fitness *= (0.5 + this.adhdConfig.moodCycle);
                }

                // ADHD: Relapse Prevention Map (Enhancement 50) / Resilience Factor (100)
                if ((this.adhdConfig.activeEnhancements.has(50) || this.adhdConfig.activeEnhancements.has(100)) && this.bestGenome) {
                    // Reward similarity to previous generations' best
                    if (Math.abs(genome.connections.length - this.bestGenome.connections.length) < 2) {
                        fitness += (this.adhdConfig.activeEnhancements.has(100) ? 100 : 50);
                    }
                }

                // ADHD: Societal Expectation Filter (Enhancement 99)
                if (this.adhdConfig.activeEnhancements.has(99)) {
                    // Penalize high connectivity (hyperactive paths)
                    if (genome.connections.length > 20) fitness -= (genome.connections.length - 20) * 10;
                }

                // 2. Network Cohesion: Penalize isolated clusters (simplified)
                let cohesionWeight = 5;
                // ADHD: Pathology - Synaptic Pruning Deficits (Enhancement 57)
                if (this.adhdConfig.activeEnhancements.has(57)) cohesionWeight = 10; // Reward over-connectivity

                fitness += genome.connections.length * cohesionWeight * this.adhdConfig.learningRateBoost;

                // 3. Spacial Distribution: Penalize neurons being too close to each other
                const overlapDistSq = 400; // 20*20
                for(let i=0; i<genome.neurons.length; i++) {
                    const n1 = genome.neurons[i];
                    for(let j=i+1; j<genome.neurons.length; j++) {
                        const n2 = genome.neurons[j];
                         const dx = n1.x - n2.x;
                         const dy = n1.y - n2.y;
                         const dz = n1.z - n2.z;
                        if (dx*dx + dy*dy + dz*dz < overlapDistSq) fitness -= 50; // Penalty for overlap
                    }
                }

                genome.fitness = fitness;

                // Track stimulation history for downregulation
                if (this.adhdConfig.activeEnhancements.has(68)) {
                    this.adhdConfig.stimulationHistory.push(fitness);
                    if (this.adhdConfig.stimulationHistory.length > 50) this.adhdConfig.stimulationHistory.shift();
                }

                if (fitness > maxFitness) {
                    maxFitness = fitness;
                    this.bestGenome = genome;
                }
            });
        }

        step() {
            // ADHD: TBI (88) / Birth Complication (98)
            if (this.adhdConfig.activeEnhancements.has(88) || this.adhdConfig.activeEnhancements.has(98)) {
                if (this.nextRand() < 0.001) {
                    this.population.forEach(g => g.fitness *= 0.1);
                }
            }

            // Alzheimer's: Cholinergic Loss (103)
            if (this.adhdConfig.activeEnhancements.has(103)) {
                if (this.nextRand() < 0.05) {
                    // Random node death in population
                    this.population.forEach(g => {
                        if (g.neurons.length > 5) {
                            g.neurons.splice(Math.floor(this.nextRand() * g.neurons.length), 1);
                        }
                    });
                }
            }

            // ADHD: Over-Stimulation Modeling (Enhancement 89)
            if (this.adhdConfig.activeEnhancements.has(89)) {
                this.adhdConfig.rewardDelayFactor = 2.0;
            }

            // ADHD: SES Buffering (Enhancement 90)
            if (this.adhdConfig.activeEnhancements.has(90)) {
                 this.adhdConfig.fatigue *= 0.95;
                 this.adhdConfig.inflammationLevel *= 0.95;
            }

            // ADHD: Cerebellar Coordination Lag (Enhancement 60)
            if (this.adhdConfig.activeEnhancements.has(60) && this.nextRand() < 0.1) {
                return this.bestGenome; // Extra lag step
            }

            // ADHD: Circadian Rhythm Desync (Enhancement 67)
            this.adhdConfig.circadianCycle = (this.adhdConfig.circadianCycle + 1) % 1000;
            if (this.adhdConfig.activeEnhancements.has(67) && this.adhdConfig.circadianCycle > 500) {
                return this.bestGenome;
            }

            // ADHD: Reward Delay Tracking
            this.adhdConfig.targetAges = this.adhdConfig.targetAges.map(age => age + 1);

            // ADHD: Arousal Dysregulation (Enhancement 24)
            if (this.adhdConfig.activeEnhancements.has(24)) {
                this.adhdConfig.arousal = 0.3 + this.nextRand() * 0.7;
            }

            // ADHD: Time Perception Distortion (Enhancement 12)
            if (this.adhdConfig.activeEnhancements.has(12)) {
                const roll = this.nextRand();
                if (roll < 0.1) return this.bestGenome; // Dilation
                if (roll > 0.9) this.evaluateFitness(); // Contraction
            }

            // ADHD: Attentional Blink (Enhancement 1)
            if (this.adhdConfig.activeEnhancements.has(1)) {
                if (this.adhdConfig.blinkCooldown > 0) {
                    this.adhdConfig.blinkCooldown--;
                    return this.bestGenome;
                }
                if (this.nextRand() < 0.05) this.adhdConfig.blinkCooldown = 5;
            }

            // ADHD: Methylphenidate Pulse (Enhancement 27)
            if (this.adhdConfig.activeEnhancements.has(27) && this.generation % 50 === 0) {
                // Periodic normalization: reset some fatigue and noise
                this.adhdConfig.fatigue *= 0.5;
                this.adhdConfig.snr *= 0.5;
            }

            // 1. Selection
            const newPopulation = [];

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
                if (this.adhdConfig.activeEnhancements.has(82)) this.adhdConfig.snr = Math.min(1.0, this.adhdConfig.snr + 0.01);
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
            if (this.adhdConfig.activeEnhancements.has(23) && this.nextRand() < 0.3) {
                this.population.forEach(genome => {
                    if (genome.connections.length > 5) {
                        genome.connections.splice(Math.floor(this.nextRand() * genome.connections.length), 1);
                    }
                });
            }

            this.population = newPopulation;
            this.generation++;
            this.evaluateFitness();

            return this.bestGenome;
        }

        selectParent() {
            const k = 3;
            let best = null;
            for (let i = 0; i < k; i++) {
                const ind = this.population[Math.floor(this.nextRand() * this.population.length)];
                if (!best || ind.fitness > best.fitness) {
                    best = ind;
                }
            }
            return best;
        }

        crossover(parentA, parentB) {
            const split = Math.floor(parentA.neurons.length / 2);
            const childNeurons = [
                ...parentA.neurons.slice(0, split),
                ...parentB.neurons.slice(split)
            ];

            childNeurons.forEach((n, idx) => n.id = idx);

            const childConnections = [];
            const maxConnections = Math.max(parentA.connections.length, parentB.connections.length);
            for (let i = 0; i < maxConnections; i++) {
                if (this.nextRand() < 0.5) {
                    if (parentA.connections[i]) childConnections.push(parentA.connections[i]);
                } else {
                    if (parentB.connections[i]) childConnections.push(parentB.connections[i]);
                }
            }

            const validConnections = childConnections.filter(c =>
                c.from < childNeurons.length && c.to < childNeurons.length
            );

            return {
                neurons: childNeurons,
                connections: validConnections,
                fitness: 0,
                generation: this.generation,
                parentId: parentA.id // Simplified heredity tracking
            };
        }

        mutate(genome) {
            // ADHD: Gene-Environment Interaction (Enhancement 91)
            if (this.adhdConfig.activeEnhancements.has(91)) {
                this.mutationRate *= (1 + this.adhdConfig.inflammationLevel * 0.5);
            }

            // ADHD: Epigenetic Methylation (Enhancement 84)
            if (this.adhdConfig.activeEnhancements.has(84)) {
                if (this.nextRand() < 0.01) {
                    const idx = Math.floor(this.nextRand() * genome.neurons.length);
                    this.adhdConfig.epigeneticLocks.add(genome.neurons[idx].id);
                }
            }

            // ADHD: Oxidative Stress Damage (Enhancement 64)
            if (this.adhdConfig.activeEnhancements.has(64) && this.generation > 1000) {
                if (this.nextRand() < 0.05) {
                     const idx = Math.floor(this.nextRand() * genome.neurons.length);
                     genome.neurons[idx].burnedOut = true;
                }
            }

            // ADHD: Hyperactive Firing Mode (Enhancement 3)
            let hyperMultiplier = 1.0;
            if (this.adhdConfig.activeEnhancements.has(3)) hyperMultiplier = 2.5;

            // ADHD: Genetic Predisposition (76) & BDNF (36/63)
            let currentMutationRate = this.mutationRate * hyperMultiplier;
            if (this.adhdConfig.activeEnhancements.has(76)) currentMutationRate *= 1.5;
            if (this.adhdConfig.activeEnhancements.has(36)) currentMutationRate *= 2.0;
            if (this.adhdConfig.activeEnhancements.has(63)) currentMutationRate *= 0.5;

            // ADHD: Lead Toxicity (79)
            if (this.adhdConfig.activeEnhancements.has(79) && this.nextRand() < 0.01) {
                const killIdx = Math.floor(this.nextRand() * genome.neurons.length);
                if (genome.neurons[killIdx].id !== 0) {
                    genome.neurons.splice(killIdx, 1);
                }
            }

            // ADHD: Dietary Omega-3 Fluidity (37)
            const fluidity = this.adhdConfig.activeEnhancements.has(37) ? 2.0 : 1.0;

            genome.neurons.forEach(n => {
                if (this.adhdConfig.epigeneticLocks.has(n.id)) return;

                if (this.nextRand() < currentMutationRate) {
                    // ADHD: Nutritional Deficiency (81) / Hypoxia (86)
                    const energy = this.adhdConfig.activeEnhancements.has(81) || this.adhdConfig.activeEnhancements.has(86) ? 0.5 : 1.0;
                    n.x += (this.nextRand() - 0.5) * 20 * fluidity * energy;
                    n.y += (this.nextRand() - 0.5) * 20 * fluidity * energy;
                    n.z += (this.nextRand() - 0.5) * 20 * fluidity * energy;
                }
            });

            // ADHD: Impulsive Connection Burst (4) / Microbiome (95)
            const impulsivityBoost = this.adhdConfig.activeEnhancements.has(4) ? 5 : 1;
            const precursorBoost = this.adhdConfig.activeEnhancements.has(95) ? 1.5 : 1.0;

            if (this.nextRand() < currentMutationRate * impulsivityBoost * precursorBoost) {
                const from = Math.floor(this.nextRand() * genome.neurons.length);
                const to = Math.floor(this.nextRand() * genome.neurons.length);
                if (from !== to) {
                    genome.connections.push({ from, to, weight: this.nextRand() });
                }
            }

            if (this.nextRand() < this.mutationRate && genome.connections.length > 0) {
                const idx = Math.floor(this.nextRand() * genome.connections.length);
                genome.connections.splice(idx, 1);
            }
        }
    }

    // Export
    window.NeuroGA = NeuroGA;
})();
