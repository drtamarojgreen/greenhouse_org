(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('RNA Repair Model (Unit)', () => {

        TestFramework.it('should initialize and draw without error', () => {
            const canvas = document.createElement('canvas');
            const simulation = new window.Greenhouse.RNARepairSimulation(canvas);

            simulation.proteins.push({ startIndex: 0, length: 5, life: 1 });
            simulation.enzymes.push({ name: 'Ligase', targetIndex: 0, x: 0, y: 0, size: 40, state: 'repairing', progress: 0.5 });

            simulation.draw();
            assert.isTrue(true);
        });

    });
})();
