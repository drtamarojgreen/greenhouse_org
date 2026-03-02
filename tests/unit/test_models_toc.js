/**
 * Unit Tests for Models Table of Contents (TOC)
 */

const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

const createEnv = () => {
    const { runInNewContext } = require('vm');
    const path = require('path');
    const fs = require('fs');

    const mockContainer = {
        classList: {
            add: (cls) => { mockContainer.className = (mockContainer.className || '') + ' ' + cls; }
        },
        innerHTML: '',
        appendChild: (child) => {
            if (!mockContainer.children) mockContainer.children = [];
            mockContainer.children.push(child);
        },
        children: []
    };

    const mockWindow = {
        HTMLElement: class { },
        Node: class { },
        location: { hostname: 'localhost' },
        MutationObserver: class {
            constructor() { }
            observe() { }
            disconnect() { }
        },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Map: Map,
        Set: Set,
        console: console,
        fetch: async (url) => {
            if (url.includes('error')) return { ok: false, status: 404 };
            return {
                ok: true,
                text: async () => `<models><intro><paragraph>Intro Paragraph 1</paragraph></intro><model id="genetic"><title>Genetic Model</title><url>/genetic</url><description><paragraph>Genetic description</paragraph></description></model></models>`
            };
        },
        DOMParser: class {
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
        },
        document: {
            querySelector: (selector) => {
                if (selector === '#models-toc-container' || selector === '.target') return mockContainer;
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
                    children: [],
                    getAttribute: (attr) => element[attr],
                    setAttribute: (attr, val) => { element[attr] = val; },
                    getElementsByTagName: (tag) => []
                };
                return element;
            }
        }
    };

    const vm = require('vm');
    const context = vm.createContext(mockWindow);
    context.global = context;
    context.window = context;

    const filePath = path.join(__dirname, '../../docs/js/models_toc.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    return { context, mockContainer };
};

TestFramework.describe('Models Table of Contents (TOC)', () => {
    let env;

    TestFramework.beforeEach(() => {
        env = createEnv();
    });

    TestFramework.it('should initialize with a string selector', () => {
        env.context.window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });
        assert.isTrue(env.context.window.GreenhouseModelsTOC.state.isInitialized);
        assert.contains(env.mockContainer.className, 'models-toc-container');
    });

    TestFramework.it('should fetch data and render intro and cards', async () => {
        env.context.window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

        // Wait for async fetch
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.greaterThan(env.mockContainer.children.length, 0);

        const intro = env.mockContainer.children.find(c => c.className && c.className.includes('models-toc-intro'));
        assert.isDefined(intro, 'Intro should be rendered');

        const grid = env.mockContainer.children.find(c => c.className && c.className.includes('models-toc-grid'));
        assert.isDefined(grid, 'Grid should be rendered');
    });

    TestFramework.it('should handle fetch errors gracefully', async () => {
        env.context.window.GreenhouseModelsTOC.config.xmlPath = 'error.xml';
        env.context.window.GreenhouseModelsTOC.init({ target: '#models-toc-container' });

        await new Promise(resolve => setTimeout(resolve, 100));

        assert.contains(env.mockContainer.innerHTML, 'Error loading model descriptions');
    });
});

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    TestFramework.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}
