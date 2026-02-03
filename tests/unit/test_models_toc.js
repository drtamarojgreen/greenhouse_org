/**
 * Unit Tests for Models Table of Contents (TOC)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.HTMLElement = class { };
global.Node = class { };
global.MutationObserver = class {
    constructor(cb) { this.cb = cb; }
    observe() { }
    disconnect() { }
};
global.location = {
    hostname: 'localhost'
};

global.document = {
    querySelector: (selector) => {
        if (selector === '#models-toc-container' || selector === '.target') {
            return mockContainer;
        }
        return null;
    },
    createElement: (tag) => {
        const element = {
            tagName: tag.toUpperCase(),
            style: {},
            classList: {
                add: (cls) => { element.className = (element.className || '') + ' ' + cls; }
            },
            appendChild: (child) => {
                if (!element.children) element.children = [];
                element.children.push(child);
            },
            getAttribute: (attr) => element[attr],
            setAttribute: (attr, val) => { element[attr] = val; },
            getElementsByTagName: (tag) => {
                // Simplified mock for XML paragraphs
                if (element._xmlData && element._xmlData[tag]) {
                    return element._xmlData[tag];
                }
                return [];
            }
        };
        return element;
    }
};

const mockContainer = {
    classList: {
        add: (cls) => { mockContainer.className = (mockContainer.className || '') + ' ' + cls; }
    },
    innerHTML: '',
    appendChild: (child) => {
        if (!mockContainer.children) mockContainer.children = [];
        mockContainer.children.push(child);
    }
};

global.DOMParser = class {
    parseFromString(xmlText, type) {
        return {
            querySelector: (selector) => {
                if (selector === 'intro') {
                    return {
                        getElementsByTagName: (tag) => {
                            if (tag === 'paragraph') return [{ textContent: 'Intro Paragraph 1' }];
                            return [];
                        }
                    };
                }
                return null;
            },
            querySelectorAll: (selector) => {
                if (selector === 'model') {
                    return [
                        {
                            getAttribute: (attr) => 'genetic',
                            querySelector: (sel) => {
                                if (sel === 'title') return { textContent: 'Genetic Model' };
                                if (sel === 'url') return { textContent: '/genetic' };
                                if (sel === 'description') return {
                                    getElementsByTagName: (t) => [{ textContent: 'Genetic description' }]
                                };
                                return null;
                            }
                        }
                    ];
                }
                return [];
            }
        };
    }
};

global.fetch = async (url) => {
    if (url.includes('error')) {
        return { ok: false, status: 404 };
    }
    return {
        ok: true,
        text: async () => `<models><intro><paragraph>Intro Paragraph 1</paragraph></intro><model id="genetic"><title>Genetic Model</title><url>/genetic</url><description><paragraph>Genetic description</paragraph></description></model></models>`
    };
};

// global.console = {
//     log: () => { },
//     error: () => { },
//     warn: () => { }
// };

// --- Helper to Load Scripts ---
function loadScript(filename) {
    const filePath = path.join(__dirname, '../../docs/js', filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, { filename });
}

// --- Test Suites ---

TestFramework.describe('Models Table of Contents (TOC)', () => {

    TestFramework.beforeEach(() => {
        mockContainer.innerHTML = '';
        mockContainer.children = [];
        mockContainer.className = '';
        delete global.window.GreenhouseModelsUX;
        loadScript('models_toc.js');
    });

    TestFramework.it('should initialize with a string selector', () => {
        window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });
        assert.isTrue(window.GreenhouseModelsTOC.state.isInitialized);
        assert.contains(mockContainer.className, 'models-toc-container');
    });

    TestFramework.it('should initialize with an HTMLElement', () => {
        const customContainer = Object.create(global.HTMLElement.prototype);
        Object.assign(customContainer, {
            classList: { add: (cls) => customContainer.className = cls },
            innerHTML: '',
            appendChild: (child) => {
                if (!customContainer.children) customContainer.children = [];
                customContainer.children.push(child);
            }
        });
        window.GreenhouseModelsTOC.init({ target: customContainer });
        assert.isTrue(window.GreenhouseModelsTOC.state.isInitialized);
        assert.equal(customContainer.className, 'models-toc-container');
    });

    TestFramework.it('should fetch data and render intro and cards', async () => {
        window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

        // Wait for async fetch
        await new Promise(resolve => setTimeout(resolve, 50));

        assert.greaterThan(mockContainer.children.length, 0);

        const intro = mockContainer.children.find(c => c.className === 'models-toc-intro');
        assert.isDefined(intro, 'Intro should be rendered');

        const grid = mockContainer.children.find(c => c.className === 'models-toc-grid');
        assert.isDefined(grid, 'Grid should be rendered');
        assert.greaterThan(grid.children.length, 0, 'Grid should have model cards');

        const card = grid.children[0];
        assert.equal(card.className, 'model-toc-card');
    });

    TestFramework.it('should handle fetch errors gracefully', async () => {
        window.GreenhouseModelsTOC.config.xmlPath = 'error.xml';
        window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 50));

        assert.contains(mockContainer.innerHTML, 'err_loading_models');
    });

    TestFramework.it('should generate correct canonical URLs for production', async () => {
        global.location.hostname = 'greenhousemd.org';
        window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 50));

        const grid = mockContainer.children.find(c => c.className === 'models-toc-grid');
        const card = grid.children[0];
        const buttonGroup = card.children.find(c => c.className === 'button-group');
        const launchLink = buttonGroup.children[0];

        assert.equal(launchLink.href, 'https://greenhousemd.org/genetic');
    });

    TestFramework.it('should generate canonical URLs even for local development', async () => {
        global.location.hostname = 'localhost';
        window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 50));

        const grid = mockContainer.children.find(c => c.className === 'models-toc-grid');
        const card = grid.children[0];
        const buttonGroup = card.children.find(c => c.className === 'button-group');
        const launchLink = buttonGroup.children[0];

        assert.equal(launchLink.href, 'https://greenhousemd.org/genetic');
    });

});

// Run the tests
TestFramework.run();
