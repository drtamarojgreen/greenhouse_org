const { execSync } = require('child_process');
const path = require('path');

const unitTestRunner = path.join(__dirname, 'run_unit_tests.js');
const bddTestRunner = path.join(__dirname, 'run_bdd_tests.js');

function runAllTests() {
    let overallSuccess = true;

    console.log('--- Running All Tests ---');

    try {
        console.log('\nStarting Unit Tests...');
        execSync(`node ${unitTestRunner}`, { stdio: 'inherit' });
        console.log('Unit Tests Completed Successfully.');
    } catch (error) {
        console.error('Unit Tests Failed.');
        overallSuccess = false;
    }

    try {
        console.log('\nStarting BDD Tests...');
        execSync(`node ${bddTestRunner}`, { stdio: 'inherit' });
        console.log('BDD Tests Completed Successfully.');
    } catch (error) {
        console.error('BDD Tests Failed.');
        overallSuccess = false;
    }

    console.log('\n--- Overall Test Result ---');
    if (overallSuccess) {
        console.log('All tests passed successfully!');
    } else {
        console.error('Some tests failed.');
        process.exit(1);
    }
}

runAllTests();
