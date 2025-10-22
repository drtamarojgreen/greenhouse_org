import { fetch } from 'wix-fetch';

$w.onReady(function () {
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
                $w("#Section1RegularLongtext1").text = data.summary.Section1RegularLongtext1;
                $w("#Section2RegularTitle1").text = data.summary.Section2RegularTitle1;
                $w("#Section2RegularSubtitle1").text = data.summary.Section2RegularSubtitle1;
                $w("#Section2RegularLongtext1").text = data.summary.Section2RegularLongtext1;
            }

            // Prepare books data with unique _id
            const books = Array.isArray(data.books)
                ? data.books.map((book, index) => ({ ...book, _id: String(index) }))
                : [];

            // Set repeater data
            $w("#Section2Regular").data = books;

            // Populate each repeater item
            $w("#Section2Regular").onItemReady(($item, itemData, index) => {
                $item("#bookTitle").text = itemData.title;
                $item("#bookAuthor").text = itemData.author;
                $item("#bookDescription").text = itemData.description;
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing data:", err);
            // Optional: show error message on page
            // $w("#errorMessage").text = "Could not load books.";
            // $w("#errorMessage").show();
        });
});
