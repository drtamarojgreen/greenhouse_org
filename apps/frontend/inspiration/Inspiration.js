// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/inspiration.json";

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
            $w("#pageTitle").text = data.summary.pageTitle;
            $w("#pageTitleButton").label = data.summary.titleButton;
            $w("#titleRightPanelText").text = data.summary.sectionText;

            // Populate Section 2 Title and Subtitle
            $w("#Section2RegularTitle1").text = data.summary.sectionTitle;
            $w("#Section2RegularSubtitle1").text = data.summary.sectionSubtitle;

            // The #Section2RegularLongtext1 is now replaced by the repeater, so we collapse it.
            $w("#Section2RegularLongtext1").collapse();


            // Populate inspiration repeater
            // We add a unique _id to each item for the repeater to work correctly.
            const quotes = data.quotes.map((quote, index) => ({...quote, _id: String(index)}));
            $w("#inspirationRepeater").data = quotes;

            $w("#inspirationRepeater").onItemReady(($item, itemData, index) => {
                $item("#textQuote").text = itemData.text;
                $item("#textAuthor").text = itemData.author;
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
        });
});
