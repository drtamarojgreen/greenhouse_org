// docs/js/validate_brain_mesh.js
// Manual validation script for GreenhouseBrainMeshRealistic

const fs = require('fs');
const path = require('path');

// Mock window and GreenhouseBrainMeshRealistic
const window = {};
const scriptContent = fs.readFileSync(path.join(__dirname, 'brain_mesh_realistic.js'), 'utf8');
eval(scriptContent);

const generator = window.GreenhouseBrainMeshRealistic;

function runValidation() {
    console.log('--- Brain Mesh Validation ---');

    const brain = generator.generateRealisticBrain();

    // 1. Structural Checks
    console.log(`Vertices: ${brain.vertices.length}`);
    console.log(`Faces: ${brain.faces.length}`);

    if (brain.vertices.length === 0) throw new Error('No vertices generated');
    if (brain.faces.length === 0) throw new Error('No faces generated');

    // 2. Region Coverage
    const allRegions = Object.keys(brain.regions);
    const regionsWithVertices = allRegions.filter(r => brain.regions[r].vertices.length > 0);
    const regionsWithoutVertices = allRegions.filter(r => brain.regions[r].vertices.length === 0);

    console.log(`Regions with vertices: ${regionsWithVertices.length} / ${allRegions.length}`);
    if (regionsWithoutVertices.length > 0) {
        console.log(`Missing regions: ${regionsWithoutVertices.join(', ')}`);
    }

    const expectedRegions = [
        'corpusCallosum', 'pituitaryGland', 'mammillaryBody',
        'thalamus', 'hypothalamus', 'cerebellum', 'brainstem', 'lateralVentricle'
    ];

    expectedRegions.forEach(region => {
        if (brain.regions[region].vertices.length === 0) {
            console.warn(`Warning: Region ${region} has no vertices assigned.`);
            // Find closest vertex to expected center
            let minVal = 1000;
            brain.vertices.slice(0, 100).forEach(v => {
                 const d = Math.sqrt(v.x**2 + v.y**2 + v.z**2);
                 if (d < minVal) minVal = d;
            });
            console.log(`Smallest vertex radius sample: ${minVal}`);
        } else {
            console.log(`✅ Region ${region} has ${brain.regions[region].vertices.length} vertices.`);
        }
    });

    // 3. Color and Alpha Check
    console.log('Checking Color and Alpha (20% alpha)...');
    for (const key in brain.regions) {
        const color = brain.regions[key].color;
        if (!color.includes('0.2)')) {
            throw new Error(`Region ${key} does not have 0.2 alpha: ${color}`);
        }
    }
    console.log('✅ All regions have 0.2 alpha.');

    // 4. Face Integrity
    console.log('Checking face indices...');
    brain.faces.forEach((face, i) => {
        face.forEach(idx => {
            if (idx < 0 || idx >= brain.vertices.length) {
                throw new Error(`Face ${i} has invalid vertex index: ${idx}`);
            }
        });
    });
    console.log('✅ Face indices are valid.');

    console.log('--- Validation Passed ---');
}

try {
    runValidation();
} catch (error) {
    console.error('❌ Validation Failed:', error.message);
    process.exit(1);
}
