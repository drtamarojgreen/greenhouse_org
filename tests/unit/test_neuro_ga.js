/**
 * Unit Tests for Neuro GA (Genetic Algorithm)
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockWindow = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        performance: { now: () => Date.now() }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/neuro_ga.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return context;
};

TestFramework.describe('NeuroGA', () => {
    let env;
    let ga;

    TestFramework.beforeEach(() => {
        env = createEnv();
        ga = new env.window.NeuroGA();
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

        TestFramework.it('should handle Attentional Blink (ID 1)', () => {
            ga.setADHDEnhancement(1, true);
            ga.adhdConfig.blinkCooldown = 5;
            ga.step();
            assert.equal(ga.adhdConfig.blinkCooldown, 4);
        });

        TestFramework.it('should model Cognitive Fatigue (ID 19)', () => {
            ga.setADHDEnhancement(19, true);
            const initialFatigue = ga.adhdConfig.fatigue;
            ga.step();
            assert.isTrue(ga.adhdConfig.fatigue > initialFatigue);
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

});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
