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
            const books = data.books;
            $w("#booksRepeater").data = books;

            $w("#booksRepeater").onItemReady(($item, itemData, index) => {
                $item("#bookTitle").text = itemData.title;
                $item("#bookAuthor").text = itemData.author;
                $item("#bookDescription").text = itemData.description;
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // You could display an error message to the user on the page
            // For example: $w("#errorMessage").text = "Could not load books.";
            // $w("#errorMessage").show();
        });
});
