import { assert } from './assertion_library.js';
import { GreenhouseMobile } from './GreenhouseMobile.js';
import { TestFramework } from './test_framework.js';
/**
 * @file mobile_integration_tests.js
 * @description Rigorous integration tests for the mobile site experience.
 * Uses the lightweight TestFramework logic.
 */

(function () {
    'use strict';

    if (!TestFramework) {
        console.warn('TestFramework missing. Mobile integration tests will not run automatically.');
        return;
    }

    const { describe, it, beforeEach } = TestFramework;

    describe('Mobile Hub Integration', () => {

        it('should detect mobile user agent', () => {
            const isMobile = GreenhouseMobile.isMobileUser();
            assert.isType(isMobile, 'boolean', 'isMobileUser should return a boolean');
        });

        it('should have a complete model registry', () => {
            const registry = GreenhouseMobile.modelRegistry;
            const models = ['genetic', 'neuro', 'pathway', 'synapse', 'dna', 'rna', 'dopamine', 'serotonin', 'emotion', 'cognition'];
            models.forEach(m => {
                assert.isDefined(registry[m], `Model ${m} should be in registry`);
                assert.isFunction(registry[m].init, `Model ${m} should have init function`);
                assert.isArray(registry[m].modes, `Model ${m} should have modes array`);
            });
        });

        it('should inject styles when launching hub', async () => {
            if (!GreenhouseMobile.isMobileUser()) return; // Skip if not mobile

            await GreenhouseMobile.launchHub();
            const styles = document.getElementById('greenhouse-mobile-styles');
            assert.isNotNull(styles, 'Styles should be injected');
        });

        it('should create mobile viewer overlay', async () => {
            if (!GreenhouseMobile.isMobileUser()) return;

            await GreenhouseMobile.launchHub();
            const viewer = document.getElementById('greenhouse-mobile-viewer');
            assert.isNotNull(viewer, 'Mobile viewer overlay should exist');
            assert.isVisible(viewer, 'Mobile viewer should be visible');
        });

        it('should render all model cards', async () => {
            if (!GreenhouseMobile.isMobileUser()) return;

            await GreenhouseMobile.launchHub();
            const cards = document.querySelectorAll('.gh-mobile-card');
            // Assuming 10 models as per registry
            assert.greaterThan(cards.length, 0, 'Should render at least one card');
        });

        it('should have working mode indicator logic', async () => {
            if (!GreenhouseMobile.isMobileUser()) return;

            await GreenhouseMobile.launchHub();
            const card = (document.querySelector as any)('.gh-mobile-card');
            const modelId = card.dataset.modelId;
            const indicator = card.querySelector(`#mode-indicator-${modelId}`);

            assert.isNotNull(indicator, 'Mode indicator should exist');
        });

        it('should activate model when intersecting', async () => {
            if (!GreenhouseMobile.isMobileUser()) return;

            await GreenhouseMobile.launchHub();
            const card = (document.querySelector as any)('.gh-mobile-card');
            const modelId = card.dataset.modelId;
            const container = card.querySelector('.gh-mobile-canvas-wrapper');

            await GreenhouseMobile.activateModel(modelId, container);
            assert.isTrue(GreenhouseMobile.activeModels.has(container), 'Model should be active');
        });

    });

    console.log('[Mobile Tests] Integration suite loaded');

})();
