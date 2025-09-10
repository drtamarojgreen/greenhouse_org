// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

let quotes = [];

$w.onReady(function () {
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/inspiration/main.json";

    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            quotes = data.items;
            displayQuote();
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            $w("#quote-text").text = "Could not load quotes.";
            $w("#quote-author").text = "";
        });

    $w("#new-quote-btn").onClick(() => {
        displayQuote();
    });
});

function displayQuote() {
    if (quotes.length > 0) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        $w("#quote-text").text = `"${quote.text}"`;
        $w("#quote-author").text = `- ${quote.author}`;
    } else {
        $w("#quote-text").text = "No quotes available.";
        $w("#quote-author").text = "";
    }
}
