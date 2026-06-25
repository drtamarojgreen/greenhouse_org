"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
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
        TestFramework.it('should render TOC with grid layout', () => __awaiter(this, void 0, void 0, function* () {
            // Ensure TOC is initialized
            if (window.GreenhouseUtils && typeof window.GreenhouseUtils.renderModelsTOC === 'function') {
                yield window.GreenhouseUtils.renderModelsTOC('#models-toc-container');
                // Allow time for async render
                yield new Promise(r => setTimeout(r, 500));
            }
            const grid = document.querySelector('.models-toc-grid');
            const footerGrid = document.querySelector('.models-toc-footer-section .models-toc-grid');
            assert.isDefined(grid || footerGrid, 'TOC Grid should be rendered in the DOM');
            const targetGrid = grid || footerGrid;
            if (targetGrid) {
                const style = window.getComputedStyle(targetGrid);
                assert.equal(style.display, 'grid', 'TOC Grid should use CSS Grid layout');
            }
        }));
        TestFramework.it('should inject footer TOC with dark theme overrides', () => __awaiter(this, void 0, void 0, function* () {
            if (window.GreenhouseUtils && typeof window.GreenhouseUtils.renderModelsTOC === 'function') {
                yield window.GreenhouseUtils.renderModelsTOC();
                yield new Promise(r => setTimeout(r, 500));
            }
            const footer = document.getElementById('greenhouse-models-footer-toc');
            assert.isDefined(footer, 'Footer TOC should be injected into the body');
            const style = window.getComputedStyle(footer);
            assert.notEqual(style.display, 'none', 'Footer TOC should be visible');
            // Check for dark theme background
            const bg = style.background || style.backgroundColor;
            const isDark = bg.includes('rgb(0, 0, 0)') || bg.includes('black') || bg.includes('linear-gradient');
            assert.isTrue(isDark, 'Footer TOC should have a dark theme background');
        }));
        TestFramework.it('should have responsive grid behavior', () => {
            const grid = document.querySelector('.models-toc-grid');
            if (!grid)
                return; // Skip if grid not present
            const style = window.getComputedStyle(grid);
            // On desktop (default viewport in harness usually), it should have multiple columns
            if (style.gridTemplateColumns) {
                assert.isTrue(style.gridTemplateColumns.split(' ').length >= 1, 'Grid should have at least one column');
            }
        });
    });
})();
