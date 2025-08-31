const fs = require('fs');
const path = require('path');

const bddFeaturesDir = path.join(__dirname, 'bdd');
const stepDefinitionsPath = path.join(bddFeaturesDir, 'step_definitions', 'example_steps.js'); // Assuming one step def file for now

function runBddTests() {
    console.log('--- Running Native BDD Tests ---');
    let totalScenarios = 0;
    let passedScenarios = 0;
    let failedScenarios = 0;

    const stepDefinitions = require(stepDefinitionsPath);

    const featureFiles = fs.readdirSync(bddFeaturesDir).filter(file => file.endsWith('.feature'));

    featureFiles.forEach(file => {
        const featureFilePath = path.join(bddFeaturesDir, file);
        const featureContent = fs.readFileSync(featureFilePath, 'utf8');
        const lines = featureContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let currentScenario = null;
        let scenarioPassed = true;

        lines.forEach(line => {
            if (line.startsWith('Feature:')) {
                console.log(`Feature: ${line.substring(8).trim()}`);
            } else if (line.startsWith('Scenario:')) {
                if (currentScenario !== null) { // End of previous scenario
                    if (scenarioPassed) {
                        passedScenarios++;
                        console.log(`  Scenario: "${currentScenario}" PASSED`);
                    } else {
                        failedScenarios++;
                        console.error(`  Scenario: "${currentScenario}" FAILED`);
                    }
                }
                currentScenario = line.substring(9).trim();
                scenarioPassed = true; // Reset for new scenario
                totalScenarios++;
                console.log(`\n  Scenario: ${currentScenario}`);
            } else if (currentScenario !== null) {
                const parts = line.split(' ');
                const keyword = parts[0];
                const stepText = parts.slice(1).join(' ');

                const stepFunction = stepDefinitions[stepText];

                if (stepFunction) {
                    try {
                        stepFunction();
                        console.log(`    ${keyword} ${stepText} - PASSED`);
                    } catch (error) {
                        console.error(`    ${keyword} ${stepText} - FAILED:`, error.message);
                        scenarioPassed = false;
                    }
                } else {
                    console.error(`    ${keyword} ${stepText} - FAILED: No step definition found for "${stepText}"`);
                    scenarioPassed = false;
                }
            }
        });

        // Handle the last scenario in the file
        if (currentScenario !== null) {
            if (scenarioPassed) {
                passedScenarios++;
                console.log(`  Scenario: "${currentScenario}" PASSED`);
            } else {
                failedScenarios++;
                console.error(`  Scenario: "${currentScenario}" FAILED`);
            }
        }
    });

    console.log('\n--- BDD Test Summary ---');
    console.log(`Total Scenarios: ${totalScenarios}`);
    console.log(`Passed Scenarios: ${passedScenarios}`);
    console.log(`Failed Scenarios: ${failedScenarios}`);

    if (failedScenarios > 0) {
        console.error('Some BDD scenarios failed.');
        process.exit(1);
    } else {
        console.log('All BDD scenarios passed!');
    }
}

runBddTests();
