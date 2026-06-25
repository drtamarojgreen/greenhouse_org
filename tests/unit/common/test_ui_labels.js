"use strict";
// tests/unit/common/test_ui_labels.js
const assert = require('assert');
TestFramework.describe('UI Region Labels Rendering', () => {
    let mockCtx;
    let fillTextCalls = [];
    let fillRectCalls = [];
    TestFramework.beforeEach(() => {
        fillTextCalls = [];
        fillRectCalls = [];
        mockCtx = {
            canvas: { width: 800, height: 600 },
            font: '',
            fillStyle: '',
            textAlign: '',
            textBaseline: '',
            measureText: (text) => ({ width: text.length * 10 }),
            fillText: (text, x, y) => {
                fillTextCalls.push({ text, x, y });
            },
            fillRect: (x, y, w, h) => {
                fillRectCalls.push({ x, y, w, h });
            },
            beginPath: () => { },
            roundRect: () => { },
            fill: () => { },
            stroke: () => { },
            save: () => { },
            restore: () => { },
            moveTo: () => { },
            lineTo: () => { },
            closePath: () => { },
            clip: () => { },
            rect: () => { }
        };
    });
    TestFramework.it('GreenhouseGeneticStats.drawLabels should draw labels for provided neurons', () => {
        if (!global.window.GreenhouseGeneticStats) {
            console.log('Skipping GreenhouseGeneticStats.drawLabels test: module not loaded');
            return;
        }
        const neurons = [
            { type: 'neuron', region: 'pfc', x: 100, y: 100, scale: 1 },
            { type: 'neuron', region: 'pfc', x: 110, y: 110, scale: 1 },
            { type: 'neuron', region: 'amygdala', x: 300, y: 300, scale: 1 }
        ];
        global.window.GreenhouseGeneticStats.drawLabels(mockCtx, neurons);
        const labels = fillTextCalls.map(c => c.text);
        assert.ok(labels.some(l => l.toLowerCase().includes('pfc')), 'Should contain PFC label');
        assert.ok(labels.some(l => l.toLowerCase().includes('amygdala')), 'Should contain Amygdala label');
        // Also checks for Genotype/Phenotype labels
        assert.ok(labels.some(l => l.includes('Genotype')), 'Should contain Genotype label');
        assert.ok(labels.some(l => l.includes('Phenotype')), 'Should contain Phenotype label');
    });
    TestFramework.it('GreenhouseNeuroStats.drawLabels should draw labels for provided neurons', () => {
        if (!global.window.GreenhouseNeuroStats) {
            console.log('Skipping GreenhouseNeuroStats.drawLabels test: module not loaded');
            return;
        }
        const neurons = [
            { region: 'pfc', x: 100, y: 100, scale: 1 },
            { region: 'pfc', x: 110, y: 110, scale: 1 },
            { region: 'occipitalLobe', x: 500, y: 500, scale: 1 }
        ];
        global.window.GreenhouseNeuroStats.drawLabels(mockCtx, neurons);
        const labels = fillTextCalls.map(c => c.text);
        assert.ok(labels.some(l => l.toLowerCase().includes('pfc')), 'Should contain PFC label');
        assert.ok(labels.some(l => l.toLowerCase().includes('occipital')), 'Should contain Occipital label');
    });
});
