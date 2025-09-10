// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/news/main.json";

    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            const articles = data.items;
            $w("#newsRepeater").data = articles;

            $w("#newsRepeater").onItemReady(($item, itemData, index) => {
                $item("#newsTitle").text = itemData.title;
                $item("#newsTitle").link = itemData.url;
                $item("#newsSource").text = itemData.source;
                $item("#newsDate").text = itemData.date;
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // You could display an error message to the user on the page
            // For example: $w("#errorMessage").text = "Could not load news.";
            // $w("#errorMessage").show();
        });
});
