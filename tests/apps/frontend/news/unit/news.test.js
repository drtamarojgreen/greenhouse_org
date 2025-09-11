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
            data: [],
            onItemReady: (callback) => {
                element.itemReadyCallback = callback;
            },
            _populateRepeater: function(items) {
                this.data = items;
                items.forEach((itemData, index) => {
                    const mockItemScope = {
                        "#newsHeadline": mockW.selector(`#newsHeadline-${index}`),
                        "#newsDate": mockW.selector(`#newsDate-${index}`),
                        "#newsContent": mockW.selector(`#newsContent-${index}`),
                    };
                    const itemSelector = (s) => mockItemScope[s];
                    if (this.itemReadyCallback) {
                        this.itemReadyCallback(itemSelector, itemData, index);
                    }
                });
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

function resetMocks() {
    mockW.elements = {};
    const repeater = mockW.createMockElement('#newsRepeater');
    mockW.elements['#newsRepeater'] = repeater;
}

// --- Test Runner ---
async function runNewsTests() {
    console.log('\n--- Running News.js Tests ---');
    resetMocks();

    const wixSelector = mockW.selector.bind(mockW);
    wixSelector.onReady = mockW.onReady;
    global.$w = wixSelector;
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
    const headerTitle = mockW.selector('#Section1ListHeaderTitle1');
    const headerLongText = mockW.selector('#Section1ListHeaderLongText1');
    assert(headerTitle.text === "News Header Title", "Header title should be set correctly.");
    assert(headerLongText.text === "News header long text.", "Header long text should be set correctly.");

    // 2. Test repeater data
    const repeater = mockW.selector('#newsRepeater');
    assert(repeater.data.length === 2, "Repeater data should be populated with 2 articles.");
    if (repeater.data.length === 2) {
        assert(repeater.data[0].headline === "Article 1", "Headline of the first article should be correct.");
    }

    // 3. Test repeater item population
    repeater._populateRepeater(repeater.data);
    const firstItemHeadline = mockW.selector('#newsHeadline-0');
    const firstItemDate = mockW.selector('#newsDate-0');
    const firstItemContent = mockW.selector('#newsContent-0');

    assert(firstItemHeadline.text === "Article 1", "First repeater item's headline is set correctly.");
    assert(firstItemDate.text === "2024-01-01", "First repeater item's date is set correctly.");
    assert(firstItemContent.text === "Content 1", "First repeater item's content is set correctly.");

    // --- Test Summary ---
    console.log(`\n--- News.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more News.js tests failed.");
    }
}

runNewsTests();
