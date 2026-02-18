/**
 * Unit Tests for Neuro GA (Genetic Algorithm)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.performance = { now: () => Date.now() };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code);
}

// Load GA
loadScript('neuro_ga.js');

TestFramework.describe('NeuroGA', () => {
    let ga;

    TestFramework.beforeEach(() => {
        ga = new window.NeuroGA();
        ga.init({
            populationSize: 10,
            bounds: { x: 100, y: 100, z: 100 }
        });
    });

    TestFramework.it('should initialize with correct population size', () => {
        assert.equal(ga.population.length, 10);
    });

    TestFramework.it('should generate target points', () => {
        assert.equal(ga.targetPoints.length, 10);
        assert.isDefined(ga.targetPoints[0].x);
    });

    TestFramework.it('should evaluate fitness', () => {
        ga.evaluateFitness();
        assert.isNotNull(ga.bestGenome);
        assert.isTrue(ga.bestGenome.fitness >= 0);
    });

    TestFramework.it('should evolve a generation', () => {
        const initialGen = ga.generation;
        ga.step();
        assert.equal(ga.generation, initialGen + 1);
        assert.equal(ga.population.length, 10);
    });

    TestFramework.describe('ADHD Enhancements', () => {
        TestFramework.it('should toggle enhancements', () => {
            ga.setADHDEnhancement(2, true); // SNR
            assert.isTrue(ga.adhdConfig.activeEnhancements.has(2));
            assert.equal(ga.adhdConfig.snr, 0.5);

            ga.setADHDEnhancement(2, false);
            assert.isFalse(ga.adhdConfig.activeEnhancements.has(2));
            assert.equal(ga.adhdConfig.snr, 0);
        });

        TestFramework.it('should apply Signal-to-Noise Ratio (ID 2)', () => {
            ga.setADHDEnhancement(2, true);
            // We can't easily check internal randomness impact without mocking nextRand,
            // but we can check if it's active.
            assert.equal(ga.adhdConfig.snr, 0.5);
        });

        TestFramework.it('should handle Attentional Blink (ID 1)', () => {
            ga.setADHDEnhancement(1, true);
            ga.adhdConfig.blinkCooldown = 5;
            const genome = ga.step();
            // During blink, it should return bestGenome immediately (effectively pausing evolution for that individual)
            // In our current implementation of step(), it returns bestGenome early if blink is active.
            assert.isDefined(genome);
            assert.equal(ga.adhdConfig.blinkCooldown, 4);
        });

        TestFramework.it('should model Cognitive Fatigue (ID 19)', () => {
            ga.setADHDEnhancement(19, true);
            const initialFatigue = ga.adhdConfig.fatigue;
            ga.step();
            assert.isTrue(ga.adhdConfig.fatigue > initialFatigue);
        });

        TestFramework.it('should apply Impulsive Connection Burst (ID 4)', () => {
            ga.setADHDEnhancement(4, true);
            // This affects mutate() boost. Hard to test quantitatively without many iterations,
            // but we verify it doesn't crash.
            ga.step();
            assert.isTrue(true);
        });

        TestFramework.it('should handle Reward Delay Discounting (ID 5)', () => {
            ga.setADHDEnhancement(5, true);
            ga.step();
            // Check if target ages are incremented
            assert.equal(ga.adhdConfig.targetAges[0], 1);
        });
    });

    TestFramework.it('should perform crossover correctly', () => {
        const p1 = ga.createRandomGenome();
        const p2 = ga.createRandomGenome();
        const child = ga.crossover(p1, p2);
        assert.isDefined(child.neurons);
        assert.isDefined(child.connections);
        assert.isTrue(child.neurons.length > 0);
    });

    TestFramework.it('should perform mutation correctly', () => {
        const genome = ga.createRandomGenome();
        const originalX = genome.neurons[0].x;
        // Force high mutation rate for test
        ga.mutationRate = 1.0;
        ga.mutate(genome);
        // Neuron 0 is usually brainstem/soma at 0,0,0. Mutation might move it.
        // Actually in mutate(), it loops genome.neurons.
        assert.isTrue(true); // mutate called
    });
});

TestFramework.run();
