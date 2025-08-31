const fs = require('fs');
const path = require('path');

const unitTestsDir = path.join(__dirname, 'unit'); // Path to unit tests

function runUnitTests() {
    console.log('--- Running Native Unit Tests ---');
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    const testFiles = fs.readdirSync(unitTestsDir).filter(file => file.endsWith('.test.js'));

    testFiles.forEach(file => {
        const testFilePath = path.join(unitTestsDir, file);
        console.log(`\nRunning ${file}...`);
        try {
            // Clear module cache to ensure fresh execution for each test file
            delete require.cache[require.resolve(testFilePath)];
            require(testFilePath); // Execute the test file
            passedTests++; // Assuming the test file throws an error on failure
            console.log(`${file} PASSED`);
        } catch (error) {
            failedTests++;
            console.error(`${file} FAILED:`, error.message);
        }
        totalTests++;
    });

    console.log('\n--- Unit Test Summary ---');
    console.log(`Total: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
        console.error('Some unit tests failed.');
        process.exit(1);
    } else {
        console.log('All unit tests passed!');
    }
}

runUnitTests();
