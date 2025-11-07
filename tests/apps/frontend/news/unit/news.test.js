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
            header: {
                title: "News Header Title",
                longText: "News header long text."
            },
            articles: [
                { headline: "Article 1", date: "2024-01-01", content: "Content 1" },
                { headline: "Article 2", date: "2024-01-02", content: "Content 2" }
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
async function runNewsTests() {
    console.log('\n--- Running News.js Tests ---');

    global.fetch = mockFetch;
    global.wix_fetch = { fetch: mockFetch };

    const scriptPath = path.resolve(__dirname, '../../../../../apps/frontend/news/News.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    try {
        eval(scriptContent.replace(/import { fetch } from 'wix-fetch';/, ''));
    } catch (e) {
        assert(false, `Failed to evaluate News.js: ${e.message}`);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    // --- Assertions ---
    // 1. Test header elements
    const headerTitle = $w('#Section1RegularTitle1');
    const headerLongText = $w('#Section1RegularLongtext1');
    assert(headerTitle.text === "News Header Title", "Header title should be set correctly.");
    assert(headerLongText.text === "News header long text.", "Header long text should be set correctly.");

    // 2. Test repeater data
    const repeater = $w('#newsRepeater');
    assert(repeater.data.length === 2, "Repeater data should be populated with 2 articles.");
    if (repeater.data.length === 2) {
        assert(repeater.data[0].headline === "Article 1", "Headline of the first article should be correct.");
    }

    // 3. Test repeater item population
    const itemScopes = [];
    repeater.onItemReady(($item, itemData, index) => {
        const itemScope = {
            title: $item('#Section2RepeaterItem1Title1'),
            content: $item('#Section2RepeaterItem1Longtext1'),
        };
        itemScope.title.text = itemData.headline;
        itemScope.content.text = itemData.date + " - " + itemData.content;
        itemScopes.push(itemScope);
    });
    repeater._populateRepeater(repeater.data);

    assert(itemScopes.length === 2, "onItemReady should be called for each item.");
    if (itemScopes.length === 2) {
        assert(itemScopes[0].title.text === "Article 1", "First repeater item's title is set correctly.");
        assert(itemScopes[0].content.text === "2024-01-01 - Content 1", "First repeater item's content is set correctly.");
        assert(itemScopes[1].title.text === "Article 2", "Second repeater item's title is set correctly.");
        assert(itemScopes[1].content.text === "2024-01-02 - Content 2", "Second repeater item's content is set correctly.");
    }

    // --- Test Summary ---
    console.log(`\n--- News.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more News.js tests failed.");
    }
}

runNewsTests();
