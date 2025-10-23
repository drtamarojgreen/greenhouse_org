// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    // Assuming books_data.json is accessible via a relative path or a Velo data collection
    // For a local file in the same directory, you might need a backend function or direct import in a Velo environment.
    // For demonstration, we'll simulate fetching from a local JSON.
    // In a real Velo environment, you would likely use wixData or a web module to get this data.
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/books.json";

    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            // Populate summary sections
            if (data.summary) {
                $w("#text1").text = data.summary.text1;
                $w("#Section1RgularLongtext1").text = data.summary.Section1RgularLongtext1;
                $w("#Section2RegularTitle1").text = data.summary.Section2RegularTitle1;
                $w("#Section2RegularSubtitle1").text = data.summary.Section2RegularSubtitle1;
                $w("#Section2RegularLongtext1").text = data.summary.Section2RegularLongtext1;
            }

            // Populate books repeater
            // 1. FIX: Add a unique `_id` to each book object to satisfy the repeater's data requirement.
            const books = data.books.map((book, index) => {
                return {
                    ...book,
                    _id: String(index) // Using the index as a simple unique ID
                };
            });

            // Set the repeater data. This will trigger onItemReady for each item.
            // Assumes the repeater is the only Repeater element on the page.
            $w("Repeater").data = books;

            $w("Repeater").onItemReady(($item, itemData, index) => {
                // 2. FIX: Select text elements by type and populate them by their assumed order.
                // This is fragile and depends on the element order in the Wix Editor.
                // Assumed Order: [0] = Title, [1] = Author, [2] = Description

                // Select all text elements within the current repeater item
                const textElements = $item("Text");

                if (textElements.length >= 3) {
                    textElements[0].text = itemData.title;       // First Text element is the Title
                    textElements[1].text = itemData.author;      // Second Text element is the Author
                    textElements[2].text = itemData.description; // Third Text element is the Description
                }
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // You could display an error message to the user on the page
            // For example: $w("#errorMessage").text = "Could not load books.";
            // $w("#errorMessage").show();
        });
});
