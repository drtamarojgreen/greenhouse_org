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
            // Populate the header elements
            $w("#Section1RegularTitle1").text = data.header.title;
            $w("#Section1RegularLongtext1").text = data.header.longText;

            $w("#Section2RepeaterHeaderTitle1").text = data.header.title;

            // Populate the additional info section
            $w("#Section3RegularTitle1").text = data.header.sectionSubtitle;
            $w("#Section3RegularLongtext1").text = data.header.sectionText;

            // Populate news repeater
            const articles = data.articles.map(article => ({...article, _id: article.id}));
            $w("#newsRepeater").data = articles;

            $w("#newsRepeater").onItemReady(($item, itemData, index) => {
                $item("#Section2RepeaterItem1Title1").text = itemData.headline;
                $item("#Section2RepeaterItem1Longtext1").text = itemData.date + " - " + itemData.content;
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // You could display an error message to the user on the page
            // For example: $w("#errorMessage").text = "Could not load news.";
            // $w("#errorMessage").show();
        });
});
