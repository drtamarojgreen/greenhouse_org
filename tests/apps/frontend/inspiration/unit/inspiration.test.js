const path = require('path');
const VeloMock = require('../../../../mocks/VeloMock');
const initInspirationApp = require('../../../../../apps/frontend/inspiration/Inspiration.js');

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

    const veloMock = new VeloMock();
    const $w = veloMock.$w;

    // Initialize the app with the mock objects
    initInspirationApp($w, mockFetch);

    await new Promise(resolve => setTimeout(resolve, 0));

    // --- Assertions ---
    // 1. Test summary elements
    assert($w('#pageTitle').text === "Inspiration", "Page title should be set correctly.");
    assert($w('#pageTitleButton').label === "New Quote", "Page title button should be set correctly.");
    assert($w('#titleRightPanelText').text === "Some text", "Title right panel text should be set correctly.");
    assert($w('#Section2RegularTitle1').text === "Quotes", "Section 2 title should be set correctly.");
    assert($w('#Section2RegularSubtitle1').text === "Some subtitle", "Section 2 subtitle should be set correctly.");

    // 2. Test repeater data
    const repeater = $w('#inspirationRepeater');
    assert(repeater.data.length === 3, "Repeater data should be populated with 3 quotes.");
    if (repeater.data.length === 3) {
        assert(repeater.data[0].text === "Quote 1", "Text of the first quote should be correct.");
    }

    // 3. Test repeater item population
    const itemScopes = [];
    repeater.onItemReady(($item, itemData, index) => {
        const itemScope = {
            text: $item('#textQuote'),
            author: $item('#textAuthor'),
        };
        itemScope.text.text = itemData.text;
        itemScope.author.text = itemData.author;
        itemScopes.push(itemScope);
    });
    repeater._populateRepeater(repeater.data);

    assert(itemScopes.length === 3, "onItemReady should be called for each item.");
    if (itemScopes.length === 3) {
        assert(itemScopes[0].text.text === "Quote 1", "First repeater item's text is set correctly.");
        assert(itemScopes[0].author.text === "Author 1", "First repeater item's author is set correctly.");
        assert(itemScopes[1].text.text === "Quote 2", "Second repeater item's text is set correctly.");
        assert(itemScopes[1].author.text === "Author 2", "Second repeater item's author is set correctly.");
        assert(itemScopes[2].text.text === "Quote 3", "Third repeater item's text is set correctly.");
        assert(itemScopes[2].author.text === "Author 3", "Third repeater item's author is set correctly.");
    }

    // --- Test Summary ---
    console.log(`\n--- Inspiration.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more Inspiration.js tests failed.");
    }
}

runInspirationTests();
