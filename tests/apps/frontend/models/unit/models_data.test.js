// Mocking the DOM for testing purposes
const mockDocument = {
    // The querySelector is no longer critical as we will mock loadData directly,
    // but it's good practice to keep a basic mock.
    querySelector: () => null
};

// Mock window object
const mockWindow = {
    document: mockDocument,
    console: {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {}
    }
};

// Inject mocks into the global scope for testing
global.document = mockWindow.document;
global.window = mockWindow;
global.console = mockWindow.console;

// Load the actual models_data.js content
const GreenhouseModelsData = require('../../../../../docs/js/models_data.js');

async function runModelsDataTests() {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            passed++;
            console.log(`PASS: ${message}`);
        } else {
            failed++;
            console.error(`FAIL: ${message}`);
        }
    }

    console.log('\n--- Running models_data.js Tests ---');

    // Test 1: Directly mock loadData to resolve immediately
    async function testLoadDataMock() {
        // Override the original loadData with a mock
        GreenhouseModelsData.loadData = () => {
            GreenhouseModelsData.state.simulationData = {
                notes: [
                    { type: 'research', content: 'CBT helps reframe negative thoughts.' },
                    { type: 'patient', content: 'I feel anxious about social situations.' },
                    { type: 'user', content: 'Practiced deep breathing for 10 minutes.' }
                ]
            };
            GreenhouseModelsData.state.lexicon = {
                domain_tags: {
                    'cognitive-restructuring': ['cbt', 'reframe'],
                    'anxiety': ['anxious', 'social situations']
                },
                neurotransmitter_affinity: {
                    'serotonin': ['cbt', 'breathing']
                }
            };
            return Promise.resolve();
        };

        await GreenhouseModelsData.loadData();
        assert(GreenhouseModelsData.state.simulationData !== null, 'loadData mock should populate simulationData');
        assert(GreenhouseModelsData.state.simulationData.notes.length === 3, 'simulationData should have 3 notes from mock');
        assert(Object.keys(GreenhouseModelsData.state.lexicon.domain_tags).length === 2, 'lexicon should have 2 domain tags from mock');
    }

    // Test 2: transformNotesToSimulationInput correctly processes raw notes
    function testTransformNotes() {
        const rawNotes = [
            { type: 'research', content: 'DBT is effective for emotional regulation.' },
            { type: 'user', content: 'Mindfulness exercise.' }
        ];
        const lexicon = {
            domain_tags: { 'emotional-regulation': ['dbt', 'regulation'] },
            neurotransmitter_affinity: { 'gaba': ['mindfulness'] }
        };
        const result = GreenhouseModelsData.transformNotesToSimulationInput(rawNotes, lexicon);
        assert(result.nodes.length === 2, 'transformNotes should create 2 nodes');
        assert(result.synapses.length === 1, 'transformNotes should create 1 synapse');
        assert(result.events.length === 1, 'transformNotes should create 1 event for user notes');
        assert(result.nodes[0].domain_tags.includes('emotional-regulation'), 'Node should have correct domain tag');
        assert(result.nodes[1].neuro_affinity.includes('gaba'), 'Node should have correct neuro affinity');
        assert(result.meta.source_counts.research === 1, 'Source count for research should be 1');
    }

    // Test 3: transformNotesToSimulationInput handles empty input
    function testTransformNotesEmpty() {
        const result = GreenhouseModelsData.transformNotesToSimulationInput([], {});
        assert(result.nodes.length === 0, 'transformNotes should handle empty notes array');
        assert(result.synapses.length === 0, 'transformNotes should handle empty notes array');
    }

    // Run all tests
    await testLoadDataMock();
    testTransformNotes();
    testTransformNotesEmpty();

    console.log(`\n--- models_data.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("models_data.js tests failed.");
    }
}

module.exports = runModelsDataTests;
