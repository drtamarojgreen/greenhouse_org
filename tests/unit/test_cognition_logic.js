
const fs = require('fs');
const path = require('path');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// Mock browser environment
global.window = global;
global.addEventListener = () => {};
global.document = {
    createElement: (tag) => {
        return {
            style: {},
            setAttribute: () => {},
            appendChild: () => {},
            prepend: () => {},
            getContext: () => ({
                clearRect: () => {},
                beginPath: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                fillText: () => {},
                createRadialGradient: () => ({ addColorStop: () => {} }),
                fillRect: () => {},
                strokeRect: () => {},
                save: () => {},
                restore: () => {},
                translate: () => {},
                rotate: () => {},
                scale: () => {},
                moveTo: () => {},
                lineTo: () => {},
                bezierCurveTo: () => {},
                quadraticCurveTo: () => {},
                ellipse: () => {},
                measureText: () => ({ width: 10 }),
                setLineDash: () => {},
                rect: () => {},
                closePath: () => {}
            }),
            width: 800,
            height: 600,
            offsetWidth: 800,
            offsetHeight: 600,
            addEventListener: () => {},
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
            dataset: {},
            value: tag === 'select' ? 'All' : '', // Handle default category
            options: [],
            appendChild: () => {},
            prepend: () => {}
        };
    },
    querySelector: () => ({
        appendChild: () => {},
        prepend: () => {},
        style: {},
        setAttribute: () => {},
        offsetWidth: 800,
        innerHTML: '',
        value: ''
    }),
    getElementById: () => ({ value: '', textContent: '' }),
    addEventListener: () => {}
};
global.navigator = { userAgent: 'node' };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// Mock GreenhouseModelsUtil
global.GreenhouseModelsUtil = {
    t: (k) => k || '',
    toggleLanguage: () => {}
};

// Load Cognition files
const cognitionAppPath = path.join(__dirname, '../../docs/js/cognition_app.js');
const cognitionConfigPath = path.join(__dirname, '../../docs/js/cognition_config.js');
const cognitionDrawingUtilsPath = path.join(__dirname, '../../docs/js/cognition_drawing_utils.js');

const cognitionAppCode = fs.readFileSync(cognitionAppPath, 'utf8');
const cognitionConfigCode = fs.readFileSync(cognitionConfigPath, 'utf8');
const cognitionDrawingUtilsCode = fs.readFileSync(cognitionDrawingUtilsPath, 'utf8');

eval(cognitionConfigCode);
eval(cognitionDrawingUtilsCode);
eval(cognitionAppCode);

TestFramework.describe('Cognition App Logic', () => {
    TestFramework.it('should initialize with default category "All"', () => {
        const app = window.GreenhouseCognitionApp;
        app.init('#container');
        assert.equal(app.activeCategory, 'All');
    });

    TestFramework.it('should have isRunning set to true after init', () => {
        const app = window.GreenhouseCognitionApp;
        app.init('#container');
        assert.isTrue(app.isRunning);
        app.isRunning = false; // Stop loop
    });

    TestFramework.it('should have background particles initialized', () => {
        const app = window.GreenhouseCognitionApp;
        app.init('#container');
        assert.greaterThan(app.backgroundParticles.length, 0);
        app.isRunning = false;
    });
});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
