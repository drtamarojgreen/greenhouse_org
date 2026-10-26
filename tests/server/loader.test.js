'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { clientConfig, SELECTORS, SIMULATIONS } = require('../../server/site');

const LOADER_SOURCE = fs.readFileSync(path.join(__dirname, '../../docs/js/greenhouse.js'), 'utf8');

async function runLoader(pathname) {
    const loaded = [];
    let readyListener = null;
    const presentSelectors = new Set(Object.values(SELECTORS));

    const GreenhouseUtils = {
        appState: { baseUrl: null },
        isMobileUser: () => false,
        waitForElement: async selectors => {
            const list = Array.isArray(selectors) ? selectors : [selectors];
            if (!list.some(s => presentSelectors.has(s))) throw new Error('not found');
            return {};
        },
        loadScript: async (name, baseUrl, attributes = {}) => {
            loaded.push({ name, baseUrl, attributes });
        }
    };

    const context = {
        window: null,
        document: {
            readyState: 'loading',
            addEventListener: (event, fn) => { if (event === 'DOMContentLoaded') readyListener = fn; },
            querySelector: selector => (presentSelectors.has(selector) ? {} : null)
        },
        URLSearchParams,
        setInterval,
        clearInterval,
        setTimeout,
        console: { log() {}, warn() {}, error() {} }
    };
    context.window = {
        GreenhouseUtils,
        GreenhouseSiteConfig: clientConfig(),
        location: { pathname, search: '' }
    };

    vm.runInNewContext(LOADER_SOURCE, context);
    assert.ok(readyListener, 'loader registers a DOMContentLoaded listener');
    await readyListener();
    await new Promise(resolve => setTimeout(resolve, 250));
    return { loaded, GreenhouseUtils };
}

test('standalone loader uses the local base URL', async () => {
    const { loaded, GreenhouseUtils } = await runLoader('/');
    assert.equal(GreenhouseUtils.appState.baseUrl, '/');
    assert.deepEqual(loaded.map(s => s.name), ['effects.js']);
    assert.equal(loaded[0].baseUrl, '/');
});

const EXPECTED = [
    ['/books', 'books.js', SELECTORS.books],
    ['/news', 'news.js', SELECTORS.news],
    ['/quizzes', 'quizzes.js', SELECTORS.quizzes],
    ['/models', 'models.js', SELECTORS.models],
    ['/tech', 'tech.js', SELECTORS.tech],
    ['/dna', 'dna_repair.js', SELECTORS.dna],
    ['/rna', 'rna_repair.js', SELECTORS.rna],
    ...SIMULATIONS
        .filter(sim => !['dna', 'rna'].includes(sim.key))
        .map(sim => [sim.path, `${sim.key}.js`, SELECTORS[sim.key]])
];

for (const [route, script, selector] of EXPECTED) {
    test(`standalone loader mounts ${script} on ${route}`, async () => {
        const { loaded } = await runLoader(route);
        const app = loaded.find(s => s.name === script);
        assert.ok(app, `${script} should be loaded; got ${loaded.map(s => s.name).join(', ')}`);
        assert.equal(app.baseUrl, '/');
        assert.equal(app.attributes['base-url'], '/');
        assert.equal(app.attributes['target-selector-left'], selector);
    });
}

test('standalone loader wires the scheduler to the local containers', async () => {
    const { loaded } = await runLoader('/schedule');
    const names = loaded.map(s => s.name);
    assert.ok(names.includes('schedulerUI.js'));
    const scheduler = loaded.find(s => s.name === 'scheduler.js');
    assert.ok(scheduler);
    const selectors = JSON.parse(scheduler.attributes['data-scheduler-selectors']);
    assert.deepEqual(selectors, {
        dashboardLeft: SELECTORS.dashboardLeft,
        dashboardRight: SELECTORS.dashboardRight,
        repeaterLeft: SELECTORS.repeaterLeft,
        repeaterRight: SELECTORS.repeaterRight
    });
});

test('standalone loader passes genetic selectors', async () => {
    const { loaded } = await runLoader('/genetic');
    const genetic = loaded.find(s => s.name === 'genetic.js');
    const selectors = JSON.parse(genetic.attributes['data-genetic-selectors']);
    assert.equal(selectors.genetic, SELECTORS.genetic);
    assert.equal(selectors.geneticTitle, SELECTORS.geneticTitle);
    assert.equal(selectors.geneticParagraph, SELECTORS.geneticParagraph);
});

test('content-only pages do not load an application', async () => {
    for (const route of ['/videos', '/inspiration']) {
        const { loaded } = await runLoader(route);
        assert.deepEqual(loaded.map(s => s.name), ['effects.js'], route);
    }
});
