const fs = require('fs');
const path = require('path');

// Mock Velo APIs
const mockW = {
    onReady: (callback) => {
        // In a real Velo environment, this is called when the page is ready.
        // For our test, we'll call it immediately to trigger the script's logic.
        callback();
    },

    // This is our mock selector function. It will return mock elements.
    selector: function(selector) {
        if (!this.elements[selector]) {
            this.elements[selector] = this.createMockElement(selector);
        }
        return this.elements[selector];
    },

    // A store for all the mock elements we create.
    elements: {},

    // A factory for creating mock elements.
    createMockElement: function(selector) {
        const element = {
            _id: selector,
            text: '',
            src: '',
            data: [],
            onItemReady: (callback) => {
                element.itemReadyCallback = callback;
            },
            // A helper to simulate the repeater behavior.
            _populateRepeater: function(items) {
                this.data = items;
                // Simulate onItemReady for each item.
                items.forEach((itemData, index) => {
                    const mockItem = {
                        "#videoTitle": this.createMockElement("#videoTitle"),
                        "#videoPlayer": this.createMockElement("#videoPlayer"),
                        "#videoDescription": this.createMockElement("#videoDescription"),
                    };
                    const itemSelector = (s) => mockItem[s];
                    this.itemReadyCallback(itemSelector, itemData, index);
                });
            }
        };
        // If the selector is for the repeater, add the populate helper.
        if (selector === '#videosRepeater') {
            element.data = []; // Repeater's data property
        }
        return element;
    }
};

// Mock the global fetch function.
const mockFetch = (url) => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            items: [
                { title: "Video 1", embedUrl: "http://example.com/video1", description: "Description 1" },
                { title: "Video 2", embedUrl: "http://example.com/video2", description: "Description 2" }
            ]
        })
    });
};

// --- Test Setup ---
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

function resetMocks() {
    mockW.elements = {};
    // Re-create the repeater mock for each test run.
    const repeater = mockW.createMockElement('#videosRepeater');
    repeater._populateRepeater = function(items) {
        this.data = items;
        // Simulate onItemReady for each item.
        items.forEach((itemData, index) => {
            const mockItemScope = {
                        "#videoTitle": mockW.selector(`#videoTitle-${index}`),
                        "#videoPlayer": mockW.selector(`#videoPlayer-${index}`),
                        "#videoDescription": mockW.selector(`#videoDescription-${index}`),
            };
            const itemSelector = (s) => mockItemScope[s];
            if(this.itemReadyCallback) {
                this.itemReadyCallback(itemSelector, itemData, index);
            }
        });
    };
    mockW.elements['#videosRepeater'] = repeater;
}

// --- Test Runner ---
async function runVideoTests() {
    console.log('\n--- Running Videos.js Tests ---');
    resetMocks();

    // Make the mocks available in the global scope for the script under test.
    const wixSelector = mockW.selector.bind(mockW);
    wixSelector.onReady = mockW.onReady;
    global.$w = wixSelector;
    global.fetch = mockFetch;
    // The Velo 'import' syntax for fetch is just syntactic sugar at the top level.
    // By the time the code runs, 'fetch' is expected to be a global function.
    global.wix_fetch = { fetch: mockFetch };


    // Load the Videos.js script content from the file.
    const scriptPath = path.resolve(__dirname, '../../../../../apps/frontend/videos/Videos.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Execute the script. This will call $w.onReady, which triggers our test setup.
    // We wrap it in a try...catch block to handle syntax errors in the script itself.
    try {
        eval(scriptContent.replace(/import { fetch } from 'wix-fetch';/, ''));
    } catch (e) {
        assert(false, `Failed to evaluate Videos.js: ${e.message}`);
        return; // Stop the test if the script fails to load
    }


    // The script's logic is asynchronous (due to fetch). We need to wait for promises to resolve.
    // A microtask delay should be enough.
    await new Promise(resolve => setTimeout(resolve, 0));

    // --- Assertions ---
    const repeater = mockW.selector('#videosRepeater');

    // 1. Test if the repeater's data was set.
    assert(repeater.data.length === 2, "Repeater data should be populated with 2 video items.");
    if (repeater.data.length === 2) {
        assert(repeater.data[0].title === "Video 1", "The title of the first video item should be correct.");
    }

    // 2. Test if the onItemReady callback correctly populates the elements.
    // To do this, we need to manually trigger the population based on the set data.
    repeater._populateRepeater(repeater.data);

    const firstItemTitle = mockW.selector('#videoTitle-0');
    const firstItemPlayer = mockW.selector('#videoPlayer-0');
    const firstItemDesc = mockW.selector('#videoDescription-0');
    const secondItemTitle = mockW.selector('#videoTitle-1');

    assert(firstItemTitle.text === "Video 1", "First repeater item's title text is set correctly.");
    assert(firstItemPlayer.src === "http://example.com/video1", "First repeater item's player src is set correctly.");
    assert(firstItemDesc.text === "Description 1", "First repeater item's description text is set correctly.");
    assert(secondItemTitle.text === "Video 2", "Second repeater item's title text is set correctly.");

    // --- Test Summary ---
    console.log(`\n--- Videos.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more Videos.js tests failed.");
    }
}

// Run the tests
runVideoTests();
