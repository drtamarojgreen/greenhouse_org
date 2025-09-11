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
                        "#bookTitle": mockW.selector(`#bookTitle-${index}`),
                        "#bookAuthor": mockW.selector(`#bookAuthor-${index}`),
                        "#bookDescription": mockW.selector(`#bookDescription-${index}`),
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

function resetMocks() {
    mockW.elements = {};
    const repeater = mockW.createMockElement('#booksRepeater');
    mockW.elements['#booksRepeater'] = repeater;
}

// --- Test Runner ---
async function runBooksTests() {
    console.log('\n--- Running Books.js Tests ---');
    resetMocks();

    const wixSelector = mockW.selector.bind(mockW);
    wixSelector.onReady = mockW.onReady;
    global.$w = wixSelector;
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
    assert(mockW.selector('#text1').text === "Summary text 1", "Summary text1 should be set correctly.");
    assert(mockW.selector('#Section1RgularLongtext1').text === "Summary long text 1", "Summary long text 1 should be set correctly.");
    assert(mockW.selector('#Section2RegularTitle1').text === "Summary title 2", "Summary title 2 should be set correctly.");
    assert(mockW.selector('#Section2RegularSubtitle1').text === "Summary subtitle 2", "Summary subtitle 2 should be set correctly.");
    assert(mockW.selector('#Section2RegularLongtext1').text === "Summary long text 2", "Summary long text 2 should be set correctly.");


    // 2. Test repeater data
    const repeater = mockW.selector('#booksRepeater');
    assert(repeater.data.length === 2, "Repeater data should be populated with 2 books.");
    if (repeater.data.length === 2) {
        assert(repeater.data[0].title === "Book 1", "Title of the first book should be correct.");
    }

    // 3. Test repeater item population
    repeater._populateRepeater(repeater.data);
    const firstItemTitle = mockW.selector('#bookTitle-0');
    const firstItemAuthor = mockW.selector('#bookAuthor-0');
    const firstItemDescription = mockW.selector('#bookDescription-0');

    assert(firstItemTitle.text === "Book 1", "First repeater item's title is set correctly.");
    assert(firstItemAuthor.text === "Author 1", "First repeater item's author is set correctly.");
    assert(firstItemDescription.text === "Description 1", "First repeater item's description is set correctly.");

    // --- Test Summary ---
    console.log(`\n--- Books.js Test Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("One or more Books.js tests failed.");
    }
}

runBooksTests();
