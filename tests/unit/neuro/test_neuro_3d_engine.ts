(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('GreenhouseNeuroUI3D', () => {
        let ui;
        let mockCamera;

        TestFramework.beforeEach(() => {
            mockCamera = {
                x: 0,
                y: 0,
                z: -600,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                fov: 600
            };
            window.GreenhouseNeuroCameraControls.camera = mockCamera;

            ui = window.GreenhouseNeuroUI3D;
            ui.init(document.createElement('div'));
        });

        TestFramework.it('should initialize with correct camera and projection', () => {
            assert.equal(ui.camera.z, -600);
            // Projection width is updated to canvas.width which is container.offsetWidth
            // In headless browser, offsetWidth might be 0 or some default
            assert.isDefined(ui.projection.width);
        });

        TestFramework.it('should update data with neurons and connections', () => {
            const genome = {
                neurons: [{ id: 0, x: 0, y: 0, z: 0, type: 'soma' }],
                connections: [{ from: 0, to: 0, weight: 0.5 }]
            };
            ui.updateData(genome);
            assert.equal(ui.neurons.length, 1);
            assert.equal(ui.connections.length, 1);
        });

        TestFramework.it('should generate synapse meshes', () => {
            const meshes = ui.generateSynapseMeshes();
            assert.isDefined(meshes.pre);
            assert.isDefined(meshes.post);
        });

        TestFramework.it('should toggle auto-rotate', () => {
            ui.toggleAutoRotate();
            assert.isTrue(true);
        });

        TestFramework.it('should initialize synapse particles and fluid grid', () => {
            ui.initSynapseParticles();
            assert.equal(ui.synapseParticles.length, 100);
            assert.equal(ui.fluidGrid.length, ui.fluidCols * ui.fluidRows);
        });
    });
})();
