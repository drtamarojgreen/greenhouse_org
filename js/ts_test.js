"use strict";
/**
 * @file ts_test.ts
 * @description A simple TypeScript file to verify TS integration with the Greenhouse environment.
 */
const GreenhouseTSTest = {
    init: function () {
        console.log('TS Test: Initializing.');
        const msg = 'typescript successful';
        if (window.GreenhouseUtils && typeof window.GreenhouseUtils.displaySuccess === 'function') {
            window.GreenhouseUtils.displaySuccess(msg, 30000); // 30s duration for visibility
        }
        // Always append a persistent element for robust verification
        const container = document.getElementById('tech-dashboard-section') || document.body;
        if (container) {
            const el = document.createElement('div');
            el.id = 'ts-success-indicator';
            el.textContent = msg;
            el.style.padding = '15px';
            el.style.margin = '10px';
            el.style.backgroundColor = '#d4edda';
            el.style.color = '#155724';
            el.style.border = '2px solid #c3e6cb';
            el.style.borderRadius = '5px';
            el.style.fontWeight = 'bold';
            el.style.textAlign = 'center';
            el.style.fontSize = '20px';
            el.style.zIndex = '10000';
            el.style.position = 'relative';
            // Insert at the top of the container
            if (container.firstChild) {
                container.insertBefore(el, container.firstChild);
            }
            else {
                container.appendChild(el);
            }
        }
    }
};
window.GreenhouseTSTest = GreenhouseTSTest;
GreenhouseTSTest.init();
