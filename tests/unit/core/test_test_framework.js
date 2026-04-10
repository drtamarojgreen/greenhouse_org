(function() {
    const { assert } = window;
    const Runner = window.TestFramework;
    const TestFrameworkClass = window.TestFrameworkClass;

    Runner.describe('Test Framework Core', () => {

        let tf;

        Runner.beforeEach(() => {
            // Create a fresh instance for each test
            tf = new TestFrameworkClass();
        });

        Runner.it('should create a test suite with describe', () => {
            tf.describe('My Suite', () => { });
            assert.equal(tf.suites.length, 1);
            assert.equal(tf.suites[0].name, 'My Suite');
        });

        Runner.it('should create a test case with it', () => {
            tf.describe('My Suite', () => {
                tf.it('My Test', () => { });
            });
            const suite = tf.suites[0];
            assert.equal(suite.tests.length, 1);
            assert.equal(suite.tests[0].name, 'My Test');
        });

        Runner.it('should run a simple passing test', async () => {
            tf.describe('Passing Suite', () => {
                tf.it('should pass', () => {
                    assert.isTrue(true);
                });
            });
            const results = await tf.run();
            assert.equal(results.passed, 1);
            assert.equal(results.failed, 0);
        });

        Runner.it('should run a simple failing test', async () => {
            tf.describe('Failing Suite', () => {
                tf.it('should fail', () => {
                    throw new Error('fail');
                });
            });
            const results = await tf.run();
            assert.equal(results.passed, 0);
            assert.equal(results.failed, 1);
        });

        Runner.it('should handle skipped tests with xit', async () => {
            tf.describe('Skipped Suite', () => {
                tf.xit('should be skipped', () => {
                    throw new Error('fail');
                });
            });
            const results = await tf.run();
            assert.equal(results.skipped, 1);
            assert.equal(results.total, 0);
        });

        Runner.it('should run only specified tests with fit', async () => {
            tf.describe('Only Suite', () => {
                tf.it('should be skipped', () => {
                    throw new Error('fail');
                });
                tf.fit('should run', () => {
                    assert.isTrue(true);
                });
            });
            const results = await tf.run();
            assert.equal(results.passed, 1);
            assert.equal(results.failed, 0);
            assert.equal(results.total, 1);
        });

        Runner.it('should run beforeEach and afterEach hooks', async () => {
            let count = 0;
            tf.describe('Hooks Suite', () => {
                tf.beforeEach(() => {
                    count++;
                });
                tf.afterEach(() => {
                    count++;
                });
                tf.it('test 1', () => {
                    assert.equal(count, 1);
                });
                tf.it('test 2', () => {
                    assert.equal(count, 3);
                });
            });
            await tf.run();
            assert.equal(count, 4);
        });

        Runner.it('should run beforeAll and afterAll hooks', async () => {
            let count = 0;
            tf.describe('All Hooks Suite', () => {
                tf.beforeAll(() => {
                    count = 1;
                });
                tf.afterAll(() => {
                    count = 0;
                });
                tf.it('test 1', () => {
                    assert.equal(count, 1);
                });
                tf.it('test 2', () => {
                    assert.equal(count, 1);
                });
            });
            await tf.run();
            assert.equal(count, 0);
        });

        Runner.it('should handle async tests', async () => {
            tf.describe('Async Suite', () => {
                tf.it('should handle async operations', async () => {
                    const result = await new Promise(resolve => setTimeout(() => resolve(true), 50));
                    assert.isTrue(result);
                });
            });
            const results = await tf.run();
            assert.equal(results.passed, 1);
        });

        Runner.it('should handle test timeouts', async () => {
            tf.describe('Timeout Suite', () => {
                tf.it('should timeout', async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }, { timeout: 50 });
            });
            const results = await tf.run();
            assert.equal(results.failed, 1);
            const test = tf.suites[0].tests[0];
            assert.contains(test.error.message, 'timeout');
        });

    });
})();
