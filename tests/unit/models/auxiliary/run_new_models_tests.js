const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testFiles = [
    'test_models_page_new.js',
    'test_neuro_page_new.js',
    'test_genetic_page_new.js',
    'test_synapse_page_new.js',
    'test_pathway_page_new.js',
    'test_neuro_page_full.js'
];

console.log('--- Running New Models Page Unit Tests ---');

let allPassed = true;

for (const file of testFiles) {
    console.log(`\n> Running ${file}...`);
    try {
        execSync(`node ${path.join(__dirname, file)}`, { stdio: 'inherit' });
        console.log(`✓ ${file} passed`);
    } catch (error) {
        console.error(`✗ ${file} failed`);
        allPassed = false;
    }
}

if (allPassed) {
    console.log('\n✅ All new models tests passed!');
} else {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
}
