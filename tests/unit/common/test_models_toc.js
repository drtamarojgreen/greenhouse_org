/**
 * Unit Tests for Models Table of Contents (TOC)
 */

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined' && window.location;

const fs = !isBrowser ? require('fs') : null;
const path = !isBrowser ? require('path') : null;
const vm = !isBrowser ? require('vm') : null;
const { assert } = !isBrowser ? require('../../utils/assertion_library.js') : { assert: window.assert };
const TestFramework = !isBrowser ? require('../../utils/test_framework.js') : window.TestFramework;

let mockContainer;

// --- Mock Browser Environment ---
if (!isBrowser) {
    global.window = global;
    global.HTMLElement = class { };
    global.Node = class { };
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
                },
                querySelector: (sel) => {
                    if (!element.children) return null;
                    if (sel.startsWith('.')) {
                        return element.children.find(c => c.className && c.className.includes(sel.substring(1)));
                    }
                    return element.children.find(c => c.tagName === sel.toUpperCase());
                }
            };
            return element;
        }
    };

    mockContainer = {
        classList: {
            add: (cls) => { mockContainer.className = (mockContainer.className || '') + ' ' + cls; }
        },
        innerHTML: '',
        appendChild: (child) => {
            if (!mockContainer.children) mockContainer.children = [];
            mockContainer.children.push(child);
        },
        querySelector: (sel) => {
            if (!mockContainer.children) return null;
            if (sel.startsWith('.')) {
                return mockContainer.children.find(c => c.className && c.className.includes(sel.substring(1)));
            }
            return mockContainer.children.find(c => c.tagName === sel.toUpperCase());
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

    global.MutationObserver = class {
        constructor(callback) { this.callback = callback; }
        observe() { }
        disconnect() { }
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

    // --- Helper to Load Scripts ---
    function loadScript(filename) {
        if (isBrowser) {
            if (filename.includes('models_toc.js') && window.GreenhouseModelsTOC) return;
        }
        if (!isBrowser) {
            const filePath = path.join(__dirname, '../../../docs/js', filename);
            const code = fs.readFileSync(filePath, 'utf8');
            vm.runInThisContext(code, { filename });
        }
    }
} else {
    mockContainer = document.createElement('div');
}

// --- Test Suites ---

TestFramework.describe('Models Table of Contents (TOC)', () => {

    TestFramework.beforeEach(() => {
        mockContainer.innerHTML = '';
        if (!isBrowser) {
            mockContainer.children = [];
            mockContainer.className = '';
        }
        if (!isBrowser) {
            delete global.window.GreenhouseModelsUX;
        }
        if (isBrowser) {
           // We assume GreenhouseModelsTOC is already loaded in browser harness
        } else {
            loadScript('models_toc.js');
        }
    });

    TestFramework.it('should initialize with a string selector', () => {
        const TOC = isBrowser ? window.GreenhouseModelsTOC : global.window.GreenhouseModelsTOC;
        TOC.init({ target: isBrowser ? mockContainer : '#models-toc-container' });
        assert.isTrue(TOC.state.isInitialized);
        if (!isBrowser) {
            assert.contains(mockContainer.className, 'models-toc-container');
        }
    });

    TestFramework.it('should initialize with an HTMLElement', () => {
        const TOC = isBrowser ? window.GreenhouseModelsTOC : global.window.GreenhouseModelsTOC;
        const customContainer = isBrowser ? document.createElement('div') : Object.create(global.HTMLElement.prototype);
        if (!isBrowser) {
            Object.assign(customContainer, {
                classList: { add: (cls) => customContainer.className = cls },
                innerHTML: '',
                appendChild: (child) => {
                    if (!customContainer.children) customContainer.children = [];
                    customContainer.children.push(child);
                }
            });
        }
        TOC.init({ target: customContainer });
        assert.isTrue(TOC.state.isInitialized);
        if (!isBrowser) {
            assert.equal(customContainer.className, 'models-toc-container');
        }
    });

    TestFramework.it('should fetch data and render intro and cards', async () => {
        const TOC = isBrowser ? window.GreenhouseModelsTOC : global.window.GreenhouseModelsTOC;
        TOC.init({ target: isBrowser ? mockContainer : '#models-toc-container' });

        // Wait for async fetch
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!isBrowser) {
            assert.greaterThan(mockContainer.children.length, 0);

            const intro = mockContainer.children.find(c => c.className === 'models-toc-intro');
            assert.isDefined(intro, 'Intro should be rendered');

            const grid = mockContainer.children.find(c => c.className === 'models-toc-grid');
            assert.isDefined(grid, 'Grid should be rendered');
            assert.greaterThan(grid.children.length, 0, 'Grid should have model cards');

            const card = grid.children[0];
            assert.equal(card.className, 'model-toc-card');
        } else {
            assert.isTrue(true); // Sanity check in browser
        }
    });

    TestFramework.it('should handle fetch errors gracefully', async () => {
        const TOC = isBrowser ? window.GreenhouseModelsTOC : global.window.GreenhouseModelsTOC;
        if (isBrowser) return; // Skip fetch error test in browser harness

        TOC.config.xmlPath = 'error.xml';
        TOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 50));

        assert.contains(mockContainer.innerHTML, 'err_loading_models');
    });

    TestFramework.it('should generate correct canonical URLs for production', async () => {
        const TOC = isBrowser ? window.GreenhouseModelsTOC : global.window.GreenhouseModelsTOC;
        if (isBrowser) {
            const testDiv = document.createElement('div');
            TOC.init({ target: testDiv });
            await new Promise(resolve => setTimeout(resolve, 50));
            const link = testDiv.querySelector('a');
            if (link) assert.isTrue(link.href.startsWith('https://'));
            return;
        }
        global.location.hostname = 'greenhousemhd.org';
        TOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 50));

        const grid = mockContainer.children.find(c => c.className === 'models-toc-grid');
        const card = grid.children[0];
        const buttonGroup = card.children.find(c => c.className === 'button-group');
        const launchLink = buttonGroup.children[0];

        assert.equal(launchLink.href, 'https://greenhousemd.org/genetic');
    });

    TestFramework.it('should generate canonical URLs even for local development', async () => {
        const TOC = isBrowser ? window.GreenhouseModelsTOC : global.window.GreenhouseModelsTOC;
        if (isBrowser) return;
        global.location.hostname = 'localhost';
        TOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 50));

        const grid = mockContainer.children.find(c => c.className === 'models-toc-grid');
        const card = grid.children[0];
        const buttonGroup = card.children.find(c => c.className === 'button-group');
        const launchLink = buttonGroup.children[0];

        assert.equal(launchLink.href, 'https://greenhousemd.org/genetic');
    });

});

// Run the tests
if (!isBrowser) {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
