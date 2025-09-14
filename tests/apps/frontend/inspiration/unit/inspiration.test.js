const fs = require('fs');
const path = require('path');

// Mock Velo APIs
const mockW = {
    onReady: (callback) => {
        callback();
    },
    selector: function(selector) {
        if (!this.elements[selector]) {
            this.elements[selector] = this.createMockElement(selector);
        }
        return this.elements[selector];
    },
    elements: {},
    createMockElement: function(selector) {
        const element = {
            _id: selector,
            text: '',
            onClick: (callback) => {
                element.clickCallback = callback;
            },
            _click: () => {
                if (element.clickCallback) {
                    element.clickCallback();
                }
            }
        };
        return element;
    }
};

// Mock fetch
const mockFetch = (url) => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            items: [
                { text: "Quote 1", author: "Author 1" },
                { text: "Quote 2", author: "Author 2" },
                { text: "Quote 3", author: "Author 3" }
            ]
        })
    });
};

// Mock Math.random to be predictable
let seed = 0;
Math.random = () => {
    seed = (seed + 1) % 3; // Cycle through 0, 1, 2
    return seed / 3;
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
    seed = 0; // Reset the seed for Math.random
}

// --- Test Runner ---
async function runInspirationTests() {
    console.log('\n--- Running Inspiration.js Tests ---');
    resetMocks();

    const wixSelector = mockW.selector.bind(mockW);
    wixSelector.onReady = mockW.onReady;
    global.$w = wixSelector;
    global.fetch = mockFetch;
    global.wix_fetch = { fetch: mockFetch };

    const scriptPath = path.resolve(__dirname, '../../../../../apps/frontend/inspiration/Inspiration.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    try {
        eval(scriptContent.replace(/import { fetch } from 'wix-fetch';/, ''));
    } catch (e) {
        assert(false, `Failed to evaluate Inspiration.js: ${e.message}`);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    // --- Assertions ---
    const quoteText = mockW.selector('#quote-text');
    const quoteAuthor = mockW.selector('#quote-author');

    // 1. Test initial quote display
    // On load, seed is 0, Math.random() is called, seed becomes 1, returns 1/3. Math.floor(1/3 * 3) = 1. quotes[1] is displayed.
    assert(quoteText.text.includes("Quote 2"), "The initial quote should be Quote 2.");
    assert(quoteAuthor.text.includes("Author 2"), "The initial author should be Author 2.");


    // 2. Test "new quote" button
    const newQuoteButton = mockW.selector('#new-quote-btn');
    newQuoteButton._click(); // Simulate a click
    // On first click, seed is 1, Math.random() is called, seed becomes 2, returns 2/3. Math.floor(2/3 * 3) = 2. quotes[2] is displayed.
    assert(quoteText.text.includes("Quote 3"), "The second quote should be displayed after the first click.");
    assert(quoteAuthor.text.includes("Author 3"), "The second author should be displayed after the first click.");

    // 3. Test another click to ensure it cycles
    newQuoteButton._click();
    // On second click, seed is 2, Math.random() is called, seed becomes 0, returns 0. Math.floor(0 * 3) = 0. quotes[0] is displayed.
    assert(quoteText.text.includes("Quote 1"), "The third quote should be displayed after the second click.");
    assert(quoteAuthor.text.includes("Author 1"), "The third author should be displayed after the second click.");


    // --- Test Summary ---
    console.log(`\n--- Inspiration.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more Inspiration.js tests failed.");
    }
}

runInspirationTests();
