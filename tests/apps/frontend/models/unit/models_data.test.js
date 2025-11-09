const VeloMock = require('../../../../mocks/VeloMock');

// Mock window object and Velo API
const veloMock = new VeloMock();
global.$w = veloMock.$w;
global.window = {
    $w: global.$w,
};
global.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
};

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

    // Test 1: loadData successfully loads data from mock DOM
    async function testLoadDataFromMockDOM() {
        const mockVeloData = {
            notes: [
                { type: 'research', content: 'CBT helps reframe negative thoughts.' },
                { type: 'patient', content: 'I feel anxious about social situations.' },
                { type: 'user', content: 'Practiced deep breathing for 10 minutes.' }
            ],
            lexicon: {
                domain_tags: {
                    'cognitive-restructuring': ['cbt', 'reframe'],
                    'anxiety': ['anxious', 'social situations']
                },
                neurotransmitter_affinity: {
                    'serotonin': ['cbt', 'breathing']
                }
            }
        };

        // Create the mock element that the application code expects
        veloMock.createElement('dataHolder', {
            dataset: {
                customHolder: JSON.stringify(mockVeloData)
            }
        });

        // Mock the querySelector to return the element
        global.document = {
            querySelector: (selector) => {
                if (selector === 'section.wixui-section:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)') {
                    return veloMock.$w('#dataHolder');
                }
                return null;
            }
        };

        await GreenhouseModelsData.loadData();
        assert(GreenhouseModelsData.state.simulationData !== null, 'loadData should populate simulationData from mock DOM');
        assert(GreenhouseModelsData.state.simulationData.notes.length === 3, 'simulationData should have 3 notes from mock DOM');
        assert(Object.keys(GreenhouseModelsData.state.lexicon.domain_tags).length === 2, 'lexicon should have 2 domain tags from mock DOM');
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
    await testLoadDataFromMockDOM();
    testTransformNotes();
    testTransformNotesEmpty();
    testStrengthPriorAssignment();
    testNoMatchingTags();
    testMultipleTagAndAffinityExtraction();
    testUpdateFunction();
    testUpdateFunctionNoSynapses();

    console.log(`\n--- models_data.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("models_data.js tests failed.");
    }
}

function testStrengthPriorAssignment() {
    const rawNotes = [
        { type: 'research', content: 'Research note' },
        { type: 'patient', content: 'Patient note' },
        { type: 'user', content: 'User note' }
    ];
    const result = GreenhouseModelsData.transformNotesToSimulationInput(rawNotes, {});
    assert(result.nodes[0].strength_prior === 0.75, 'Research note should have strength_prior of 0.75');
    assert(result.nodes[1].strength_prior === 0.4, 'Patient note should have strength_prior of 0.4');
    assert(result.nodes[2].strength_prior === 0.2, 'User note should have strength_prior of 0.2');
}

function testNoMatchingTags() {
    const rawNotes = [{ type: 'research', content: 'A note with no matching tags' }];
    const lexicon = {
        domain_tags: { 'some-tag': ['some-keyword'] },
        neurotransmitter_affinity: { 'some-affinity': ['some-keyword'] }
    };
    const result = GreenhouseModelsData.transformNotesToSimulationInput(rawNotes, lexicon);
    assert(result.nodes[0].domain_tags.length === 0, 'Node should have no domain tags');
    assert(result.nodes[0].neuro_affinity.length === 0, 'Node should have no neuro affinity');
}

function testMultipleTagAndAffinityExtraction() {
    const rawNotes = [{ type: 'patient', content: 'Patient feels anxious about social cbt sessions.' }];
    const lexicon = {
        domain_tags: {
            'anxiety': ['anxious'],
            'cognitive-restructuring': ['cbt']
        },
        neurotransmitter_affinity: {
            'serotonin': ['cbt'],
            'dopamine': ['social']
        }
    };
    const result = GreenhouseModelsData.transformNotesToSimulationInput(rawNotes, lexicon);
    assert(result.nodes[0].domain_tags.length === 2, 'Node should have two domain tags');
    assert(result.nodes[0].domain_tags.includes('anxiety'), 'Node should include anxiety tag');
    assert(result.nodes[0].domain_tags.includes('cognitive-restructuring'), 'Node should include cognitive-restructuring tag');
    assert(result.nodes[0].neuro_affinity.length === 2, 'Node should have two neuro affinities');
    assert(result.nodes[0].neuro_affinity.includes('serotonin'), 'Node should include serotonin affinity');
    assert(result.nodes[0].neuro_affinity.includes('dopamine'), 'Node should include dopamine affinity');
}

function testUpdateFunction() {
    GreenhouseModelsData.state.processedSimulation = {
        synapses: [{ id: "syn-1", plasticity_rate: 0.01 }]
    };
    const initialState = { synapticWeight: 0.5, intensity: 50 };
    const updatedState = GreenhouseModelsData.update(initialState);
    assert(updatedState.synapticWeight > 0.5, 'Synaptic weight should increase after update');
}

function testUpdateFunctionNoSynapses() {
    GreenhouseModelsData.state.processedSimulation = { synapses: [] };
    const initialState = { synapticWeight: 0.5, intensity: 50 };
    const updatedState = GreenhouseModelsData.update(initialState);
    assert(updatedState.synapticWeight === 0.5, 'Synaptic weight should not change if there are no synapses');
}
module.exports = runModelsDataTests;
