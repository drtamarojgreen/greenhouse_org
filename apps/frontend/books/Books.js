// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/books/main.json";

    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            const books = data.items;
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
