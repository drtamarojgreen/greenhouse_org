const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = {};
function load(file) {
    const code = fs.readFileSync(path.join('docs/js', file), 'utf8');
    vm.runInThisContext(code);
}

load('models_3d_math.js');
load('brain_mesh_realistic.js');

const mesh = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
const centers = {};

// Get all unique regions in vertices
const regionSet = new Set();
mesh.vertices.forEach(v => regionSet.add(v.region));

regionSet.forEach(r => {
    let sum = {x:0, y:0, z:0};
    let count = 0;
    mesh.vertices.forEach(v => {
        if (v.region === r) {
            sum.x += v.x; sum.y += v.y; sum.z += v.z;
            count++;
        }
    });
    if (count > 0) {
        centers[r] = { x: sum.x/count, y: sum.y/count, z: sum.z/count };
    }
});

console.log(JSON.stringify(centers, null, 2));
