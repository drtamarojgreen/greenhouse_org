const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const newQuoteBtn = document.getElementById('new-quote-btn');

let quotes = []; // Will store fetched quotes

async function fetchQuotes() {
    try {
        const response = await fetch('/_function/getInspiration');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        quotes = data.items; // Assuming the backend returns { items: [...] }
        displayQuote(); // Display a quote once fetched
    } catch (error) {
        console.error("Error fetching quotes:", error);
        quoteText.textContent = "Failed to load quotes.";
        quoteAuthor.textContent = "";
    }
}

function getRandomQuote() {
    if (quotes.length === 0) return { text: "No quotes available.", author: "" };
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function displayQuote() {
    const { text, author } = getRandomQuote();
    quoteText.textContent = `"${text}"`;
    quoteAuthor.textContent = `- ${author}`;
}

newQuoteBtn.addEventListener('click', displayQuote);

// Fetch and display initial quote
fetchQuotes();