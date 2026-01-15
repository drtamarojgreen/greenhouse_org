/**
 * Unit Tests for Pathway Page Loader
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.document = {
    currentScript: null,
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        onload: null,
        onerror: null,
        src: ''
    }),
    head: {
        appendChild: (script) => {
            // Simulate script loading
            setTimeout(() => {
                if (script.src.includes('error')) {
                    if (script.onerror) script.onerror();
                } else {
                    if (script.src.includes('pathway_viewer.js')) {
                        global.window.GreenhousePathwayViewer = { init: () => { } };
                    }
                    if (script.onload) script.onload();
                }
            }, 10);
        }
    }
};

global.window.GreenhouseUtils = {
    displayError: () => { }
};

// --- Helper to Load Script ---
function loadScript(filename, attributes = null) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');

    if (attributes) {
        global.window._greenhouseScriptAttributes = attributes;
    } else {
        delete global.window._greenhouseScriptAttributes;
    }

    vm.runInThisContext(code, { filename });
}

// --- Test Suite ---

TestFramework.describe('Pathway Page Loader', () => {

    TestFramework.beforeEach(() => {
        delete global.window.GreenhousePathwayViewer;
        delete global.window.GreenhousePathwayApp;
    });

    TestFramework.it('should initialize and load dependencies', async () => {
        loadScript('pathway.js', {
            'target-selector-left': '.pathway-container',
            'base-url': '/'
        });

        // The pathway.js uses window.GreenhousePathwayApp.init internally
        assert.isDefined(global.window.GreenhousePathwayApp);

        // Wait for all scripts to load via the internal loadScript method
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if the viewer was initialized (mocked in head.appendChild)
        assert.isDefined(global.window.GreenhousePathwayViewer);
    });

    TestFramework.it('should handle missing attributes with a retry', async () => {
        loadScript('pathway.js'); // No attributes passed

        // At this point it should have scheduled a retry
        await new Promise(resolve => setTimeout(resolve, 50));

        // Still not initialized
        assert.isUndefined(global.window.GreenhousePathwayViewer);

        // Now set attributes
        global.window._greenhouseScriptAttributes = {
            'target-selector-left': '.pathway-container',
            'base-url': '/'
        };

        // Wait for retry (100ms in code)
        await new Promise(resolve => setTimeout(resolve, 150));

        assert.isDefined(global.window.GreenhousePathwayViewer);
    });

});

TestFramework.run();
