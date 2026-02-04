const { assert } = require('../utils/assertion_library.js');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

describe('Genetic Geometry Regression Tests', () => {
    let context;

    before(() => {
        const geometryCode = fs.readFileSync(path.join(__dirname, '../../docs/js/genetic_ui_3d_geometry.js'), 'utf8');
        context = { window: {}, Math, console };
        vm.createContext(context);
        vm.runInNewContext(geometryCode, context);
    });

    it('should generate valid helix points with major/minor grooves', () => {
        const { GreenhouseGeneticGeometry } = context.window;
        const p1 = GreenhouseGeneticGeometry.generateHelixPoints(0, 10, 0); // Strand 0
        const p2 = GreenhouseGeneticGeometry.generateHelixPoints(1, 10, 0); // Strand 1

        assert.equal(p1.strandIndex, 0);
        assert.equal(p2.strandIndex, 1);

        // Verify they are at different angles (not exactly 180 degrees/PI offset)
        const angle1 = Math.atan2(p1.z, p1.x);
        const angle2 = Math.atan2(p2.z, p2.x);
        let diff = Math.abs(angle2 - angle1);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        // Offset was set to 2.2 in code. 2.2 rad is ~126 degrees.
        assert.isTrue(Math.abs(diff - 2.2) < 0.1, 'Double helix should have major/minor groove offset');
    });

    it('should generate protein chain with motifs', () => {
        const { GreenhouseGeneticGeometry } = context.window;
        const protein = GreenhouseGeneticGeometry.generateProteinChain('TEST_SEED');

        assert.isTrue(protein.vertices.length > 0, 'Protein should have vertices');

        const types = new Set(protein.vertices.map(v => v.type));
        assert.isTrue(types.size > 0, 'Protein should have different structural types');

        // Check centering
        const avg = protein.vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }), { x: 0, y: 0, z: 0 });
        assert.isTrue(Math.abs(avg.x / protein.vertices.length) < 1, 'Protein should be centered on X');
        assert.isTrue(Math.abs(avg.y / protein.vertices.length) < 1, 'Protein should be centered on Y');
        assert.isTrue(Math.abs(avg.z / protein.vertices.length) < 1, 'Protein should be centered on Z');
    });

    it('should generate chromosome mesh with t_arm and arm attributes', () => {
        const { GreenhouseGeneticGeometry } = context.window;
        const mesh = GreenhouseGeneticGeometry.generateChromosomeMesh();

        assert.isTrue(mesh.vertices.length > 0, 'Chromosome should have vertices');
        assert.isTrue(mesh.faces.length > 0, 'Chromosome should have faces');

        const v = mesh.vertices[0];
        assert.isTrue(v.hasOwnProperty('t_arm'), 'Vertex should have t_arm attribute');
        assert.isTrue(v.hasOwnProperty('arm'), 'Vertex should have arm attribute');

        const arms = new Set(mesh.vertices.map(v => v.arm));
        assert.equal(arms.size, 2, 'Chromosome should have 2 arms');

        const tArms = mesh.vertices.map(v => v.t_arm);
        assert.isTrue(Math.min(...tArms) >= 0 && Math.max(...tArms) <= 1, 't_arm should be in range [0, 1]');
    });
});
