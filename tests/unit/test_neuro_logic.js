/**
 * @file test_neuro_logic.js
 * @description Unit tests for Neuro Genetic Algorithm and Core Logic.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/neuro_ga.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('Neuro Genetic Algorithm (Unit)', () => {

    let GA;

    TestFramework.beforeEach(() => {
        GA = new window.NeuroGA();
        GA.init({ populationSize: 10 });
    });

    TestFramework.it('should initialize with correct population size', () => {
        assert.equal(GA.population.length, 10);
    });

    TestFramework.it('should generate target points within bounds', () => {
        GA.generateTargetPoints(5);
        assert.equal(GA.targetPoints.length, 5);
        GA.targetPoints.forEach(p => {
            assert.inRange(p.x, -200, 201);
            assert.inRange(p.y, -200, 201);
            assert.inRange(p.z, -200, 201);
        });
    });

    TestFramework.describe('Genome Logic', () => {
        TestFramework.it('should create valid random genomes', () => {
            const genome = GA.createRandomGenome();
            assert.isDefined(genome.neurons);
            assert.greaterThan(genome.neurons.length, 0);
            assert.equal(genome.neurons[0].type, 'soma');
            assert.greaterThan(genome.connections.length, 0);
        });

        TestFramework.it('should calculate fitness scores', () => {
            GA.evaluateFitness();
            GA.population.forEach(ind => {
                assert.isNumber(ind.fitness);
            });
            assert.isDefined(GA.bestGenome);
        });
    });

    TestFramework.describe('Evolution Cycle', () => {
        TestFramework.it('should advance generations', () => {
            assert.equal(GA.generation, 0);
            GA.step();
            assert.equal(GA.generation, 1);
        });

        TestFramework.it('crossover should produce child from both parents', () => {
            const p1 = GA.population[0];
            const p2 = GA.population[1];
            const child = GA.crossover(p1, p2);

            assert.equal(child.neurons.length, p1.neurons.length); // neurons length is fixed in mock
            // Verify IDs are fixed
            assert.equal(child.neurons[0].id, 0);
            assert.equal(child.neurons[child.neurons.length - 1].id, child.neurons.length - 1);
        });

        TestFramework.it('mutate should modify genome', () => {
            const genome = GA.createRandomGenome();
            const originalX = genome.neurons[1].x;

            // Force mutation
            GA.mutationRate = 1.0;
            GA.mutate(genome);

            const newX = genome.neurons[1].x;
            assert.notEqual(originalX, newX);
        });
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
