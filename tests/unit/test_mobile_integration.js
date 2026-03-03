/**
 * @file test_mobile_integration.js
 * @description Comprehensive integration tests for mobile model viewer functionality
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const { createEnv, loadScript } = require('../utils/test_env_factory.js');

const setupMobileEnv = (overrides = {}) => {
    const env = createEnv(overrides);

    // Add specific mock for GreenhouseMobile.js needs
    const originalQuerySelector = env.document.querySelector;
    env.document.querySelector = (sel) => {
        if (sel === '#gh-mobile-scroller' || sel === '#gh-mobile-dots' || sel === '.gh-mobile-canvas-wrapper' || sel === '#greenhouse-mobile-close-btn') {
            const sub = env.document.createElement('div');
            sub.id = sel.startsWith('#') ? sel.substring(1) : '';
            return sub;
        }
        return originalQuerySelector(sel);
    };

    loadScript(env, 'docs/js/GreenhouseUtils.js');
    loadScript(env, 'docs/js/GreenhouseMobile.js');
    return env;
};

TestFramework.describe('Mobile Integration Tests', () => {

    TestFramework.describe('Mobile Detection', () => {
        TestFramework.it('should detect mobile by user agent', () => {
            const env = setupMobileEnv({ navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' } });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect iPhone');
        });

        TestFramework.it('should detect iPad Pro (MacIntel + multi-touch)', () => {
            const env = setupMobileEnv({
                innerWidth: 1024,
                navigator: {
                    platform: 'MacIntel',
                    maxTouchPoints: 5,
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
                }
            });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect iPad Pro as mobile');
        });

        TestFramework.it('should detect mobile by screen width and touch', () => {
            const env = setupMobileEnv({
                innerWidth: 500,
                navigator: { maxTouchPoints: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                ontouchstart: () => { }
            });
            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect narrow touch device');
        });

        TestFramework.it('should not detect desktop as mobile', () => {
            const env = setupMobileEnv({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 0 }
            });
            assert.isFalse(env.GreenhouseMobile.isMobileUser(), 'Should not detect desktop');
        });

        TestFramework.it('should not detect desktop touchscreens as mobile', () => {
            const env = setupMobileEnv({
                innerWidth: 1920,
                navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', maxTouchPoints: 10 }
            });
            assert.isFalse(env.GreenhouseMobile.isMobileUser(), 'Should not detect desktop even with touch');
        });

        TestFramework.it('should detect mobile via matchMedia fallback if narrow', () => {
            const env = setupMobileEnv({
                innerWidth: 500,
                matchMedia: (q) => ({
                    media: q,
                    matches: q === '(pointer:coarse)'
                })
            });
            // Force removal of maxTouchPoints to trigger matchMedia fallback
            // We must delete it from the actual navigator object in the environment
            delete env.navigator.maxTouchPoints;

            assert.isTrue(env.GreenhouseMobile.isMobileUser(), 'Should detect via pointer:coarse on narrow screen');
        });
    });

    TestFramework.describe('Model Registry', () => {
        TestFramework.it('should have all required models registered', () => {
            const env = setupMobileEnv();
            const expectedModels = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            expectedModels.forEach(modelId => {
                assert.isTrue(!!env.GreenhouseMobile.modelRegistry[modelId], `Model ${modelId} should be registered`);
            });
        });
    });

    TestFramework.describe('Resilient Data Fetching', () => {
        TestFramework.it('should use fallback when XML fetch fails', async () => {
            const env = setupMobileEnv({ fetch: () => Promise.reject(new Error('Network failure')) });
            const models = await env.GreenhouseUtils.fetchModelDescriptions();
            assert.isArray(models);
            assert.equal(models.length, 10, 'Should return all 10 models from fallback');
        });
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
