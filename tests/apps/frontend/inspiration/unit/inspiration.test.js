const fs = require('fs');
const path = require('path');
const VeloMock = require('../../../../mocks/VeloMock');

// Mock Velo APIs
const veloMock = new VeloMock();
global.$w = veloMock.$w;
global.window = {
    $w: global.$w,
};

// Mock fetch
const mockFetch = (url) => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            summary: {
                pageTitle: "Inspiration",
                titleButton: "New Quote",
                sectionText: "Some text",
                sectionTitle: "Quotes",
                sectionSubtitle: "Some subtitle"
            },
            quotes: [
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

// --- Test Runner ---
async function runInspirationTests() {
    console.log('\n--- Running Inspiration.js Tests ---');
    seed = 0; // Reset the seed for Math.random

    global.fetch = mockFetch;
    global.wix_fetch = { fetch: mockFetch };

    const scriptPath = path.resolve(__dirname, '../../../../../apps/frontend/inspiration/Inspiration.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    try {
        eval(scriptContent);
    } catch (e) {
        assert(false, `Failed to evaluate Inspiration.js: ${e.message}`);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    // --- Assertions ---
    const quoteText = $w('#quote-text');
    const quoteAuthor = $w('#quote-author');

    // 1. Test initial quote display
    // On load, seed is 0, Math.random() is called, seed becomes 1, returns 1/3. Math.floor(1/3 * 3) = 1. quotes[1] is displayed.
    assert(quoteText.text.includes("Quote 2"), "The initial quote should be Quote 2.");
    assert(quoteAuthor.text.includes("Author 2"), "The initial author should be Author 2.");


    // 2. Test "new quote" button
    const newQuoteButton = $w('#new-quote-btn');
    newQuoteButton.onClick(); // Simulate a click
    // On first click, seed is 1, Math.random() is called, seed becomes 2, returns 2/3. Math.floor(2/3 * 3) = 2. quotes[2] is displayed.
    assert(quoteText.text.includes("Quote 3"), "The second quote should be displayed after the first click.");
    assert(quoteAuthor.text.includes("Author 3"), "The second author should be displayed after the first click.");

    // 3. Test another click to ensure it cycles
    newQuoteButton.onClick();
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
