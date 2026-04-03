const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="model-container"></div></body></html>', {
        runScripts: "dangerously",
        resources: "usable",
        url: "http://127.0.0.1:8000/"
    });

    const { window } = dom;
    global.window = window;
    global.document = window.document;
    global.navigator = window.navigator;
    global.HTMLElement = window.HTMLElement;
    global.Node = window.Node;

    // Load framework and assertion library
    require('./docs/js/test_framework.js');
    require('./docs/js/assertion_library.js');

    // Setup Mock for dependencies
    window.GreenhouseModelsUtil = { t: (k) => k };
    window.GreenhouseModels3DMath = {
        project3DTo2D: () => ({ x: 0, y: 0, depth: 0, scale: 1 }),
        calculateFaceNormal: () => ({ x: 0, y: 0, z: 1 }),
        applyDepthFog: (a) => a
    };
    window.GreenhouseGeneticLighting = {
        calculateLighting: () => ({ r: 255, g: 255, b: 255 }),
        toRGBA: (c) => `rgba(${c.r},${c.g},${c.b},1)`
    };
    window.GreenhouseGeneticConfig = { get: () => ({}) };
    window.GreenhouseGeneticUI3D = {
        neurons3D: [],
        updateData: function() { this.neurons3D = [{ type: 'gene', label: 'BDNF' }]; }
    };
    window.GreenhouseGeneticStats = {
        drawOverlayInfo: () => {}
    };

    // Run the test
    try {
        console.log(`Running: ${filePath}`);
        eval(content);
        const results = await window.TestFramework.run();
        console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
        if (results.failed > 0) {
            results.suites.forEach(s => {
                if (s.failed > 0) {
                    console.error(`Suite failed: ${s.name}`);
                }
            });
            process.exit(1);
        }
    } catch (e) {
        console.error(`Error running ${filePath}:`, e);
        process.exit(1);
    }
}

const testFile = process.argv[2];
if (testFile) {
    runTestFile(testFile);
}
