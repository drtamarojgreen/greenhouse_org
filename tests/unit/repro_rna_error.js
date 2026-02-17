/**
 * Reproduction test for RNA Repair App ReferenceError
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    querySelector: () => null,
    getElementById: () => null,
    createElement: (tag) => ({
        tag,
        style: {},
        getContext: () => ({
            save: () => { },
            restore: () => { },
            translate: () => { },
            scale: () => { },
            beginPath: () => { },
            moveTo: () => { },
            lineTo: () => { },
            stroke: () => { },
            fill: () => { },
            rect: () => { },
            arc: () => { },
            ellipse: () => { },
            closePath: () => { },
            fillText: () => { },
            clearRect: () => { },
            fillRect: () => { },
            setLineDash: () => { },
            shadowBlur: 0,
            shadowColor: '',
            globalAlpha: 1,
            font: '',
            textAlign: '',
            textBaseline: '',
            strokeStyle: '',
            fillStyle: '',
            lineWidth: 1,
            lineCap: ''
        }),
        width: 800,
        height: 600,
        addEventListener: () => { },
        appendChild: () => { },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        dataset: {}
    }),
    body: { appendChild: () => { } },
    head: { appendChild: () => { } }
};
global.addEventListener = () => { };
global.console = {
    log: () => {},
    error: console.error,
    warn: console.warn
};
global.requestAnimationFrame = () => { };
global.setTimeout = () => { };
global.setInterval = () => { };
global.clearInterval = () => { };

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/rna_repair.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

// --- Reproduction ---
try {
    console.log("Starting reproduction...");
    const canvas = document.createElement('canvas');
    // Prevent auto-running stuff if possible, but we need to instantiate
    const simulation = new window.Greenhouse.RNARepairSimulation(canvas);

    // Add some data to ensure branches in draw() are covered
    simulation.proteins.push({ startIndex: 0, length: 5, life: 1 });
    simulation.enzymes.push({ name: 'Ligase', targetIndex: 0, x: 0, y: 0, size: 40, state: 'repairing', progress: 0.5 });

    console.log("Calling simulation.draw()...");
    simulation.draw();
    console.log("Success: simulation.draw() completed without error.");
    process.exit(0);
} catch (error) {
    console.error("Caught expected error:", error);
    if (error instanceof ReferenceError && error.message.includes("'t' before initialization")) {
        console.log("Reproduction successful!");
        process.exit(0); // Exit 0 because we reproduced it successfully
    } else {
        console.error("Caught unexpected error:", error);
        process.exit(1);
    }
}
