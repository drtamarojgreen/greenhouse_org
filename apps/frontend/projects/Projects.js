// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { fetch } from 'wix-fetch';

$w.onReady(function () {

	// Write your Javascript code here using the Velo framework API

	// Print hello world:
	// console.log("Hello world!");

	// Call functions on page elements, e.g.:
	// $w("#button1").label = "Click me!";

	// Click "Run", or Preview your site, to execute your code
    // The URL of the JSON file you will host on GitHub Pages.
    const url = "https://drtamarojgreen.github.io/greenhouse_org/endpoints/main.json";
	
    fetch(url, { method: 'get' })
        .then((httpResponse) => {
            if (httpResponse.ok) {
                return httpResponse.json();
            } else {
                // Handle non-successful responses
                return Promise.reject("Fetch not successful");
            }
        })
        .then((data) => {
            // Populate the header elements
            $w("#Section1ListHeaderTitle1").text = data.header.title;
            $w("#Section1ListHeaderLongText1").text = data.header.longText;

            // Populate the interstitial text elements
            $w("#text1").text = data.interstitialTexts.text1;
            $w("#text2").text = data.interstitialTexts.text2;
            $w("#text3").text = data.interstitialTexts.text3;
            $w("#text4").text = data.interstitialTexts.text4;

            // Populate the list items
            // Item 1
            if (data.items[0]) {
                $w("#Section2ListItem1Title1").text = data.items[0].title;
                $w("#Section2ListItem1Longtext1").text = data.items[0].longText;
                $w("#Section2ListItem1MediaImage1").src = data.items[0].imageUrl;
            }
            // Item 2
            if (data.items[1]) {
                $w("#Section2ListItem2Title1").text = data.items[1].title;
                $w("#Section2ListItem2Longtext1").text = data.items[1].longText;
                $w("#Section2ListItem2MediaImage1").src = data.items[1].imageUrl;
            }
            // Item 3
            if (data.items[2]) {
                $w("#Section2ListItem3Title1").text = data.items[2].title;
                $w("#Section2ListItem3Longtext1").text = data.items[2].longText;
                $w("#Section2ListItem3MediaImage1").src = data.items[2].imageUrl;
            }
            // Item 4
            if (data.items[3]) {
                $w("#Section2ListItem4Title1").text = data.items[3].title;
                $w("#Section2ListItem4Longtext1").text = data.items[3].longText;
                $w("#Section2ListItem4MediaImage1").src = data.items[3].imageUrl;
            }
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // You could also display an error message to the user on the page
            // For example: $w("#errorMessage").text = "Could not load content.";
            // $w("#errorMessage").show();
        });
});