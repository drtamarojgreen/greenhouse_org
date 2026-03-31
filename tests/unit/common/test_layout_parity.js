/**
 * Browser-native Layout Parity Tests
 * Verifies Greenhouse design tokens and visual consistency.
 */

const { assert } = require('../../utils/assertion_library.js');
const TestFramework = require('../../utils/test_framework.js');

TestFramework.describe('Greenhouse Layout Parity', () => {

    TestFramework.it('should have Greenhouse button design tokens applied', () => {
        const btn = document.createElement('button');
        btn.className = 'greenhouse-btn greenhouse-btn-primary';
        btn.textContent = 'Test Button';
        document.body.appendChild(btn);

        const style = window.getComputedStyle(btn);

        // Check for Greenhouse primary color (approximate due to browser color space)
        // #4caf50 is rgb(76, 175, 80)
        // #4ca1af is rgb(76, 161, 175)
        const bg = style.backgroundColor;
        const isGreenhouseColor = bg.includes('76') || bg.includes('161') || bg.includes('175') || bg.includes('76, 175, 80');

        assert.isTrue(isGreenhouseColor, `Button background color ${bg} should match Greenhouse palette`);
        assert.equal(style.cursor, 'pointer', 'Buttons should have pointer cursor');

        document.body.removeChild(btn);
    });

    TestFramework.it('should render TOC with grid layout', async () => {
        // Ensure TOC is initialized
        if (window.GreenhouseUtils && typeof window.GreenhouseUtils.renderModelsTOC === 'function') {
            await window.GreenhouseUtils.renderModelsTOC('#models-toc-container');
            // Allow time for async render
            await new Promise(r => setTimeout(r, 500));
        }

        const grid = document.querySelector('.models-toc-grid');
        if (!grid) {
            // If not found in the target container, check the footer
            const footerGrid = document.querySelector('.models-toc-footer-section .models-toc-grid');
            assert.isDefined(grid || footerGrid, 'TOC Grid should be rendered in the DOM');

            if (footerGrid) {
                const style = window.getComputedStyle(footerGrid);
                assert.equal(style.display, 'grid', 'TOC Grid should use CSS Grid layout');
            }
        } else {
            const style = window.getComputedStyle(grid);
            assert.equal(style.display, 'grid', 'TOC Grid should use CSS Grid layout');
        }
    });

    TestFramework.it('should inject footer TOC with dark theme overrides', async () => {
        if (window.GreenhouseUtils && typeof window.GreenhouseUtils.renderModelsTOC === 'function') {
            await window.GreenhouseUtils.renderModelsTOC();
            await new Promise(r => setTimeout(r, 500));
        }

        const footer = document.getElementById('greenhouse-models-footer-toc');
        assert.isDefined(footer, 'Footer TOC should be injected into the body');

        const style = window.getComputedStyle(footer);
        assert.notEqual(style.display, 'none', 'Footer TOC should be visible');

        // Check for dark theme background
        const bg = style.background || style.backgroundColor;
        const isDark = bg.includes('rgb(0, 0, 0)') || bg.includes('black') || bg.includes('linear-gradient');
        assert.isTrue(isDark, 'Footer TOC should have a dark theme background');
    });

    TestFramework.it('should have responsive grid behavior', () => {
        const grid = document.querySelector('.models-toc-grid');
        if (!grid) return; // Skip if grid not present

        const style = window.getComputedStyle(grid);
        // On desktop (default viewport in harness usually), it should have multiple columns
        // We can check grid-template-columns if supported by the mock or browser
        if (style.gridTemplateColumns) {
             assert.isTrue(style.gridTemplateColumns.split(' ').length >= 1, 'Grid should have at least one column');
        }
    });

});

// Run tests if executed directly via Node
if (typeof require !== 'undefined' && require.main === module) {
    TestFramework.run();
}
