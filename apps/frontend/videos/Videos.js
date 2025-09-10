// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/videos/main.json";

    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            const videos = data.items;
            $w("#videosRepeater").data = videos;

            $w("#videosRepeater").onItemReady(($item, itemData, index) => {
                $item("#videoTitle").text = itemData.title;
                $item("#videoPlayer").src = itemData.embedUrl;
                $item("#videoDescription").text = itemData.description;
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // You could display an error message to the user on the page
            // For example: $w("#errorMessage").text = "Could not load videos.";
            // $w("#errorMessage").show();
        });
});
