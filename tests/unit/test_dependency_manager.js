/**
 * @file test_dependency_manager.js
 * @description Unit tests for GreenhouseDependencyManager.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { assert } = require('../utils/assertion_library.js');
const TestFramework = require('../utils/test_framework.js');

// --- Mock Browser Environment ---
global.window = global;
global.CustomEvent = class {
    constructor(name, detail) { this.name = name; this.detail = detail; }
};
global.dispatchEvent = () => { };
global.console = {
    log: () => { },
    error: () => { },
    warn: () => { },
    debug: () => { }
};

// --- Load Script ---
const filePath = path.join(__dirname, '../../docs/js/GreenhouseDependencyManager.js');
const code = fs.readFileSync(filePath, 'utf8');
vm.runInThisContext(code);

TestFramework.describe('GreenhouseDependencyManager (Unit)', () => {

    const DM = global.window.GreenhouseDependencyManager;

    TestFramework.beforeEach(() => {
        DM.clear();
    });

    TestFramework.it('should register and retrieve a dependency', () => {
        const myDep = { key: 'value' };
        DM.register('testDep', myDep);

        assert.isTrue(DM.isAvailable('testDep'));
        assert.equal(DM.get('testDep'), myDep);
    });

    TestFramework.it('should return metadata for registered dependency', () => {
        DM.register('testMetadata', { a: 1 }, { version: '2.0.0' });
        const meta = DM.getMetadata('testMetadata');
        assert.equal(meta.version, '2.0.0');
        assert.isDefined(meta.registeredAt);
    });

    TestFramework.it('waitFor should resolve when dependency is registered', async () => {
        const promise = DM.waitFor('asyncDep');
        const val = { ok: true };

        // Register after a small delay
        setTimeout(() => DM.register('asyncDep', val), 50);

        const result = await promise;
        assert.equal(result, val);
    });

    TestFramework.it('waitFor should timeout if not registered', async () => {
        try {
            await DM.waitFor('neverExists', 100);
            assert.fail('Should have timed out');
        } catch (e) {
            assert.contains(e.message, 'not available within 100ms');
        }
    });

    TestFramework.it('waitForMultiple should resolve all requested deps', async () => {
        const p = DM.waitForMultiple(['d1', 'd2']);
        DM.register('d1', 1);
        DM.register('d2', 2);

        const results = await p;
        assert.equal(results.d1, 1);
        assert.equal(results.d2, 2);
    });

    TestFramework.it('unregister should remove dependency and reject pending waiters', async () => {
        const p = DM.waitFor('deadDep');
        DM.unregister('deadDep');

        try {
            await p;
            assert.fail('Waiter should have been rejected');
        } catch (e) {
            assert.contains(e.message, 'was unregistered');
        }
        assert.isFalse(DM.isAvailable('deadDep'));
    });

    TestFramework.it('getStatus should provide accurate statistics', () => {
        DM.register('s1', 1);
        DM.register('s2', 2);
        const status = DM.getStatus();
        assert.equal(status.available.length, 2);
        assert.equal(status.statistics.totalRegistered, 2);
    });

});

TestFramework.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
});
