// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/news.json";

    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            // 1. Populate the static header elements using semantic selectors
            if (data.header) {
                $w("#Section1ListHeaderTitle1").text = data.header.title;
                $w("#Section1ListHeaderLongText1").text = data.header.longText;
            }

            // 2. Manually populate the repeater to avoid using .data and the _id requirement
            const articles = data.articles || [];
            const repeater = $w("#newsRepeater");

            repeater.forEachItem(($item, itemData, index) => {
                const article = articles[index];

                if (article) {
                    // If there is data for this item, populate it and ensure it's visible
                    $item("#newsHeadline").text = article.headline;
                    $item("#newsDate").text = article.date;
                    $item("#newsContent").text = article.content;
                    $item("#newsHeadline").expand(); // Use an element within the item to expand/collapse
                } else {
                    // If there is no data for this item, hide it
                    $item("#newsHeadline").collapse();
                }
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // Optional: Display an error message to the user on the page
        });
});
