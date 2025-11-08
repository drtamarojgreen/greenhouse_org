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
                text1: "Summary text 1",
                Section1RgularLongtext1: "Summary long text 1",
                Section2RegularTitle1: "Summary title 2",
                Section2RegularSubtitle1: "Summary subtitle 2",
                Section2RegularLongtext1: "Summary long text 2"
            },
            books: [
                { title: "Book 1", author: "Author 1", description: "Description 1" },
                { title: "Book 2", author: "Author 2", description: "Description 2" }
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
async function runBooksTests() {
    console.log('\n--- Running Books.js Tests ---');

    global.fetch = mockFetch;
    global.wix_fetch = { fetch: mockFetch };

    const scriptPath = path.resolve(__dirname, '../../../../../apps/frontend/books/Books.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    try {
        eval(scriptContent.replace(/import { fetch } from 'wix-fetch';/, ''));
    } catch (e) {
        assert(false, `Failed to evaluate Books.js: ${e.message}`);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    // --- Assertions ---
    // 1. Test summary elements
    assert($w('#text1').text === "Summary text 1", "Summary text1 should be set correctly.");
    assert($w('#Section1RegularLongtext1').text === "Summary long text 1", "Summary long text 1 should be set correctly.");
    assert($w('#Section2RegularTitle1').text === "Summary title 2", "Summary title 2 should be set correctly.");
    assert($w('#Section2RegularSubtitle1').text === "Summary subtitle 2", "Summary subtitle 2 should be set correctly.");
    assert($w('#Section2RegularLongtext1').text === "Summary long text 2", "Summary long text 2 should be set correctly.");


    // 2. Test repeater data
    const repeater = $w('#Section2Regular');
    assert(repeater.data.length === 2, "Repeater data should be populated with 2 books.");
    if (repeater.data.length === 2) {
        assert(repeater.data[0].title === "Book 1", "Title of the first book should be correct.");
    }

    // 3. Test repeater item population
    const itemScopes = [];
    repeater.onItemReady(($item, itemData, index) => {
        const itemScope = {
            title: $item('#bookTitle'),
            author: $item('#bookAuthor'),
            description: $item('#bookDescription'),
        };
        itemScope.title.text = itemData.title;
        itemScope.author.text = itemData.author;
        itemScope.description.text = itemData.description;
        itemScopes.push(itemScope);
    });
    repeater._populateRepeater(repeater.data);

    assert(itemScopes.length === 2, "onItemReady should be called for each item.");
    if (itemScopes.length === 2) {
        assert(itemScopes[0].title.text === "Book 1", "First repeater item's title is set correctly.");
        assert(itemScopes[0].author.text === "Author 1", "First repeater item's author is set correctly.");
        assert(itemScopes[0].description.text === "Description 1", "First repeater item's description is set correctly.");
        assert(itemScopes[1].title.text === "Book 2", "Second repeater item's title is set correctly.");
        assert(itemScopes[1].author.text === "Author 2", "Second repeater item's author is set correctly.");
        assert(itemScopes[1].description.text === "Description 2", "Second repeater item's description is set correctly.");
    }

    // --- Test Summary ---
    console.log(`\n--- Books.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more Books.js tests failed.");
    }
}

runBooksTests();
